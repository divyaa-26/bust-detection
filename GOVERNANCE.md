# Provenance & Scientific Governance — SIH26079

## 1. Governance Principles

Operational meteorological software deployed within the Ministry of Earth Sciences (MoES) ecosystem must satisfy strict auditing, provenance, and accountability standards.

Every prediction issued by the Forecast Reliability Intelligence Layer attaches an immutable audit record:

```json
{
  "prediction_id": "PRED-GFS-SUB22-D5-7E3B8F1A",
  "forecast_source": "GFS",
  "forecast_model": "GFS_0.25deg_Operational",
  "initialization_time": "2024-07-15T00:00:00Z",
  "valid_time": "2024-07-20T00:00:00Z",
  "lead_time_days": 5,
  "dataset_version": "imd-gfs-regridded-0.25deg-v2",
  "feature_version": "feat-spatiotemporal-v1",
  "bust_definition_version": "bust-def-v1.2",
  "model_version": "demo-reliability-v1.0.0",
  "calibration_version": "calib-platt-v1",
  "git_commit": "sih-2026-v1.0",
  "inference_timestamp": "2024-07-15T00:00:12Z",
  "data_mode": "REPLAY"
}
```

---

## 2. Cryptographic Prediction Identifiers

Prediction IDs are derived deterministically using SHA-256 hashing across run parameters:
$$\text{Hash} = \text{SHA256}(\text{source} \parallel \text{init\_time} \parallel \text{region\_id} \parallel \text{lead\_days} \parallel \text{model\_version})[:12]$$
This guarantees that predictions can be audited, reproduced, and verified in post-event reviews.

---

## 3. Human-in-the-Loop Safety Buffer

- Forecaster feedback (Confirm, Reject, Hold) is recorded in an append-only JSON/SQLite store.
- **Safety Rule:** Feedback does **NOT** trigger immediate automated model retraining. Automated retraining in critical meteorological infrastructure risks catastrophic forgetting and adversarial degradation. Retraining requires scientific validation by MoES research personnel.
