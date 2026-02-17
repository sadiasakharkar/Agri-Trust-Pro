from __future__ import annotations

import os
from functools import lru_cache

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


class CurrentUser(dict):
    uid: str


@lru_cache(maxsize=1)
def _auth_mode() -> str:
    return os.getenv("AUTH_PROVIDER", "dev").strip().lower()


@lru_cache(maxsize=1)
def _auth_required() -> bool:
    return os.getenv("AUTH_REQUIRED", "false").strip().lower() == "true"


def _verify_dev_token(token: str) -> dict:
    expected = os.getenv("DEV_BEARER_TOKEN", "dev-token")
    if token != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid dev bearer token")
    return {"uid": "dev-user", "provider": "dev"}


def _verify_firebase_token(token: str) -> dict:
    try:
        import firebase_admin
        from firebase_admin import auth

        if not firebase_admin._apps:
            firebase_admin.initialize_app()

        decoded = auth.verify_id_token(token)
        return {"uid": decoded.get("uid", "unknown"), "provider": "firebase"}
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase token") from exc


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser:
    if not _auth_required():
        request.state.user = {"uid": "anonymous", "provider": "none"}
        return CurrentUser(request.state.user)

    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = credentials.credentials
    mode = _auth_mode()

    if mode == "firebase":
        user = _verify_firebase_token(token)
    else:
        user = _verify_dev_token(token)

    request.state.user = user
    return CurrentUser(user)
