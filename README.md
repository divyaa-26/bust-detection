# AETHER-CAST (SIH26079) — Forecast Reliability Intelligence & Decision-Support System (Bust Detection)

> **AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts**  
> *Sponsor: Ministry of Earth Sciences (MoES), Government of India*  
> *Smart India Hackathon 2026 Prototype*

---

> **SCIENTIFIC CREDIBILITY & OPERATIONAL NOTICE**:
> All AI-derived predictions in this prototype are explicitly marked with the persistent indicator:
> `PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED`  
> Uncertainty outputs represent **Prototype Uncertainty Intervals** (residual-spread heuristic envelopes). No unearned claims of calibrated probabilities or 90% conformal coverage are made until real offline model training and calibration exist. All OGC endpoints are modeled on the OGC API-EDR specification without claiming formal OGC certification.

---

## 1. Product Positioning & Value Proposition

Numerical Weather Prediction (NWP) systems—such as NCMRWF's NCUM, NOAA's GFS, and ECMWF IFS / AIFS—are the backbone of modern meteorology. **Our goal is NOT to replace Numerical Weather Prediction.**

Instead, **AETHER-CAST** has engineered an operational **Forecast Reliability Intelligence & Decision-Support Layer** that sits directly above existing forecast systems to answer:

1. **WHERE is the forecast likely to fail?** (Spatially explicit across India's 36 IMD subdivisions)
2. **WHEN is it likely to fail?** (Medium-range forecast horizon D+1 through D+10)
3. **HOW severe could the uncertainty/error be?** (Prototype Uncertainty Intervals & tail-bust thresholds)
4. **WHY is the forecast being flagged?** (Empirical ensemble dispersion, inter-model divergence, historical precedent association)
5. **WHICH regions deserve human/forecaster attention first?** (Forecaster operational review priority queue)

> *"Don't replace the forecast. Tell the forecaster when the existing forecast deserves distrust."*

---

## 2. Key Features

- **Subdivision-Level Risk Choropleth:** Interactive MapLibre GL visualization displaying bust risk across all 36 IMD meteorological subdivisions for lead times D+1 to D+10.
- **Empirical "Why Distrust This Forecast?" Breakdown:** Explains forecast risk drivers using ensemble spread, multi-model disagreement, lead-time degradation, and spatial vulnerability.
- **Counterfactual Historical Replay Engine:** Replay significant weather events (e.g., Cyclone Biparjoy 2023, Western Ghats Monsoon 2022) with strict as-of temporal cutoffs preventing future observation leakage.
- **Today's Real Disagreement:** Live operational comparison pipeline between NOAA GFS 0.25° and ECMWF AIFS 0.25° with automated fallback and zero data synthesis.
- **Deterministic Calibration & Verification:** Prototype risk score formula grounded to exact physical parameters with transparent component accounting.
- **OGC API-EDR-Style Access:** Standardized endpoints (`/edr/collections`, `/edr/collections/{id}/cube`) modeled on the OGC Environmental Data Retrieval API.
- **Scientific Provenance & Auditability:** Cryptographic run hashes, immutable schema versions, and human-in-the-loop forecaster feedback logging.

---

## 3. Tech Stack

- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2, PyTest, NumPy, SciPy
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, MapLibre GL, Lucide React
- **Geospatial & Data:** IMD 36 Subdivision GeoJSON, NOAA GFS 0.25° Operational Cycle, ECMWF Open Data AIFS 0.25°, IMD NDC Gridded Analysis
- **Protocol Standards:** RESTful JSON API, OGC API-EDR-style data query patterns

---

## 4. Architecture

```
    EXISTING FORECAST SYSTEMS (GFS, ECMWF / AIFS, NCUM if authenticated)
                                ↓
                 DATA NORMALIZATION & GRID ALIGNMENT
                                ↓
             SPATIO-TEMPORAL & ENSEMBLE FEATURE ENGINE
                                ↓
               BASELINES & RELIABILITY SCORING
                                ↓
                    PROTOTYPE RISK SCORE
         ["PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED"]
                                ↓
                 PROTOTYPE UNCERTAINTY INTERVAL
                                ↓
                 HISTORICAL ANALOGUE SEARCH (KNN)
                                ↓
                     DECISION SUPPORT ENGINE
                                ↓
       ┌────────────────────────┼────────────────────────┐
       ↓                        ↓                        ↓
  MAPLIBRE MAP            WHY DISTRUST?             REVIEW QUEUE
(Risk Choropleth)     (Empirical Association)    (Operational Priority)
       └────────────────────────┼────────────────────────┘
                                ↓
                   DUTY FORECASTER ADJUDICATION
                                ↓
              HUMAN-IN-THE-LOOP FEEDBACK AUDIT LOG
```

---

## 5. Biparjoy 2023 Replay & Audit Anchors

The benchmark Cyclone Biparjoy landfall case (Saurashtra & Kutch `SUB_22`, June 2023) is mathematically traced and verified:

- **Base Threshold:** $35.0\text{ mm/day}$ (IMD heavy rainfall boundary)
- **Lead-Time Scaled Threshold (D+5):** $35.0 \times (1 + 0.08 \times 4) = 46.2\text{ mm/day}$
- **D+5 NWP Forecast (GFS 00 UTC):** $42.0\text{ mm/day}$ (Moderate Rain)
- **Observed Rainfall (IMD Analysis):** $185.0\text{ mm/day}$ (Extremely Heavy Rain)
- **Absolute Error:** $|42.0 - 185.0| = 143.0\text{ mm/day}$
- **Threshold Excess:** $+96.8\text{ mm/day}$ over applied D+5 threshold ($+108.0\text{ mm/day}$ over base)
- **Prototype Risk Score:** $76/100$ ($0.7600$) calculated via transparent deterministic formula:
  $$\text{Score} = 0.35 \times \frac{26.5}{35.0} + 0.25 \times \frac{22.0}{25.0} + 0.15 \times \frac{5}{10} + 0.25 \times 0.80 = 0.7600$$
- **Anti-Leakage Cutoff:** Strict historical candidate cutoff ($\text{date} < \text{2023-06-10}$) enforced.

---

## 6. Project Structure

```
├── backend/
│   ├── app/
│   │   ├── config.py              # System configuration, data modes, provider flags
│   │   ├── main.py                # FastAPI entrypoint, middleware, static mounting
│   │   ├── alignment/             # Spatio-temporal alignment & leakage validator
│   │   │   ├── validator.py       # Strict lead-time and future observation audits
│   │   │   └── regridding.py      # Conservative areal subdivision aggregation
│   │   ├── api/
│   │   │   ├── routes.py          # REST endpoints (/risk-map, /priority, /realtime/disagreement)
│   │   │   └── edr.py             # OGC API-EDR-style endpoints modeled on OGC EDR
│   │   ├── core/
│   │   │   ├── bust_definition.py # Tail error & IMD categorical failure definitions
│   │   │   ├── multi_model.py     # Inter-model disagreement & graceful degradation
│   │   │   ├── analogues.py       # Atmospheric analogue search engine (KNN)
│   │   │   ├── decision_support.py# Forecaster review priority & empirical drivers
│   │   │   ├── governance.py      # Cryptographic provenance hashes & audit records
│   │   │   ├── feedback.py        # Forecaster feedback storage
│   │   │   ├── monitoring.py      # Drift and operational reliability monitoring
│   │   │   └── replay_events.py   # Historical events catalog with hard cutoffs & error traces
│   │   ├── ml/
│   │   │   ├── base.py            # BaseReliabilityModel abstract interface
│   │   │   ├── demo_model.py      # Deterministic prototype reliability engine
│   │   │   ├── future_model.py    # Drop-in adapter for future trained XGBoost/LightGBM
│   │   │   ├── baselines.py       # Climatology, Ensemble Spread, Historical Skill baselines
│   │   │   ├── features.py        # Spatio-temporal feature extraction
│   │   │   ├── calibration.py     # Platt scaling & calibration benchmarks
│   │   │   └── uncertainty.py     # Prototype Uncertainty Interval calculations
│   │   ├── providers/
│   │   │   ├── demo_provider.py   # Deterministic replay and synthetic test grids
│   │   │   └── live_fetcher.py    # Live GFS/AIFS fetcher with network fallback
│   │   └── schemas/
│   │       └── models.py          # Pydantic schemas with provenance fields
│   ├── data/
│   │   └── geojson/               # IMD 36 Meteorological Subdivisions polygons
│   └── tests/                     # 22 comprehensive unit, integration, and audit tests
├── frontend/
│   ├── src/
│   │   ├── components/            # MapLibreMap, WhyDistrustPanel, BottomDrawers, Navbar
│   │   ├── views/                 # 10 Dedicated operational views
│   │   ├── services/api.ts        # Typed Axios/Fetch API client
│   │   └── types/                 # TypeScript domain interfaces
│   ├── public/data/               # Subdivisions GeoJSON asset
│   ├── package.json               # Frontend dependencies & scripts
│   └── vite.config.ts             # Vite dev server configuration & API reverse proxy
├── docker-compose.yml
├── Dockerfile.backend
├── pytest.ini
├── DEMO_GUIDE.md
├── API.md
└── README.md
```

---

## 7. Installation & Setup

### Prerequisites
- Python 3.11 or higher
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# From project root
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt   # or install fastapi uvicorn pydantic pytest httpx requests
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

---

## 8. Running the Application

### Option A: Development Mode (Recommended)

1. **Start Backend Server (Port 8000):**
   ```bash
   PYTHONPATH=backend ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Start Frontend Dev Server (Port 5173):**
   ```bash
   cd frontend
   npm run dev
   ```
   *The frontend dev server includes a reverse proxy forwarding `/api` and `/edr` requests to `http://127.0.0.1:8000`.*
   *Access the web UI at:* `http://localhost:5173`

### Option B: Unified Production Mode

1. **Build Frontend:**
   ```bash
   npm --prefix frontend run build
   ```

2. **Launch FastAPI (serves static build + API):**
   ```bash
   PYTHONPATH=backend ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
   *Access the web UI at:* `http://localhost:8000`  
   *Interactive OpenAPI Docs:* `http://localhost:8000/docs`  
   *OGC API-EDR Collections:* `http://localhost:8000/edr/collections`

---

## 9. Running Tests

Run the full automated test suite (22 tests validating end-to-end replay, bust definition logic, anti-leakage guards, deterministic scoring, live pipeline fallbacks, and API contracts):

```bash
PYTHONPATH=backend ./venv/bin/pytest backend/tests -v
```

---

## 10. Environment Variables

Create a `.env` file in the project root if overriding default configuration:

```env
# Operational Mode: REPLAY | REAL | HYBRID
DATA_MODE=REPLAY

# Service Binding
HOST=127.0.0.1
PORT=8000

# External Providers (Optional / Placeholders)
NOAA_GFS_BASE_URL=https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod
ECMWF_AIFS_BASE_URL=https://data.ecmwf.int/forecasts
NCUM_ENDPOINT=https://api.ncmrwf.gov.in/v1/fcst
NCUM_API_KEY=placeholder_ncum_credential_token
```

---

## 11. Scientific Honesty & MoES Compliance

- **Advisory Role:** This software is an **advisory decision-support layer** designed for operational meteorologists; it does not replace statutory forecast bulletins issued by the India Meteorological Department.
- **Provider Integrity:** Connected external providers (GFS, AIFS) are explicitly labelled. No simulated NCUM data is ever fabricated. When live networks are unreachable, the live pipeline reports an explicit network error without generating synthetic values.
- **Open Standards:** Built on open scientific Python libraries, open geospatial formats (GeoJSON, MapLibre), and open government datasets.
