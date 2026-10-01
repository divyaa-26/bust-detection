# AETHER-CAST: SIH 2026 Live Demo Script & Walkthrough Guide
## SIH26079 — Forecast Reliability Intelligence & Decision-Support System

> **SCIENTIFIC CREDIBILITY NOTICE**:
> All AI-derived predictions in this prototype are explicitly marked with the persistent indicator:
> `PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED`
> All uncertainty outputs represent **Prototype Uncertainty Intervals** (residual-spread heuristic envelopes). No unearned claims of calibrated probabilities or 90% conformal coverage are made.

---

## 1. Objective of the Demo

To demonstrate to the Smart India Hackathon jury and Ministry of Earth Sciences (MoES) evaluators that:
1. We are **not replacing NWP**, but building an actionable decision-support layer above it.
2. We answer the 5 core operational questions:
   - **WHERE** is the forecast likely to fail? (Subdivision-level spatial choropleth)
   - **WHEN** is it likely to fail? (D+1 to D+10 Lead Horizon scrubber)
   - **HOW SEVERE** could the uncertainty/error be? (Prototype Uncertainty Interval & tail-bust threshold)
   - **WHY** is the forecast flagged? (Empirical drivers: ensemble spread, model disagreement, historical failure association)
   - **WHICH REGION** deserves human/forecaster attention first? (Operational Review Priority queue)
3. The software is fast, responsive, transparent, and grounded in Indian meteorological realities.
4. The system is strictly honest about data provenance:
   - **GFS 0.25°**: Real/Replay Active
   - **ECMWF AIFS 0.25°**: Real/Replay Connected
   - **NCUM (NCMRWF)**: Strictly marked `not_connected` (never simulated or faked)
   - **OGC Interoperability**: Modeled on OGC API - Environmental Data Retrieval (EDR)-style endpoints.

---

## 2. Primary 6-Step SIH Evaluation Flow (+ Bonus Live Disagreement)

The interface includes a dedicated **SIH 2026 Evaluation Flow Stepper** bar located directly below the top navigation. Evaluators can click each step button or sequentially click **"Next →"**:

### Step 1: Operational Dashboard (Lead Horizon D+5)
- **Action**: Click button `1. Dashboard (D+5)`.
- **Observation**:
  - The Lead Horizon scrubber is set to **D+5** (`precipitation_mm_day`).
  - India choropleth highlights high-risk zones across Western and Coastal India.
  - Notice the persistent badge: `PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED`.

### Step 2: Historical Replay at T-5 (Cyclone Biparjoy Landfall)
- **Action**: Click button `2. Replay T-5 (Biparjoy)`.
- **Provenance & Ground Truth**:
  - **Event**: Cyclone Biparjoy Landfall (June 2023)
  - **Region**: Saurashtra & Kutch (`SUB_22`, 22.3°N, 70.3°E)
  - **Forecast Source**: NOAA GFS 0.25° 00 UTC run initialized `2023-06-10T00:00:00Z`
  - **Observation Source**: IMD Daily Gridded Rainfall 0.25° valid `2023-06-15T00:00:00Z`
  - **Hard As-Of Cutoff**: `2023-06-10T00:00:00Z` (Zero future observation leakage verified).
  - **Raw Forecast**: 42.0 mm/day (GFS predicts only moderate rain).
  - **AI Reliability Engine at T-5**: Prototype Risk Score **76/100** (`CRITICAL — HIGH BUST RISK`), Prototype Uncertainty Interval: `[18.0, 72.0] mm/day`.

### Step 3: Region Inspection (SUB_22 Saurashtra & Kutch)
- **Action**: Click button `3. Inspect Saurashtra (SUB_22)`.
- **Observation**:
  - The map zooms to Gujarat / Saurashtra & Kutch (`SUB_22`).
  - Right-hand diagnostic panel loads full context: Raw Forecast 42.0 mm/day, Prototype Risk Score 76/100, Review Priority `CRITICAL — INSPECTION REQUIRED`.

### Step 4: "Why Distrust This Forecast?" (Empirical Drivers)
- **Action**: Click button `4. Why Distrust?`.
- **Observation**:
  - The driver breakdown displays empirical evidence (statistical association, non-causal):
    1. *Empirical ensemble evidence:* Member standard deviation (26.5 mm) is 2.8x climatological baseline.
    2. *Inter-model disagreement:* GFS and AIFS disagree by 22.0 mm on offshore moisture core.
    3. *Historical precedent association:* Pre-2023 analogues (Cyclone Vayu 2019, Cyclone Tauktae 2021) suffered severe under-prediction busts along the Saurashtra coast.
  - Forecaster human-in-the-loop action: Duty officer can confirm or override the flag with one click.

### Step 5: Advance Horizon to T-1
- **Action**: Click button `5. Jump to T-1`.
- **Observation**:
  - Lead time reduces to 24 hours prior to landfall (`as_of_cutoff_utc: 2023-06-14T00:00:00Z`).
  - NWP raw forecast has now updated towards reality (162.0 mm/day), and ensemble spread has tightened (8.5 mm).
  - Short-range consensus has consolidated, reducing the risk index to 26/100.

### Step 6: Reveal Ground-Truth Outcome (+143 mm Bust)
- **Action**: Click button `6. Reveal Outcome (+143mm)`.
- **Observation & Error Derivation**:
  - Ground truth observed rainfall from IMD gridded observation: **185.0 mm/day**.
  - **Error Calculation**:
    $$\text{Error} = |42.0 - 185.0| = 143.0\text{ mm/day}$$
  - **Applied D+5 Threshold**: Base threshold $35.0\text{ mm/day}$ scaled by $1.32\times$ at D+5 = $46.2\text{ mm/day}$.
  - **Threshold Excess**: Actual error ($143.0\text{ mm/day}$) exceeded the applied D+5 threshold ($46.2\text{ mm/day}$) by **$+96.8\text{ mm/day}$** (exceeded the unscaled base threshold of 35.0 mm by $+108.0\text{ mm/day}$).
  - **Category Transition**: Forecast predicted *Moderate Rain* (15.6–64.4 mm); Actual was *Very Heavy to Extremely Heavy Rain* (>185 mm regional).
  - **Outcome**: The AI Reliability Engine correctly flagged the forecast failure **5 days in advance**.

### Step 7 / Bonus: Today's Real Forecast Disagreement (GFS vs AIFS)
- **Action**: Click button `7. Real GFS vs AIFS ⚡` (or navigate to `Realtime Disagreement` tab).
- **Observation**:
  - Real operational model comparison between NOAA GFS 0.25° and ECMWF AIFS 0.25° initialized today.
  - Inter-model discrepancy computed across all 36 IMD subdivisions in real time.
  - Transparent disclosure: NCUM status displayed honestly as `not_connected`.

---

## 3. Key Architecture & Governance Talking Points

1. **Anti-Leakage Guarantee**:
   All historical evaluations enforce strict temporal cutoffs (`as_of_cutoff_utc <= valid_time - lead_time`). Feature computation never reads future observations.
2. **Graceful Multi-Model Degradation**:
   When secondary models (e.g. NCUM) are offline, the engine flags missing sources, expands uncertainty intervals, and adjusts risk scores transparently.
3. **Open Geospatial Consortium (OGC) Style**:
   The EDR API endpoints (`/edr/collections/forecast-bust/position`) are modeled on the OGC API-EDR specification for easy ingestion into IMD GIS workflows and QGIS.
4. **Reproducible Test Suite**:
   18 automated tests verify mathematical correctness, leakage boundaries, provenance schemas, and endpoints (`PYTHONPATH=backend ./venv/bin/pytest backend/tests -v`).
