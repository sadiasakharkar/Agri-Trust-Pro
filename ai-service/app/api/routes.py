from fastapi import APIRouter, Header, HTTPException

from app.core.config import settings
from app.models.schemas import (
    MrvEstimateRequest,
    MrvEstimateResponse,
    RecommendationRequest,
    RecommendationResponse,
    VishnuWebhookRequest,
    VishnuWebhookResponse,
    VoiceIntentRequest,
    VoiceIntentResponse,
)
from app.services.mrv_engine import estimate_annual_co2e
from app.services.recommender import generate_recommendations
from app.services.voice_nlu import infer_intent

router = APIRouter()


@router.post("/mrv/estimate", response_model=MrvEstimateResponse)
def mrv_estimate(payload: MrvEstimateRequest) -> MrvEstimateResponse:
    estimate, confidence, explanation = estimate_annual_co2e(
        payload.profile,
        list(payload.practices),
        payload.baseline_yield_ton_per_hectare,
    )
    return MrvEstimateResponse(
        estimated_annual_co2e_tons=estimate,
        confidence_score=confidence,
        mrv_method="heuristic_v1_india_smallholder",
        explanation=explanation,
    )


@router.post("/recommendations", response_model=RecommendationResponse)
def recommendations(payload: RecommendationRequest) -> RecommendationResponse:
    recs = generate_recommendations(payload)
    note = (
        "Recommendations are adapted for Indian smallholder adoption constraints. "
        "Validate with local FPO/agronomist before farm-wide rollout."
    )
    return RecommendationResponse(recommendations=recs, advisory_note=note)


@router.post("/voice/intent", response_model=VoiceIntentResponse)
def voice_intent(payload: VoiceIntentRequest) -> VoiceIntentResponse:
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
