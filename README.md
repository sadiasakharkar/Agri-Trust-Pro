# Agri-Trust: AI-Driven Carbon MRV Platform for Indian Smallholder Farmers

Production-style full-stack project combining farmer-first UX, FastAPI AI services, and Firebase backend primitives.

## Stack
- Frontend: React + TypeScript + Vite + PWA shell
- AI backend: FastAPI + model registry + training pipeline scaffold
- Data/backend: Firebase Auth, Firestore, Cloud Functions
- Delivery: Docker Compose + GitHub Actions CI/CD

## Repository Structure
- `ai-service/` FastAPI APIs, services, model artifacts, tests
- `ai-service/ml/` model training scripts and pipeline docs
- `frontend/` multilingual farmer app with voice and offline queue
- `firebase/` Firestore rules/indexes and serverless integration relay
- `.github/workflows/` CI and staging deploy workflows
- `docs/` architecture/API and dataset schema docs

## Implemented Capabilities

### Farmer App
- Hindi/Marathi/English language switching
- Phone OTP authentication via Firebase
- Guided farm profile workflow for low-literacy users
- Voice input + spoken response loop
- Offline queue for failed requests and manual sync action
- PWA manifest and service worker registration
- Evidence capture form (geo + soil) for MRV audit trails

### FastAPI AI Service
- `POST /api/v1/mrv/estimate`
- `POST /api/v1/mrv/evidence/validate`
- `POST /api/v1/recommendations`
- `POST /api/v1/voice/intent`
- `POST /api/v1/integrations/vishnu/webhook`
- Request tracing (`X-Request-ID`), rate limiting, centralized error handling
- Optional auth enforcement:
  - `AUTH_REQUIRED=false` (default dev)
  - `AUTH_PROVIDER=dev|firebase`

### Model Pipeline
- Hybrid inference path: model artifact if available, heuristic fallback otherwise
- Training script: `ai-service/ml/train_mrv_model.py`
- Artifact registry:
  - `ai-service/app/models/artifacts/mrv_model.joblib`
  - `ai-service/app/models/artifacts/mrv_model_meta.json`

### Firebase
- Security rules for `farmers`, `mrv_estimates`, `voice_sessions`, `evidence_uploads`, `soil_tests`, `audit_trail`
- Cloud Function relay for Vishnu voice webhook orchestration

## Local Setup

### 1. AI Service
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Run tests:
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/ai-service
source .venv/bin/activate
pytest
```

### 2. Frontend
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/frontend
npm install
cp .env.example .env
npm run dev
```

### 3. Firebase Functions
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/firebase/functions
npm install
npm run build
```

Deploy backend config:
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/firebase
firebase deploy --only firestore:rules,firestore:indexes,functions
```

### 4. Docker Compose
```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust
docker compose up --build
```

## Environment Variables

### `ai-service/.env`
- `APP_ENV`
- `ALLOWED_ORIGINS`
- `DEFAULT_LANGUAGE`
- `VISHNU_WEBHOOK_SECRET`
- `AUTH_REQUIRED`
- `AUTH_PROVIDER`
- `DEV_BEARER_TOKEN`
- `RATE_LIMIT_PER_MINUTE`
- `RATE_LIMIT_WINDOW_SECONDS`

### `frontend/.env`
- `VITE_AI_API_BASE`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## CI/CD
- CI workflow: `.github/workflows/ci.yml`
  - FastAPI tests
  - Frontend build
  - Firebase functions build
- Staging deployment workflow: `.github/workflows/deploy-staging.yml`
  - Manual trigger
  - Firebase deploy via GitHub secrets

Required GitHub secrets:
- `FIREBASE_TOKEN`
- `FIREBASE_STAGING_PROJECT`

## Production Notes
- Current model pipeline is deployment-ready scaffolding, not certification-grade MRV.
- Carbon credit issuance still requires approved protocol mapping, verifier workflows, and audit evidence integrity checks.
