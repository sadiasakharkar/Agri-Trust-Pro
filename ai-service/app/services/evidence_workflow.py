from __future__ import annotations

from app.models.schemas import EvidenceStatus

ALLOWED_TRANSITIONS: dict[EvidenceStatus, set[EvidenceStatus]] = {
    "draft": {"submitted"},
    "submitted": {"in_review"},
    "in_review": {"approved", "rejected"},
    "approved": set(),
    "rejected": {"submitted"},
}


def validate_transition(from_status: EvidenceStatus, to_status: EvidenceStatus) -> tuple[bool, str]:
    if to_status in ALLOWED_TRANSITIONS[from_status]:
        return True, "Transition accepted"
    return False, f"Invalid transition from {from_status} to {to_status}"
