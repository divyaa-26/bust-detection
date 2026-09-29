from typing import Optional
from app.providers.base import BaseObservationProvider, ObservationGrid
from app.schemas.models import DataModeEnum, ForecastVariable

class IMDObservationProvider(BaseObservationProvider):
    """
    India Meteorological Department (IMD) Gridded Rainfall Observation Provider.
    Daily high-resolution gridded rainfall (0.25° x 0.25°) based on rain gauge network.
    """
    def __init__(self):
        super().__init__(
            name="IMD_Gridded_0.25",
            source_type="In-situ Rain Gauge Interpolated Analysis",
            resolution="0.25° (~25km)"
        )

    def fetch_observation(
        self,
        valid_date: str,
        variable: ForecastVariable,
        mode: DataModeEnum
    ) -> Optional[ObservationGrid]:
        from app.providers.demo_provider import DemoProvider
        return DemoProvider.get_ground_truth(valid_date, variable)

class ERA5ObservationProvider(BaseObservationProvider):
    """
    ECMWF ERA5 Reanalysis Provider.
    Global atmospheric reanalysis reference.
    """
    def __init__(self):
        super().__init__(
            name="ERA5_Reanalysis",
            source_type="Reanalysis (Atmospheric Model + Data Assimilation)",
            resolution="0.25°"
        )

    def fetch_observation(
        self,
        valid_date: str,
        variable: ForecastVariable,
        mode: DataModeEnum
    ) -> Optional[ObservationGrid]:
        from app.providers.demo_provider import DemoProvider
        return DemoProvider.get_ground_truth(valid_date, variable)
