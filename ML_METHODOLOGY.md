# Machine Learning Methodology & Training Readiness — SIH26079

## 1. Stage 1 vs Stage 2 Strategy

- **Stage 1 (Current):** Full end-to-end production software engineering, UI/UX, REST APIs, spatial visualizations, decision support, and deterministic prototype inference. **Final training is deferred.**
- **Stage 2 (Future):** Execution of large-scale offline training on multi-year IMD and NWP archives.

---

## 2. Forecast Bust Definitions

We define a forecast bust rigorously through two configurable criteria (`backend/app/core/bust_definition.py`):

### Definition A: Error-Tail Bust
A forecast is designated as an error-tail bust when the absolute forecast error $|F - O|$ exceeds a high percentile (typically 90th percentile) derived from the historical training distribution:
$$|F - O| \ge \tau_{\text{tail}}(d)$$
where $\tau_{\text{tail}}(d) = \tau_0 \cdot (1 + \alpha(d - 1))$ widens with lead day $d$.

### Definition B: Categorical Failure
In operational hydrology, failing to warn for severe rain is critical. A bust occurs when:
1. The forecast differs by $\ge 2$ IMD rainfall intensity categories (e.g. Light Rain predicted vs Very Heavy observed).
2. The model predicts No Rain or Light Rain ($< 15.6\text{ mm}$), but observed rainfall exceeds Very Heavy ($\ge 115.6\text{ mm}$).

---

## 3. Mandatory Scientific Baselines

No ML model is scientifically credible without comparison against standard operational baselines (`backend/app/ml/baselines.py`):

1. **Baseline 1 — Climatology:**
   Empirical base rate frequency of tail busts per subdivision (8%–14%).
2. **Baseline 2 — Ensemble Spread Indicator:**
   Uses standard deviation $\sigma_{\text{ens}}$ across 21 ensemble members as a direct heuristic for forecast bust.
3. **Baseline 3 — Historical Lead-Time Skill Decay:**
   Monotonic empirical error growth modeling atmospheric chaos degradation:
   $$\text{Risk}_{\text{decay}} = 1 - \frac{1}{1 + \gamma \cdot d}$$

When Stage 2 model training is executed, the XGBoost/LightGBM classifier will be benchmarked directly against these three baselines using Brier Skill Score (BSS).

---

## 4. Probability Calibration & Conformal Uncertainty

### Probability Calibration
Raw tree ensemble outputs are frequently overconfident. We incorporate:
- **Platt Scaling (Logistic Sigmoid)**
- **Isotonic Regression**
- Reliability diagrams & Expected Calibration Error (ECE)

### Conformal Prediction Envelopes
To provide distribution-free guarantees on forecast error intervals:
$$\mathbb{P}\left(O \in \left[\hat{y} - \hat{q}_{1-\alpha}, \hat{y} + \hat{q}_{1-\alpha}\right]\right) \ge 1 - \alpha$$
The system computes 90% conformal intervals to provide forecasters with valid coverage envelopes.

---

## 5. Temporal Blocking to Prevent Data Leakage

In atmospheric science, naive random K-fold cross-validation results in severe spatial and temporal autocorrelation leakage.

Our Stage 2 training protocol mandates **Temporal Block Splits**:
- **Training Set:** 2018–2022
- **Validation & Calibration Set:** 2023
- **Held-Out Test Set:** 2024
