# Staging Deployment Checklist

## 1. GitHub Secrets
Set these repository secrets:
- `FIREBASE_TOKEN`
- `FIREBASE_STAGING_PROJECT`

## 2. Firebase Function Runtime Variables
Set function env values for staging:

```bash
firebase functions:config:set \
  agri.ai_service_base_url="https://<staging-fastapi-domain>/api/v1" \
  agri.vishnu_webhook_secret="<staging-vishnu-secret>"
```

## 3. Trigger Staging Deploy
- Open Actions tab in GitHub
- Run workflow: `Deploy Staging`

## 4. Smoke Tests
- Verify Firestore rules deployment succeeded.
- Verify Cloud Function endpoint is live.
- Verify FastAPI `/health` and protected endpoints from frontend.

## 5. Promotion Gate
Promote only if all are true:
- CI checks are green
- Auth-required flow tested end-to-end
- Voice webhook returns valid responses
- Evidence creation/write paths succeed
