# Observability Baseline

## Current Signals
- Request-level structured logs with `request_id`, path, status, and latency.
- In-memory metrics endpoint: `GET /api/v1/ops/metrics`.
- Model usage counts by MRV `model_version`.

## Recommended Production Setup
1. Export logs to managed sink (Cloud Logging / ELK).
2. Build dashboards for:
   - p95 latency by endpoint
   - non-2xx rates
   - model version request share
3. Add alerts:
   - 5xx error spike
   - webhook failures
   - abnormal model usage shift
4. Add traces via OpenTelemetry and correlate by request ID.

## Limitations
- Current metrics store is process-local in-memory and resets on restart.
- Replace with Prometheus/OpenTelemetry metrics backend for production.
