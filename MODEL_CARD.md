# Model Card — Forecast Reliability Intelligence Engine

## 1. Model Details
- **Organization:** Smart India Hackathon 2026 / MoES SIH26079 Team
- **Model Name:** `DemoReliabilityModel` (Stage 1 Prototype) -> `TrainedReliabilityModel` (Stage 2 XGBoost/LightGBM)
- **Model Type:** Deterministic Multi-Indicator Risk Scorer / Gradient-Boosted Decision Trees
- **Intended Task:** Forecast bust probability estimation and conformal uncertainty bounds for medium-range forecasts over India (D+1 to D+10).

---

## 2. Intended Use & Target Users
- **Primary Users:** IMD and MoES operational meteorologists, duty forecasters, state disaster management authorities.
- **Out of Scope Use:** Not designed to directly generate autonomous weather warnings for the public without human meteorologist review.

---

## 3. Training & Validation Strategy (Stage 2 Specification)
- **Training Data:** Multi-year retrospective GFS, ECMWF/AIFS, and IMD 0.25° gridded daily rainfall (2018–2022).
- **Validation Split:** 2023 full monsoon and winter seasons.
- **Evaluation Split:** Held-out 2024 operational cycles.
- **Autocorrelation Guard:** Temporal blocking across calendar years. Naive random K-fold splits are prohibited.

---

## 4. Key Performance Baselines
The model is benchmarked against:
1. Historical Climatology Base Rate
2. Raw Ensemble Spread Heuristic
3. Empirical Lead-Time Skill Decay

---

## 5. Ethical & Scientific Disclaimers
- The prototype engine does not fabricate accuracy figures.
- Predictions represent empirical risk indicators, not physical conservation laws.
