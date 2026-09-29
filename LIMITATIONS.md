# System Limitations & Known Constraints — SIH26079

## 1. Data Provider Constraints
- **NCUM Restricted Access:** Programmatic real-time access to the NCMRWF Unified Model requires authenticated MoES institutional VPN peering. Consequently, NCUM is marked as `not_connected` in this prototype. The system demonstrates graceful degradation using GFS and AIFS.
- **Micro-Scale Convection:** At 0.25° subdivision resolution (~25km–100km), hyper-localized microbursts (e.g. within a 2km urban canyon) are not individually resolved.

## 2. Scientific Limitations of Current Stage
- **Un-trained Prototype:** Per Section 1 of the SIH project specification, final ML training on multi-terabyte archives is deferred. The current risk estimates are derived from our deterministic `DemoReliabilityModel` and calibrated historical profiles.
- **Advisory Only:** This software is exclusively designed as a decision-support tool. It does not replace numerical thermodynamic integration or official IMD weather bulletins.
- **Extreme Unprecedented Regimes:** In unprecedented global climate anomalies exceeding historical envelope bounds, empirical analogue matching may have lower similarity scores.

## 3. Deployment Constraints
- **Air-Gapped Operation:** When running in completely air-gapped defense or high-security government facilities, live NOAA NOMADS and ECMWF internet feeds are disabled; the application runs locally in `REPLAY` mode.
