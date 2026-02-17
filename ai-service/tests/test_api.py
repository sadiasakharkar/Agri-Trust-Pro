from fastapi.testclient import TestClient

from app.core.auth import reset_auth_cache
from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_mrv_estimate() -> None:
    payload = {
        "profile": {
            "farmer_id": "f-001",
            "state": "Maharashtra",
            "district": "Nashik",
            "farm_size_hectares": 2.4,
            "crop": "millets",
            "irrigation_type": "rainfed",
            "soil_organic_carbon_pct": 0.9,
            "language": "hi",
        },
        "practices": ["cover_crop", "reduced_till"],
        "baseline_yield_ton_per_hectare": 1.8,
    }
    response = client.post("/api/v1/mrv/estimate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["estimated_annual_co2e_tons"] > 0
    assert data["confidence_score"] >= 0.6
    assert "model_version" in data


def test_voice_intent() -> None:
    response = client.post(
        "/api/v1/voice/intent",
        json={"transcript": "मुझे कार्बन स्कोर बताओ", "language": "hi"},
    )
    assert response.status_code == 200
    assert response.json()["intent"] == "get_carbon_score"


def test_evidence_validation() -> None:
    response = client.post(
        "/api/v1/mrv/evidence/validate",
        json={
            "farmer_id": "f-001",
            "latitude": 19.07,
            "longitude": 72.87,
            "soil_organic_carbon_pct": 0.8,
        },
    )
    assert response.status_code == 200
    assert response.json()["valid"] is True


def test_rate_limit_header() -> None:
    response = client.get("/health")
    assert response.headers.get("x-request-id")


def test_auth_required_rejects_missing_token(monkeypatch) -> None:
    monkeypatch.setenv("AUTH_REQUIRED", "true")
    monkeypatch.setenv("AUTH_PROVIDER", "dev")
    monkeypatch.setenv("DEV_BEARER_TOKEN", "test-token")
    reset_auth_cache()

    payload = {
        "profile": {
            "farmer_id": "f-001",
            "state": "Maharashtra",
            "district": "Nashik",
            "farm_size_hectares": 2.4,
            "crop": "millets",
            "irrigation_type": "rainfed",
            "soil_organic_carbon_pct": 0.9,
            "language": "hi",
        },
        "practices": ["cover_crop", "reduced_till"],
        "baseline_yield_ton_per_hectare": 1.8,
    }
    response = client.post("/api/v1/mrv/estimate", json=payload)
    assert response.status_code == 401

    monkeypatch.setenv("AUTH_REQUIRED", "false")
    reset_auth_cache()


def test_auth_required_accepts_valid_dev_token(monkeypatch) -> None:
    monkeypatch.setenv("AUTH_REQUIRED", "true")
    monkeypatch.setenv("AUTH_PROVIDER", "dev")
    monkeypatch.setenv("DEV_BEARER_TOKEN", "test-token")
    reset_auth_cache()

    payload = {
        "profile": {
            "farmer_id": "f-001",
            "state": "Maharashtra",
            "district": "Nashik",
            "farm_size_hectares": 2.4,
            "crop": "millets",
            "irrigation_type": "rainfed",
            "soil_organic_carbon_pct": 0.9,
            "language": "hi",
        },
        "practices": ["cover_crop", "reduced_till"],
        "baseline_yield_ton_per_hectare": 1.8,
    }
    response = client.post(
        "/api/v1/mrv/estimate",
        json=payload,
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 200

    monkeypatch.setenv("AUTH_REQUIRED", "false")
    reset_auth_cache()
