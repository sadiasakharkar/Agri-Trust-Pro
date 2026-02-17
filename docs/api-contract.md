# AI API Contract (FastAPI)

Base URL: `/api/v1`

Auth:
- When `AUTH_REQUIRED=true`, send `Authorization: Bearer <token>`.
- Supported providers:
  - `dev` with `DEV_BEARER_TOKEN`
  - `firebase` via Firebase ID token verification

## POST `/mrv/estimate`
- Input: farm profile, selected practices, baseline yield
- Output: annual tCO2e estimate, confidence, model version, explanation

## POST `/mrv/evidence/validate`
- Input: farmer ID, latitude, longitude, soil organic carbon
- Output: validation result, issues list, recommendation

## POST `/recommendations`
- Input: farm profile + objective (`carbon`, `yield`, `cost`, `water`)
- Output: top 3 practices with impact and estimated cost

## POST `/voice/intent`
- Input: transcript + language (`en`, `hi`, `mr`)
- Output: intent + confidence + localized response text

## GET `/ops/metrics`
- Output: request counters by path/status and MRV model-version usage counters

## POST `/integrations/vishnu/webhook`
- Header: `x-vishnu-secret`
- Input: `session_id`, `utterance`, `language`
- Output: `session_id`, `reply`, `intent`
