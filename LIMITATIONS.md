# System Limitations & Known Constraints — SIH26079

## 1. Data Provider Constraints
- **NCUM Restricted Access:** Programmatic real-time access to the NCMRWF Unified Model requires authenticated MoES institutional VPN peering. Consequently, NCUM is marked as `not_connected` in this workstation. The system demonstrates graceful degradation using GFS and AIFS comparison feeds.
- **Micro-Scale Convection:** At 0.25° subdivision resolution (~25km–100km), hyper-localized microbursts (e.g. within a 2km urban canyon) are not individually resolved.

## 2. Model Scope & Architectural Separation
- **Trained Model Scope:** The real reliability model `LightGBM-v1.0-Real-NWP-IMD-Calibrated` is trained on 13,680 genuine NOAA GFS forecast-verification pairs with Open-Meteo 03Z–03Z centroid-based precipitation verification. It provides calibrated out-of-time bust probabilities across India's 36 IMD subdivisions.
- **Historical Replay Separation:** The Historical Counterfactual Replay module (e.g. Cyclone Biparjoy 2023) uses an audited deterministic diagnostic heuristic (`DemoReliabilityModel`) to preserve the verified 76/100 T-5 benchmark anchor. It is explicitly separated from live LightGBM inference.
- **Decision-Support Only:** This software is exclusively designed as a decision-support and review-prioritization tool for operational meteorologists. It does not replace numerical thermodynamic integration or official IMD weather bulletins.
- **Extreme Unprecedented Regimes:** In unprecedented global climate anomalies exceeding historical envelope bounds, empirical analogue matching may have lower similarity scores.

## 3. Deployment Constraints
- **Air-Gapped Operation:** When running in completely air-gapped defense or high-security government facilities, live NOAA NOMADS and ECMWF internet feeds are disabled; the application runs locally in `REPLAY` mode.
