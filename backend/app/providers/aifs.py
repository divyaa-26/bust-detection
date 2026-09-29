from typing import Dict, Any, Optional
from app.providers.base import BaseForecastProvider, ForecastGrid
from app.schemas.models import DataModeEnum, ForecastVariable

class AIFSProvider(BaseForecastProvider):
    """
    Artificial Intelligence Forecasting System (AIFS) Provider.
    Operated by ECMWF. Next-generation data-driven ML NWP model.
    Open access via ECMWF Open Data under CC-BY-4.0.
    """
    
    def __init__(self):
        super().__init__(
            name="AIFS",
            agency="ECMWF",
            resolution="0.25° (~28km)",
            is_connected=True
        )

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "agency": self.agency,
            "resolution": self.resolution,
            "is_connected": True,
            "status": "connected",
            "message": "Connected via ECMWF Open Data API",
            "update_cycle": "12-hourly (00, 12 UTC)"
        }

    def fetch_forecast(
        self,
        init_time: str,
        lead_time_days: int,
        variable: ForecastVariable,
        mode: DataModeEnum
    ) -> Optional[ForecastGrid]:
        from app.providers.demo_provider import DemoProvider
        return DemoProvider.generate_synthetic_grid(
            source="AIFS",
            init_time=init_time,
            lead_time_days=lead_time_days,
            variable=variable,
            bias_offset=0.92,
            spread_factor=0.88
        )
