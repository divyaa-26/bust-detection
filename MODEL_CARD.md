# Model Card — Forecast Reliability Intelligence Engine

## 1. Model Details
- **Organization:** Smart India Hackathon 2026 / MoES SIH26079 Team
- **Active Model Name:** `LightGBM-v1.0-Real-NWP-IMD-Calibrated`
- **Model Type:** LightGBM Binary Classifier + Isotonic Probability Calibration + TreeSHAP Local Attributions
- **Historical Replay Heuristic:** `DemoReliabilityModel` (Audited deterministic benchmark diagnostic used strictly for historical case study replay such as Cyclone Biparjoy 2023)
- **Intended Task:** Spatially explicit forecast bust probability estimation and conformal uncertainty bounds across India's 36 IMD meteorological subdivisions for medium-range forecasts (D+1 to D+10).

---

## 2. Intended Use & Target Users
- **Primary Users:** IMD and MoES operational meteorologists, duty forecasters, state disaster management authorities.
- **Operational Role:** Decision-support and attention-prioritization layer sitting above NWP and data-driven AI models (GFS, AIFS, NCUM).
- **Out of Scope Use:** Not designed to directly generate autonomous public weather warnings without meteorologist review.

---

## 3. Training & Validation Provenance
- **Training Forecast Source:** NOAA GFS 0.25° Operational GRIB2 runs (Monsoon 2023 & 2024, 13,680 genuine verification pairs across 38 initialization dates).
- **Verification Source:** Open-Meteo Historical Archive 24h Centroid-Based Precipitation Verification with mathematically verified 03Z–03Z accumulation windows (matching IMD 08:30 IST to 08:30 IST operational standard).
- **Chronological Split:**
  - *Training Set:* Monsoon 2023 (7,200 samples)
  - *Calibration Set:* Early & Peak Monsoon 2024 (3,600 samples)
  - *Evaluation Test Set:* Late Monsoon 2024 (2,880 held-out samples)
- **Temporal Leakage Controls:** Audited chronological blocking across calendar years and initialization dates. Zero future observation or analogue outcome leakage.

---

## 4. Audited Input Features (10 Operational Parameters)
All features are verified computable at forecast initialization time ($T_{\text{init}}$):
1. `lead_time_days` (1..10)
2. `forecast_value_mm` (GFS predicted accumulation)
3. `climatological_normal_mm` (subdivision baseline)
4. `forecast_anomaly_mm` (departure from normal)
5. `subdivision_code` (0..35)
6. `macro_region_code` (0..4)
7. `terrain_type_code` (0..3)
8. `is_coastal` (0/1)
9. `analogue_historical_bust_rate` (precedent bust prevalence)
10. `analogue_mean_error_mm` (precedent mean error)

*Note on Operational Feeds:* Real-time comparison with ECMWF AIFS 0.25° is ingested as an operational disagreement diagnostic; AIFS is NOT a training predictor of this LightGBM model.

---

## 5. Key Performance Baselines & Metrics
Evaluated out-of-time on the held-out Late Monsoon 2024 test partition:
- **Calibrated Brier Score:** 0.0362 (vs Climatology Baseline: 0.0380, Lead Skill Decay: 0.0380)
- **Brier Skill Score (BSS):** +4.74% improvement over climatology
- **Expected Calibration Error (ECE):** 0.0152 (Isotonic Regression)
- **Out-of-Time ROC-AUC:** 0.7823
- **Precision-Recall AUC (PR-AUC):** 0.1326 (on 3.96% base rate)

---

## 6. Ethical & Scientific Disclaimers
- Zero fabricated, synthetic, or artificially inflated metrics exist in the real training pipeline.
- Predictions represent calibrated empirical bust probabilities, not physical conservation laws.
