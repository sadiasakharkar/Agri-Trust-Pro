from __future__ import annotations

from app.models.schemas import FarmProfile, PracticeType


def quality_warnings(profile: FarmProfile, practices: list[PracticeType], baseline_yield: float) -> list[str]:
    warnings: list[str] = []

    if profile.farm_size_hectares > 8:
        warnings.append("Farm size exceeds typical smallholder range; verify land parcel data.")

    if baseline_yield < 1.2:
        warnings.append("Very low baseline yield detected; confirm crop and seasonal context.")

    if baseline_yield > 7.5:
        warnings.append("High baseline yield detected; check units and source records.")

    if profile.soil_organic_carbon_pct < 0.4:
        warnings.append("Low soil organic carbon value; consider retesting soil sample.")

    if len(practices) < 2:
        warnings.append("Single practice selected; confidence improves with richer management data.")

    return warnings


def quality_score_from_warnings(warnings: list[str]) -> float:
    score = max(0.45, 0.95 - (0.08 * len(warnings)))
    return round(score, 2)
