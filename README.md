# Agri-Trust: AI-Driven Carbon MRV Platform for Indian Smallholder Farmers

This repository is a full-stack implementation scaffold for an industry-grade farmer platform combining:
- Farmer-first multilingual frontend (Hindi, Marathi, English)
- FastAPI AI service (MRV estimation, recommendations, voice intent)
- Firebase backend (Phone OTP auth, Firestore, Cloud Functions)

## 1. Monorepo Structure

- `ai-service/` FastAPI AI APIs and model logic
- `frontend/` React web app optimized for mobile farmer usage
- `firebase/` Firestore rules/indexes + Cloud Function integration layer
- `docs/` architecture and API contracts
- `docker-compose.yml` local multi-service run

## 2. Industry-Level Architecture

1. User logs in with Firebase phone OTP.
2. Frontend collects farm profile and local language preferences.
3. Frontend calls FastAPI for:
   - Carbon MRV estimate
   - Practice recommendations
   - Voice intent understanding
4. Results are stored in Firestore for history and analytics.
5. Vishnu voice integration calls Firebase Cloud Function, which securely proxies to FastAPI.

## 3. Key Features Implemented

### Frontend (Farmer-Centric UX)
- Large touch targets and high-contrast interface
- Hindi/Marathi/English language toggle
- Voice input + spoken responses (browser speech APIs)
- Phone OTP login flow with Firebase Auth
- Dashboard for carbon estimate and actionable recommendations

### AI Service (FastAPI)
- `/api/v1/mrv/estimate` hybrid heuristic carbon estimate
- `/api/v1/recommendations` objective-based practice recommender
- `/api/v1/voice/intent` multilingual intent parsing
- `/api/v1/integrations/vishnu/webhook` webhook endpoint with secret header validation
- Unit tests for core APIs

### Firebase Backend
- Firestore security rules for farmer-scoped access
- Firestore indexes for MRV query performance
- Cloud Function webhook relay for external voice orchestration

## 4. Setup Instructions

## Prerequisites
- Node.js 20+
- Python 3.11+
- Firebase CLI
- Docker (optional)

## A. FastAPI AI Service
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Run tests:
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/ai-service
pytest
```

## B. Frontend
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/frontend
npm install
cp .env.example .env
npm run dev
```

Add your Firebase project credentials in `frontend/.env`.

## C. Firebase
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/firebase/functions
npm install
npm run build
```

From `/Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/firebase`:
```bash
firebase deploy --only firestore:rules,firestore:indexes,functions
```

Set environment variables for Cloud Functions:
- `AI_SERVICE_BASE_URL`
- `VISHNU_WEBHOOK_SECRET`

## D. Docker Compose (optional local run)
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust
docker compose up --build
```

## 5. Environment Variables

## `ai-service/.env`
- `APP_ENV`
- `ALLOWED_ORIGINS`
- `DEFAULT_LANGUAGE`
- `VISHNU_WEBHOOK_SECRET`

## `frontend/.env`
- `VITE_AI_API_BASE`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 6. Data Collections (Firestore)

- `farmers/{farmerId}` profile, language, agronomic metadata
- `mrv_estimates/{docId}` estimated outputs, model version, timestamp
- `voice_sessions/{sessionId}` voice conversation state and last intent

## 7. India-Focused Production Recommendations

- Add district-level agronomy data and weather APIs (IMD + satellite indices)
- Integrate local language ASR/TTS providers for better rural accent coverage
- Include FPO/NGO operator dashboard for assisted onboarding
- Add Aadhaar-independent identity fallback (mobile OTP + village/FPO verification)
- Add audit-ready MRV evidence pipeline (geo-tagged photos, soil test uploads, verifier workflows)

## 8. Next Build Stages

1. Replace heuristic MRV with calibrated models trained on pilot farm datasets.
2. Introduce model monitoring and drift detection.
3. Add offline-first PWA flows and sync queue for low-connectivity villages.
4. Add carbon credit registry integration and payment rails.

## 9. Important Note

The current AI logic is a strong implementation baseline for hackathon-to-MVP transition, not a certified carbon accounting engine. For credit issuance, you must include approved MRV protocols, third-party audits, and jurisdiction-specific compliance.
