# System Architecture — SIH26079

## 1. Architectural Philosophy: Model-Agnostic Decision Support

The core tenet of SIH26079 is that Numerical Weather Prediction (NWP) models (and newer AI-based weather predictors) are foundational physics-based and data-driven simulators, but they suffer from **intermittent, high-impact forecast busts**—especially in the medium-range window (D+3 to D+10).

Rather than training a monolithic AI weather model to compete with NWP centers, SIH26079 introduces a **Reliability Intelligence & Decision-Support Layer**.

```
+-------------------------------------------------------------------------+
|                         INGESTION & PROVIDERS                           |
|  [GFS 0.25°]     [AIFS 0.25°]    [ECMWF ENS]    [NCUM (When Peered)]     |
|      |                |               |                  |              |
+------v----------------v---------------v------------------v--------------+
                                |
+-------------------------------v-----------------------------------------+
|                  ALIGNMENT & LEAKAGE VALIDATION                         |
|  - Check: valid_time == init_time + lead_days (Zero off-by-one errors)   |
|  - Check: No observation timestamps after inference time (Anti-Leakage) |
|  - Conservative areal regridding to 36 IMD Subdivisions                 |
+-------------------------------|-----------------------------------------+
                                |
+-------------------------------v-----------------------------------------+
|                 SPATIO-TEMPORAL FEATURE EXTRACTION                      |
|  - Physical spread: sigma_ens, ensemble min/max                         |
|  - Inter-model discrepancy: |GFS - AIFS|                                 |
|  - Spatial gradients: neighbor subdivision variance                     |
|  - Climatological anomaly: |Forecast - Climatology|                     |
|  - Orographic/coastal boundaries indicators                             |
+-------------------------------|-----------------------------------------+
                                |
+-------------------------------v-----------------------------------------+
|                  RELIABILITY & UNCERTAINTY ENGINES                      |
|  - Deterministic Prototype Engine (DemoReliabilityModel)                |
|  - Drop-in Future Trained Adapter (FutureTrainedModel - XGBoost/LGBM)   |
|  - Probability Calibration (Platt Sigmoid / Isotonic Curves)            |
|  - Conformal Prediction Intervals (Distribution-free coverage)           |
+-------------------------------|-----------------------------------------+
                                |
+-------------------------------v-----------------------------------------+
|                   DECISION SUPPORT & HITL REVIEW                        |
|  - Explainable Drivers ("Why Distrust This Forecast?")                  |
|  - Historical Atmospheric Analogue Search (KNN on Synoptic Vectors)     |
|  - Forecaster Operational Review Priority Ranking                       |
|  - Human-in-the-Loop Feedback Ledger                                    |
+-------------------------------|-----------------------------------------+
                                |
+-------------------------------v-----------------------------------------+
|                      PRESENTATION & INTEROPERABILITY                    |
|  - MapLibre GL JS Choropleth Map (36 IMD Subdivisions)                  |
|  - RESTful OpenAPI Service                                              |
|  - OGC API - Environmental Data Retrieval (EDR) Standards               |
+-------------------------------------------------------------------------+
```

## 2. Separation of Concerns & Future ML Swap-In

The system adheres to strict modularity:
1. `BaseReliabilityModel` (`backend/app/ml/base.py`):
   Defines the immutable abstract contract: `predict(features: ModelFeatures) -> RawModelOutput`.
2. `DemoReliabilityModel` (`backend/app/ml/demo_model.py`):
   Our current deterministic prototype engine. It derives bust risk transparently from physical indicators (ensemble spread, model conflict, lead-time decay, climatological anomaly, spatial instability). It does not require gigabytes of neural weights.
3. `FutureTrainedModel` (`backend/app/ml/future_model.py`):
   When final ML training is executed in Stage 2, it loads the serialized tree weights and satisfies the exact same interface. The frontend, MapLibre tiles, REST endpoints, and priority queue undergo **zero modifications**.

## 3. Data Flow & Latency Optimization

- Forecast fields are pre-aggregated to standard subdivision polygons, preventing slow real-time raster rendering.
- Replay events are indexed and cached in memory.
- The web application loads in under 200ms, satisfying operational duty-room responsiveness requirements.
