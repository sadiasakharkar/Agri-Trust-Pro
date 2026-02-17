# MRV Training Dataset Schema

CSV fields required for `ai-service/ml/train_mrv_model.py`:

- `farm_size_hectares` (float)
- `state_factor` (float)
- `soil_organic_carbon_pct` (float)
- `baseline_yield_ton_per_hectare` (float)
- `practice_score` (float)
- `target_co2e` (float)  
  Annual verified tCO2e outcome used as supervised target

## Notes
- `state_factor` should map district/state agro-climate signal into normalized numeric feature.
- `practice_score` should represent weighted effect of adopted practices from verified field data.
- Training data should come from audited pilots and remote sensing evidence.
