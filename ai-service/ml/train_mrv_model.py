from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

FEATURE_COLUMNS = [
    "farm_size_hectares",
    "state_factor",
    "soil_organic_carbon_pct",
    "baseline_yield_ton_per_hectare",
    "practice_score",
]
TARGET_COLUMN = "target_co2e"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train MRV model for Agri-Trust")
    parser.add_argument("--data", required=True, help="Path to CSV dataset")
    parser.add_argument(
        "--outdir",
        default="app/models/artifacts",
        help="Output directory for model artifact and metadata",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    data_path = Path(args.data)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_path)
    missing = [col for col in FEATURE_COLUMNS + [TARGET_COLUMN] if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=10,
        random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    metrics = {
        "mae": round(float(mean_absolute_error(y_test, preds)), 4),
        "r2": round(float(r2_score(y_test, preds)), 4),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "model_type": "RandomForestRegressor",
        "model_version": "mrv_rf_v1",
    }

    model_path = outdir / "mrv_model.joblib"
    meta_path = outdir / "mrv_model_meta.json"
    joblib.dump(model, model_path)
    meta_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print(json.dumps({"model": str(model_path), "metadata": str(meta_path), **metrics}, indent=2))


if __name__ == "__main__":
    main()
