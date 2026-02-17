from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self.limit = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))
        self.window_seconds = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> None:
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            dq = self._hits[key]
            while dq and dq[0] < window_start:
                dq.popleft()
            if len(dq) >= self.limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please retry shortly.",
                )
            dq.append(now)


rate_limiter = InMemoryRateLimiter()


def enforce_rate_limit(request: Request) -> None:
    client = request.client.host if request.client else "unknown"
    key = f"{client}:{request.url.path}"
    rate_limiter.check(key)
