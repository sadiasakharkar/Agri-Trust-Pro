from __future__ import annotations

import json
import os
from pathlib import Path


def main() -> None:
    min_r2 = float(os.getenv("MRV_MIN_R2", "0.75"))
    max_mae = float(os.getenv("MRV_MAX_MAE", "1.2"))

    meta_path = Path(__file__).resolve().parents[1] / "app" / "models" / "artifacts" / "mrv_model_meta.json"
    if not meta_path.exists():
        raise SystemExit(f"Quality gate failed: missing artifact metadata at {meta_path}")

    meta = json.loads(meta_path.read_text(encoding="utf-8"))

    r2 = float(meta.get("r2", 0.0))
    mae = float(meta.get("mae", 999.0))

    if r2 < min_r2:
        raise SystemExit(f"Quality gate failed: r2={r2} < min_r2={min_r2}")
    if mae > max_mae:
        raise SystemExit(f"Quality gate failed: mae={mae} > max_mae={max_mae}")

    print(
        json.dumps(
            {
                "status": "pass",
                "r2": r2,
                "mae": mae,
                "min_r2": min_r2,
                "max_mae": max_mae,
                "model_version": meta.get("model_version", "unknown"),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
