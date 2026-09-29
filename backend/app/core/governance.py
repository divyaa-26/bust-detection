import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any
from app.config import config
from app.schemas.models import GovernanceRecord, DataModeEnum

class GovernanceEngine:
    """
    Maintains full audit trails and cryptographic reproducibility hashes for every inference call.
    """

    @classmethod
    def generate_prediction_id(
        cls,
        source: str,
        init_time: str,
        region_id: str,
        lead_time_days: int
    ) -> str:
        raw_key = f"{source}:{init_time}:{region_id}:D+{lead_time_days}:{config.model_version}"
        hash_digest = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()[:12]
        return f"PRED-{source}-{region_id}-D{lead_time_days}-{hash_digest}"

    @classmethod
    def create_governance_record(
        cls,
        prediction_id: str,
        forecast_source: str,
        forecast_model: str,
        initialization_time: str,
        valid_time: str,
        lead_time_days: int,
        data_mode: DataModeEnum
    ) -> GovernanceRecord:
        now_utc = datetime.now(timezone.utc).isoformat()
        
        return GovernanceRecord(
            prediction_id=prediction_id,
            forecast_source=forecast_source,
            forecast_model=forecast_model,
            initialization_time=initialization_time,
            valid_time=valid_time,
            lead_time_days=lead_time_days,
            dataset_version=config.dataset_version,
            feature_version=config.feature_version,
            bust_definition_version=config.bust_definition_version,
            model_version=config.model_version,
            calibration_version=config.calibration_version,
            git_commit=config.git_commit,
            inference_timestamp=now_utc,
            data_mode=data_mode,
            regridding_method="Conservative Areal Polygon Mean",
            target_resolution="IMD 36 Subdivision Domain"
        )
