from fastapi import APIRouter, Depends, Header, HTTPException

from app.core.auth import CurrentUser, get_current_user
from app.core.config import settings
from app.models.schemas import (
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
from app.services.evidence_validator import validate_evidence_payload
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
    return MrvEstimateResponse(
        estimated_annual_co2e_tons=estimate,
        confidence_score=confidence,
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


@router.post("/integrations/vishnu/webhook", response_model=VishnuWebhookResponse)
def vishnu_webhook(
    payload: VishnuWebhookRequest,
    x_vishnu_secret: str | None = Header(default=None),
) -> VishnuWebhookResponse:
    if x_vishnu_secret != settings.vishnu_webhook_secret:
        raise HTTPException(status_code=401, detail="Invalid Vishnu signature")

    intent, _, response = infer_intent(VoiceIntentRequest(transcript=payload.utterance, language=payload.language))
    return VishnuWebhookResponse(session_id=payload.session_id, reply=response, intent=intent)
