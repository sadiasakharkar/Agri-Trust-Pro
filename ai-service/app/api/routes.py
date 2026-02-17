from fastapi import APIRouter, Depends, Header, HTTPException

from app.core.auth import CurrentUser, get_current_user, require_roles
from app.core.config import settings
from app.core.monitoring import metrics_store
from app.models.schemas import (
    EvidenceTransitionRequest,
    EvidenceTransitionResponse,
    EvidenceValidationRequest,
    EvidenceValidationResponse,
    MrvEstimateRequest,
    MrvEstimateResponse,
    RecommendationRequest,
    RecommendationResponse,
    VishnuWebhookRequest,
    VishnuWebhookResponse,
    VoiceIntentRequest,
    VoiceIntentResponse,
)
from app.services.data_quality import quality_score_from_warnings, quality_warnings
from app.services.evidence_validator import validate_evidence_payload
from app.services.evidence_workflow import validate_transition
from app.services.mrv_engine import estimate_annual_co2e
from app.services.recommender import generate_recommendations
from app.services.voice_nlu import infer_intent

router = APIRouter()


@router.post("/mrv/estimate", response_model=MrvEstimateResponse)
def mrv_estimate(payload: MrvEstimateRequest, _: CurrentUser = Depends(get_current_user)) -> MrvEstimateResponse:
    estimate, confidence, explanation, model_version = estimate_annual_co2e(
        payload.profile,
        list(payload.practices),
        payload.baseline_yield_ton_per_hectare,
    )
    metrics_store.record_model_usage(model_version)

    warnings = quality_warnings(payload.profile, list(payload.practices), payload.baseline_yield_ton_per_hectare)
    quality_score = quality_score_from_warnings(warnings)

    return MrvEstimateResponse(
        estimated_annual_co2e_tons=estimate,
        confidence_score=confidence,
        data_quality_score=quality_score,
        data_quality_warnings=warnings,
        mrv_method="hybrid_model_inference",
        model_version=model_version,
        explanation=explanation,
    )


@router.post("/mrv/evidence/validate", response_model=EvidenceValidationResponse)
def validate_evidence(
    payload: EvidenceValidationRequest,
    _: CurrentUser = Depends(get_current_user),
) -> EvidenceValidationResponse:
    valid, issues = validate_evidence_payload(payload.latitude, payload.longitude, payload.soil_organic_carbon_pct)
    recommendation = "Evidence set looks valid for next verifier review." if valid else "Please correct issues before submission."
    return EvidenceValidationResponse(valid=valid, issues=issues, recommendation=recommendation)


@router.post("/mrv/evidence/transition", response_model=EvidenceTransitionResponse)
def evidence_transition(
    payload: EvidenceTransitionRequest,
    _: CurrentUser = Depends(require_roles("verifier", "admin")),
) -> EvidenceTransitionResponse:
    # Current state lookup is mocked as 'submitted' here; replace with DB read in next iteration.
    from_status = "submitted"
    allowed, message = validate_transition(from_status, payload.to_status)
    return EvidenceTransitionResponse(
        evidence_id=payload.evidence_id,
        from_status=from_status,
        to_status=payload.to_status,
        allowed=allowed,
        message=message,
    )


@router.post("/recommendations", response_model=RecommendationResponse)
def recommendations(payload: RecommendationRequest, _: CurrentUser = Depends(get_current_user)) -> RecommendationResponse:
    recs = generate_recommendations(payload)
    note = (
        "Recommendations are adapted for Indian smallholder adoption constraints. "
        "Validate with local FPO/agronomist before farm-wide rollout."
    )
    return RecommendationResponse(recommendations=recs, advisory_note=note)


@router.post("/voice/intent", response_model=VoiceIntentResponse)
def voice_intent(payload: VoiceIntentRequest, _: CurrentUser = Depends(get_current_user)) -> VoiceIntentResponse:
    intent, confidence, response = infer_intent(payload)
    return VoiceIntentResponse(intent=intent, confidence=confidence, response_text=response)


@router.get("/ops/metrics")
def ops_metrics(_: CurrentUser = Depends(require_roles("admin", "verifier"))) -> dict[str, dict[str, int]]:
    return metrics_store.snapshot()


@router.post("/integrations/vishnu/webhook", response_model=VishnuWebhookResponse)
def vishnu_webhook(
    payload: VishnuWebhookRequest,
    x_vishnu_secret: str | None = Header(default=None),
) -> VishnuWebhookResponse:
    if x_vishnu_secret != settings.vishnu_webhook_secret:
        raise HTTPException(status_code=401, detail="Invalid Vishnu signature")

    intent, _, response = infer_intent(VoiceIntentRequest(transcript=payload.utterance, language=payload.language))
    return VishnuWebhookResponse(session_id=payload.session_id, reply=response, intent=intent)
