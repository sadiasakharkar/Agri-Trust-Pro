from app.models.schemas import FarmProfile, PracticeType

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


def estimate_annual_co2e(profile: FarmProfile, practices: list[PracticeType], baseline_yield: float) -> tuple[float, float, str]:
    factor_sum = sum(PRACTICE_FACTORS[p] for p in practices)
    rainfall_factor = STATE_RAINFALL_FACTOR.get(profile.state.strip().lower(), 1.0)
    soil_factor = 1 + (profile.soil_organic_carbon_pct / 10)
    yield_factor = min(1.2, max(0.8, baseline_yield / 3.0))

    estimate = profile.farm_size_hectares * factor_sum * rainfall_factor * soil_factor * yield_factor
    confidence = min(0.95, 0.55 + 0.04 * len(practices))
    explanation = (
        "Hybrid estimation using farm size, state agro-climate proxy, soil carbon, and selected low-emission practices. "
        "For carbon credit issuance, attach satellite + soil test evidence and third-party verification."
    )
    return round(estimate, 2), round(confidence, 2), explanation
