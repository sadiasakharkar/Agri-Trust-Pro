# AI API Contract (FastAPI)

Base URL: `/api/v1`

## POST `/mrv/estimate`
- Input: farm profile, selected practices, baseline yield
- Output: annual tCO2e estimate, confidence, explanation

## POST `/recommendations`
- Input: farm profile + objective (`carbon`, `yield`, `cost`, `water`)
- Output: top 3 practices with impact and estimated cost

## POST `/voice/intent`
- Input: transcript + language (`en`, `hi`, `mr`)
- Output: intent + confidence + localized response text

## POST `/integrations/vishnu/webhook`
- Header: `x-vishnu-secret`
- Input: `session_id`, `utterance`, `language`
- Output: `session_id`, `reply`, `intent`
