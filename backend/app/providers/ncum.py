from typing import Dict, Any, Optional
from app.providers.base import BaseForecastProvider, ForecastGrid
from app.schemas.models import DataModeEnum, ForecastVariable

class NCUMProvider(BaseForecastProvider):
    """
    NCUM (NCMRWF Unified Model) Provider Adapter.
    
    IMPORTANT SCIENTIFIC GOVERNANCE NOTE:
    NCUM is an operational Numerical Weather Prediction system maintained by
    NCMRWF (National Centre for Medium Range Weather Forecasting), Ministry of
    Earth Sciences (MoES), Government of India.
    
    Direct real-time programmatic access to NCUM raw model fields requires
    authenticated institutional credentials and dedicated MoES server peering.
    
    In accordance with system integrity guidelines, THIS PROVIDER DOES NOT
    FABRICATE OR SIMULATE NCUM DATA. It reports its exact offline/disconnected
    status and triggers graceful degradation to GFS and AIFS.
    """
    
    def __init__(self):
        super().__init__(
            name="NCUM",
            agency="NCMRWF / MoES India",
            resolution="12km Global / 4km Regional",
            is_connected=False  # Explicitly disconnected until institutional API token configured
        )

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "agency": self.agency,
            "resolution": self.resolution,
            "is_connected": False,
            "status": "not_connected",
            "message": "RESTRICTED / NOT CONNECTED. Institutional NCMRWF credentials required. System automatically operates in single/multi-model fallback mode.",
            "data_policy": "MoES Restricted Operational Product"
        }

    def fetch_forecast(
        self,
        init_time: str,
        lead_time_days: int,
        variable: ForecastVariable,
        mode: DataModeEnum
    ) -> Optional[ForecastGrid]:
        # Return None honestly rather than fabricating fake data
        return None
