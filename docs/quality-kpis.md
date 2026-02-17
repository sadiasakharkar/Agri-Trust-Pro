# Product Quality KPIs

Track these weekly and gate production rollouts on trend stability.

## Product UX KPIs
- Login completion rate (OTP send -> verified): target >= 92%
- Carbon estimate task completion rate: target >= 90%
- Recommendation request success rate: target >= 95%
- Farmer task time (estimate flow): target <= 2.5 minutes

## Reliability KPIs
- API success rate (2xx): target >= 99.5%
- p95 latency (MRV estimate): target <= 1200 ms
- Offline queue sync success (within 24h): target >= 97%

## Data and Model KPIs
- Model R2 on validation slice: target >= 0.75
- Model MAE on validation slice: target <= 1.2
- Evidence validation failure rate: monitor by district/crop
- Drift alarm threshold: >= 15% feature distribution shift

## Governance KPIs
- Verifier review SLA (submission -> decision): target <= 72h
- Audit trail completeness: target 100% for submission lifecycle events
