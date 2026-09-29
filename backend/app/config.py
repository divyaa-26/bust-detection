import os
import subprocess
from enum import Enum
from pathlib import Path
from pydantic import BaseModel, Field

class DataMode(str, Enum):
    REAL = "REAL"
    REPLAY = "REPLAY"
    DEMO = "DEMO"

def get_git_commit() -> str:
    """Safely retrieves current git commit or fallback."""
    try:
        res = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            check=False,
            timeout=2,
        )
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except Exception:
        pass
    return "sih-2026-v1.0"

class AppConfig(BaseModel):
    app_name: str = "Forecast Reliability Intelligence & Decision-Support System"
    app_version: str = "1.0.0-sih26079"
    problem_statement: str = "SIH26079 — AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts"
    sponsor: str = "Ministry of Earth Sciences (MoES), Government of India"
    
    # Active data mode: REPLAY is default demo mode, DEMO is lightweight, REAL when configured
    data_mode: DataMode = DataMode(os.getenv("DATA_MODE", DataMode.REPLAY.value))
    
    # Model & schema versions for provenance & governance
    model_version: str = "demo-reliability-v1.0.0"
    feature_version: str = "feat-spatiotemporal-v1"
    bust_definition_version: str = "bust-def-v1.2"
    calibration_version: str = "calib-platt-v1"
    dataset_version: str = "imd-gfs-regridded-0.25deg-v2"
    git_commit: str = Field(default_factory=get_git_commit)
    
    # Base paths
    base_dir: Path = Path(__file__).resolve().parent.parent
    data_dir: Path = base_dir / "data"
    replay_dir: Path = data_dir / "replay"
    demo_dir: Path = data_dir / "demo"
    geojson_dir: Path = data_dir / "geojson"
    feedback_file: Path = data_dir / "forecaster_feedback.json"
    
    # Active NWP / AI Providers status (Honest provider status)
    active_providers: dict[str, dict] = {
        "GFS": {
            "status": "active",
            "type": "NWP Operational",
            "agency": "NCEP / NOAA",
            "resolution": "0.25° (~25km)",
            "update_cycle": "6-hourly (00, 06, 12, 18 UTC)",
            "is_connected": True,
            "access_note": "Legitimate open access via AWS NOAA Open Data & NOMADS"
        },
        "AIFS": {
            "status": "connected",
            "type": "Data-Driven ML NWP",
            "agency": "ECMWF",
            "resolution": "0.25° (~28km)",
            "update_cycle": "12-hourly (00, 12 UTC)",
            "is_connected": True,
            "access_note": "Legitimate open access under ECMWF Open Data license"
        },
        "ECMWF_IFS": {
            "status": "partial",
            "type": "NWP Ensemble (ENS)",
            "agency": "ECMWF",
            "resolution": "0.4° (Open WMO subset)",
            "update_cycle": "12-hourly",
            "is_connected": True,
            "access_note": "WMO essential/open dataset subset accessible"
        },
        "NCUM": {
            "status": "not_connected",
            "type": "NWP Unified Model",
            "agency": "NCMRWF / MoES India",
            "resolution": "12km global / 4km regional",
            "update_cycle": "Operational",
            "is_connected": False,
            "access_note": "RESTRICTED / NOT CONNECTED. Legitimate institutional MoES credentials required. System demonstrates graceful degradation."
        }
    }

config = AppConfig()
