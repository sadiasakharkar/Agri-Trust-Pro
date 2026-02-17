from __future__ import annotations

import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.monitoring import metrics_store
from app.core.rate_limit import enforce_rate_limit

setup_logging()
logger = logging.getLogger("agri-trust.ai")

app = FastAPI(
    title="Agri-Trust AI Service",
    version="0.1.0",
    description="FastAPI AI backend for carbon MRV, agronomy recommendations, and voice workflows.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    started = time.perf_counter()

    enforce_rate_limit(request)

    try:
        response = await call_next(request)
    except Exception as exc:
        logger.exception(
            "request_failed request_id=%s method=%s path=%s", request_id, request.method, request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "request_id": request_id,
            },
        )

    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    metrics_store.record_request(request.url.path, response.status_code)
    logger.info(
        "request_complete request_id=%s method=%s path=%s status=%s duration_ms=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(router, prefix="/api/v1")
