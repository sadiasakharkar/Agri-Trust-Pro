from __future__ import annotations

import csv
import random
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[2] / "docs" / "datasets" / "sample_mrv_training_data.csv"


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def main() -> None:
    random.seed(42)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    rows = []
    for _ in range(400):
        farm_size = round(random.uniform(0.5, 5.5), 2)
        state_factor = round(random.uniform(0.9, 1.08), 3)
        soil = round(random.uniform(0.3, 1.8), 2)
        baseline_yield = round(random.uniform(1.0, 4.5), 2)
        practice_score = round(random.uniform(0.4, 2.3), 3)

        # Synthetic target shaped like expected MRV behavior with moderate noise.
        target = (
            farm_size
            * practice_score
            * state_factor
            * (1 + soil / 10)
            * clamp(baseline_yield / 3.0, 0.8, 1.3)
            + random.uniform(-0.18, 0.18)
        )
        rows.append(
            {
                "farm_size_hectares": farm_size,
                "state_factor": state_factor,
                "soil_organic_carbon_pct": soil,
                "baseline_yield_ton_per_hectare": baseline_yield,
                "practice_score": practice_score,
                "target_co2e": round(max(0.05, target), 3),
            }
        )

    with OUTPUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "farm_size_hectares",
                "state_factor",
                "soil_organic_carbon_pct",
                "baseline_yield_ton_per_hectare",
                "practice_score",
                "target_co2e",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUTPUT}")


if __name__ == "__main__":
    main()
