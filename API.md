# RESTful & OGC-Style API Reference — SIH26079

Interactive OpenAPI documentation is available live at `http://localhost:8000/docs`.

---

## 1. Core Endpoints

### `GET /api/health`
Health check and system status.
```json
{
  "status": "healthy",
  "service": "Forecast Reliability Intelligence & Decision-Support System",
  "version": "1.0.0-sih26079",
  "data_mode": "REPLAY",
  "git_commit": "sih-2026-v1.0"
}
```

### `GET /api/config`
System configuration, active providers, and governance schema versions. Explicitly declares provider connection status (e.g. `ncum_connected: false`).

### `GET /api/regions`
Returns metadata and center coordinates for all 36 IMD Meteorological Subdivisions.

### `GET /api/risk-map`
**Parameters:**
- `lead_time_days` (int, default: 5, range: 1–10)
- `variable` (string, default: `precipitation_mm_day`)
- `forecast_run` (ISO-8601 UTC string, default: `2024-07-15T00:00:00Z`)

**Response:**
Returns spatially explicit predictions for all 36 subdivisions with prototype risk scores, prototype uncertainty intervals, why-distrust empirical drivers, and review priorities. Every record includes `prototype_badge: "PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED"`.

### `GET /api/priority`
**Parameters:**
- `lead_time_days` (int)
- `variable` (string)

**Response:**
Returns ranked Forecaster Operational Review Priority queue.

### `GET /api/events` and `GET /api/events/{event_id}`
Returns curated historical counterfactual replay events (e.g. `biparjoy_2023`, `western_ghats_2022`, `michaung_2023`) with exact coordinates, initialization times, `as_of_cutoff_utc` timestamps, raw forecasts, ground-truth observations, and error calculation traces.

### `GET /api/realtime/disagreement`
**Parameters:**
- `variable` (string, default: `precipitation_mm_day`)

**Response:**
Returns operational inter-model disagreement comparing NOAA GFS 0.25° against ECMWF AIFS 0.25° across all 36 subdivisions, with mean absolute difference and maximum discrepancy region, accompanied by the honest disclosure that NCUM is excluded due to disconnected status.

### `POST /api/feedback`
Submits forecaster review decision.
```json
{
  "prediction_id": "PRED-GFS-SUB_22-D5-7E3B8F1A",
  "forecast_id": "FCST-SUB_22-D5",
  "region_id": "SUB_22",
  "lead_time_days": 5,
  "user_name": "Duty Officer",
  "user_role": "Senior Duty Forecaster",
  "decision": "CONFIRM",
  "decision_reason": "Soundings indicate offshore convective surge",
  "notes": "Monitor radar loop on next 6h cycle"
}
```

---

## 2. OGC API - Environmental Data Retrieval (EDR)-Style Endpoints

> **CONFORMANCE DISCLOSURE**:
> These endpoints are modeled on the OGC API - Environmental Data Retrieval (EDR) standard to demonstrate geospatial GIS client compatibility (e.g. QGIS). Official OGC compliance testing has not been executed; hence endpoints are designated as "OGC API-EDR-style / modeled on OGC API-EDR".

### `GET /edr/collections`
Returns OGC EDR-style collection catalog metadata.

### `GET /edr/collections/forecast-bust/position`
**Parameters:**
- `coords`: WKT Point format, e.g. `POINT(70.3 22.3)`
- `lead_time_days`: Forecast lead horizon (1–10)

**Response:**
GeoJSON Feature containing pointwise prototype risk score, prototype uncertainty interval, and priority for standard GIS client consumption.
