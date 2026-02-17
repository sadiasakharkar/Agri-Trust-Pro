from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib

ARTIFACT_DIR = Path(__file__).resolve().parent.parent / "models" / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "mrv_model.joblib"
META_PATH = ARTIFACT_DIR / "mrv_model_meta.json"


@lru_cache(maxsize=1)
def load_mrv_model() -> Any | None:
    if not MODEL_PATH.exists():
        return None
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def load_mrv_metadata() -> dict[str, Any]:
    if not META_PATH.exists():
        return {"model_version": "heuristic_v1_india_smallholder"}
    return json.loads(META_PATH.read_text(encoding="utf-8"))
