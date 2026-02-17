# Agri-Trust Architecture

## Core Stack
- Frontend: React + TypeScript + Vite (farmer-first multilingual UI)
- AI Layer: FastAPI (MRV estimation, recommendations, voice intent)
- Backend Platform: Firebase (Phone Auth, Firestore, Cloud Functions)

## Request Flow
1. Farmer logs in using Firebase phone OTP.
2. Frontend collects farm profile and voice/text queries.
3. Frontend calls FastAPI APIs for AI inference.
4. Frontend stores outputs in Firestore (`mrv_estimates`, `voice_sessions`).
5. Vishnu voice platform can call Firebase Cloud Function, which relays to FastAPI and persists session context.

## AI Scope
- Carbon MRV estimate (heuristic baseline model with explainability text)
- Practice recommendation ranking (objective-driven)
- Voice NLU intent parsing (Hindi/Marathi/English baseline)

## Production Hardening Roadmap
- Add satellite data ingestion and geospatial verification for MRV claims.
- Add model registry and versioned inference artifacts.
- Add offline-first PWA mode and IVR fallback for low-connectivity regions.
- Add enterprise observability (OpenTelemetry + Cloud Logging dashboards).
