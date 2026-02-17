from typing import Literal

from pydantic import BaseModel, Field, conlist


LanguageCode = Literal["en", "hi", "mr"]
CropType = Literal["wheat", "rice", "cotton", "sugarcane", "pulses", "millets", "other"]
PracticeType = Literal[
    "no_till",
    "reduced_till",
    "cover_crop",
    "drip_irrigation",
    "organic_compost",
    "agroforestry",
    "biochar",
    "residue_retention",
]

EvidenceStatus = Literal["draft", "submitted", "in_review", "approved", "rejected"]


class FarmProfile(BaseModel):
    farmer_id: str
    state: str = Field(..., description="Indian state name")
    district: str
    village: str | None = None
    farm_size_hectares: float = Field(..., gt=0)
    crop: CropType
    irrigation_type: Literal["rainfed", "flood", "drip", "sprinkler"]
    soil_organic_carbon_pct: float = Field(ge=0, le=10, default=0.7)
    language: LanguageCode = "hi"


class MrvEstimateRequest(BaseModel):
    profile: FarmProfile
    practices: conlist(PracticeType, min_length=1)
    baseline_yield_ton_per_hectare: float = Field(..., gt=0)


class MrvEstimateResponse(BaseModel):
    estimated_annual_co2e_tons: float
    confidence_score: float
    data_quality_score: float
    data_quality_warnings: list[str]
    mrv_method: str
    model_version: str
    explanation: str


class RecommendationRequest(BaseModel):
    profile: FarmProfile
    current_practices: list[PracticeType] = []
    objective: Literal["carbon", "yield", "cost", "water"] = "carbon"


class RecommendationItem(BaseModel):
    practice: PracticeType
    impact_score: float
    rationale: str
    estimated_cost_inr_per_hectare: int


class RecommendationResponse(BaseModel):
    recommendations: list[RecommendationItem]
    advisory_note: str


class VoiceIntentRequest(BaseModel):
    transcript: str = Field(min_length=2)
    language: LanguageCode = "hi"


class VoiceIntentResponse(BaseModel):
    intent: Literal["get_recommendations", "get_carbon_score", "unknown"]
    confidence: float
    response_text: str


class EvidenceValidationRequest(BaseModel):
    farmer_id: str
    latitude: float
    longitude: float
    soil_organic_carbon_pct: float = Field(ge=0, le=10)


class EvidenceValidationResponse(BaseModel):
    valid: bool
    issues: list[str]
    recommendation: str


class EvidenceTransitionRequest(BaseModel):
    evidence_id: str
    to_status: EvidenceStatus
    note: str | None = None


class EvidenceTransitionResponse(BaseModel):
    evidence_id: str
    from_status: EvidenceStatus
    to_status: EvidenceStatus
    allowed: bool
    message: str


class VishnuWebhookRequest(BaseModel):
    session_id: str
    utterance: str
    language: LanguageCode = "hi"


class VishnuWebhookResponse(BaseModel):
    session_id: str
    reply: str
    intent: str
