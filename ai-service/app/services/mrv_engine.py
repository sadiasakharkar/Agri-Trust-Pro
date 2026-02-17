from __future__ import annotations

import pandas as pd

from app.models.schemas import FarmProfile, PracticeType
from app.services.model_registry import load_mrv_metadata, load_mrv_model

PRACTICE_FACTORS: dict[PracticeType, float] = {
    "no_till": 0.42,
    "reduced_till": 0.31,
    "cover_crop": 0.45,
    "drip_irrigation": 0.22,
    "organic_compost": 0.38,
    "agroforestry": 0.81,
    "biochar": 0.69,
    "residue_retention": 0.33,
}

STATE_RAINFALL_FACTOR = {
    "maharashtra": 1.03,
    "punjab": 0.94,
    "haryana": 0.95,
    "uttar pradesh": 1.01,
    "karnataka": 1.06,
    "madhya pradesh": 1.02,
    "rajasthan": 0.91,
    "bihar": 1.05,
}


def _state_factor(state: str) -> float:
    return STATE_RAINFALL_FACTOR.get(state.strip().lower(), 1.0)


def _practice_score(practices: list[PracticeType]) -> float:
    return round(sum(PRACTICE_FACTORS[p] for p in practices), 4)


def _heuristic_estimate(profile: FarmProfile, practices: list[PracticeType], baseline_yield: float) -> tuple[float, float, str]:
    factor_sum = _practice_score(practices)
    rainfall_factor = _state_factor(profile.state)
    soil_factor = 1 + (profile.soil_organic_carbon_pct / 10)
    yield_factor = min(1.2, max(0.8, baseline_yield / 3.0))

    estimate = profile.farm_size_hectares * factor_sum * rainfall_factor * soil_factor * yield_factor
    confidence = min(0.95, 0.55 + 0.04 * len(practices))
    explanation = (
        "Hybrid estimation using farm size, state agro-climate proxy, soil carbon, and selected low-emission practices. "
        "For carbon credit issuance, attach satellite + soil test evidence and third-party verification."
    )
    return round(estimate, 2), round(confidence, 2), explanation


def estimate_annual_co2e(
    profile: FarmProfile, practices: list[PracticeType], baseline_yield: float
) -> tuple[float, float, str, str]:
    model = load_mrv_model()
    metadata = load_mrv_metadata()

    if model is None:
        estimate, confidence, explanation = _heuristic_estimate(profile, practices, baseline_yield)
        return estimate, confidence, explanation, "heuristic_v1_india_smallholder"

    features = pd.DataFrame(
        [
            {
                "farm_size_hectares": profile.farm_size_hectares,
                "state_factor": _state_factor(profile.state),
                "soil_organic_carbon_pct": profile.soil_organic_carbon_pct,
                "baseline_yield_ton_per_hectare": baseline_yield,
                "practice_score": _practice_score(practices),
            }
        ]
    )

    pred = float(model.predict(features)[0])
    model_version = metadata.get("model_version", "mrv_model_unknown")
    r2 = metadata.get("r2")
    confidence = 0.72 if r2 is None else max(0.55, min(0.95, 0.5 + (float(r2) / 2)))
    explanation = (
        "Model-based estimate generated from calibrated MRV features. "
        "For issuance-grade accounting, combine with verification evidence and approved methodology."
    )
    return round(max(0.0, pred), 2), round(confidence, 2), explanation, str(model_version)
