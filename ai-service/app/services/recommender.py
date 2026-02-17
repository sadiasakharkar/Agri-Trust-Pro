from app.models.schemas import PracticeType, RecommendationItem, RecommendationRequest

PRACTICE_COST_INR: dict[PracticeType, int] = {
    "no_till": 2500,
    "reduced_till": 1800,
    "cover_crop": 3200,
    "drip_irrigation": 22000,
    "organic_compost": 4500,
    "agroforestry": 12000,
    "biochar": 9000,
    "residue_retention": 1600,
}

PRACTICE_RATIONALE: dict[PracticeType, str] = {
    "no_till": "Reduces soil disturbance and preserves carbon in topsoil.",
    "reduced_till": "Lowers fuel use and improves soil structure with lower equipment cost.",
    "cover_crop": "Adds biomass, suppresses weeds, and increases soil organic carbon.",
    "drip_irrigation": "Improves water-use efficiency and can reduce methane in waterlogged systems.",
    "organic_compost": "Builds soil carbon while improving nutrient retention.",
    "agroforestry": "Trees sequester carbon and diversify farmer income.",
    "biochar": "Locks carbon in stable form and can improve soil fertility.",
    "residue_retention": "Avoids stubble burning and preserves organic matter.",
}

OBJECTIVE_WEIGHT = {
    "carbon": {
        "agroforestry": 0.95,
        "biochar": 0.88,
        "cover_crop": 0.82,
        "no_till": 0.74,
        "organic_compost": 0.76,
        "reduced_till": 0.61,
        "residue_retention": 0.65,
        "drip_irrigation": 0.52,
    },
    "yield": {
        "organic_compost": 0.82,
        "drip_irrigation": 0.78,
        "cover_crop": 0.72,
        "biochar": 0.63,
        "agroforestry": 0.54,
        "residue_retention": 0.53,
        "reduced_till": 0.49,
        "no_till": 0.44,
    },
    "cost": {
        "residue_retention": 0.84,
        "reduced_till": 0.78,
        "no_till": 0.74,
        "cover_crop": 0.60,
        "organic_compost": 0.58,
        "biochar": 0.43,
        "agroforestry": 0.38,
        "drip_irrigation": 0.33,
    },
    "water": {
        "drip_irrigation": 0.92,
        "cover_crop": 0.68,
        "organic_compost": 0.64,
        "agroforestry": 0.62,
        "biochar": 0.51,
        "reduced_till": 0.45,
        "no_till": 0.41,
        "residue_retention": 0.39,
    },
}


def generate_recommendations(payload: RecommendationRequest) -> list[RecommendationItem]:
    ranking = OBJECTIVE_WEIGHT[payload.objective]
    candidates = [k for k in ranking if k not in payload.current_practices]
    sorted_candidates = sorted(candidates, key=lambda x: ranking[x], reverse=True)[:3]

    return [
        RecommendationItem(
            practice=practice,
            impact_score=round(ranking[practice], 2),
            rationale=PRACTICE_RATIONALE[practice],
            estimated_cost_inr_per_hectare=PRACTICE_COST_INR[practice],
        )
        for practice in sorted_candidates
    ]
