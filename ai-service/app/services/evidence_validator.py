from __future__ import annotations


def coordinates_in_india(latitude: float, longitude: float) -> bool:
    return 6.0 <= latitude <= 38.0 and 68.0 <= longitude <= 98.0


def validate_evidence_payload(latitude: float, longitude: float, soil_test_value: float) -> tuple[bool, list[str]]:
    issues: list[str] = []

    if not coordinates_in_india(latitude, longitude):
        issues.append("Coordinates appear outside India bounds.")
    if soil_test_value < 0 or soil_test_value > 10:
        issues.append("Soil organic carbon value must be between 0 and 10.")

    return len(issues) == 0, issues
