# Data Pipeline & Synchronization — SIH26079

## 1. Supported Data Modes

The architecture mandates three operational data modes:

| Mode | Label | Description | Operational Use Case |
|---|---|---|---|
| **Mode A** | `REAL` | Live streaming from NOAA NOMADS / ECMWF Open Data | Real-time operations when internet or institutional peering is active |
| **Mode B** | `REPLAY` | Curated pre-processed historical weather & forecast cycles | **Main SIH Hackathon Demo Mode** (tested for zero leakage) |
| **Mode C** | `DEMO` | Small deterministic synthetic dataset | Fast offline unit testing & lightweight developer workflows |

The active mode is prominently surfaced in the UI header and recorded in every prediction's provenance metadata.

---

## 2. Ingestion & Provider Architecture

All providers subclass `BaseForecastProvider` or `BaseObservationProvider`.

### Forecast Providers
- `GFSProvider`: Ingests Global Forecast System 0.25° gridded fields.
- `AIFSProvider`: Ingests ECMWF open data AI-NWP forecasts.
- `ECMWFProvider`: Ingests WMO open ensemble subsets.
- `NCUMProvider`: Operational model by NCMRWF / MoES.
  - **Scientific Honesty Rule:** Because NCUM requires authenticated MoES institutional VPN credentials, our provider honestly reports its `not_connected` status. We **never fake or simulate NCUM**. The multi-model agreement engine gracefully degrades to GFS + AIFS consensus.

### Observation Providers
- `IMDObservationProvider`: Daily 0.25° gridded rainfall analysis derived from the national rain gauge network.
- `ERA5ObservationProvider`: ECMWF global atmospheric reanalysis.

---

## 3. Strict Temporal Alignment & Leakage Prevention

One of the largest risks in weather ML is **future observation leakage** and **temporal off-by-one errors**.

The module `backend/app/alignment/validator.py` enforces three automated rules:

1. **Lead Time Consistency Check:**
   $$\text{valid\_time} = \text{initialization\_time} + \text{lead\_days}$$
   Any mismatch immediately raises `AlignmentValidationError`.
2. **Anti-Leakage Audit:**
   An inference initiated at time $T_{\text{init}}$ must **never** read observations timestamped $> T_{\text{init}}$. Ground-truth verification observations are cryptographically sealed until post-event evaluation.
3. **Timezone Normalization:**
   All cycle timestamps are strictly parsed and formatted in ISO-8601 UTC (`+00:00`).

---

## 4. Spatial Normalization & Regridding

Raw NWP grids differ in resolution (GFS: 0.25°, AIFS: 0.25°, ECMWF ENS: 0.4°, NCUM: 12km).

The system aggregates all fields to India's **36 IMD Meteorological Subdivisions** using conservative areal polygon averaging (`backend/app/alignment/regridding.py`).

Every prediction stores:
- `source_resolution`: Original model grid resolution.
- `target_resolution`: Subdivision domain.
- `regridding_method`: Bilinear / Conservative Areal Mean Aggregation.
