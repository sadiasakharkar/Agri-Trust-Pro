from __future__ import annotations

from collections import defaultdict
from threading import Lock


class MetricsStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._requests_by_path: dict[str, int] = defaultdict(int)
        self._status_by_code: dict[str, int] = defaultdict(int)
        self._model_version_counts: dict[str, int] = defaultdict(int)

    def record_request(self, path: str, status_code: int) -> None:
        with self._lock:
            self._requests_by_path[path] += 1
            self._status_by_code[str(status_code)] += 1

    def record_model_usage(self, model_version: str) -> None:
        with self._lock:
            self._model_version_counts[model_version] += 1

    def snapshot(self) -> dict[str, dict[str, int]]:
        with self._lock:
            return {
                "requests_by_path": dict(self._requests_by_path),
                "responses_by_status": dict(self._status_by_code),
                "mrv_model_version_usage": dict(self._model_version_counts),
            }


metrics_store = MetricsStore()
