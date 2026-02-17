# MRV Model Pipeline

## Train

```bash
cd /Users/sadiasakharkar/Hackathons/Tech-Fiesta/Agri-Trust/ai-service
. .venv/bin/activate
python ml/train_mrv_model.py --data /path/to/mrv_training_data.csv
```

Artifacts are saved in `app/models/artifacts/`:
- `mrv_model.joblib`
- `mrv_model_meta.json`

## Production

- Build artifacts during CI and bundle into deployment image.
- Promote only models passing quality thresholds (e.g., MAE and R2 gates).
- Keep model metadata for auditability and rollback.
