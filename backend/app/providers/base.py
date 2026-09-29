from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.models import DataModeEnum, ForecastVariable

class ForecastGrid(BaseModel):
    source: str
    model_name: str
    initialization_time: str
    valid_time: str
    lead_time_days: int
    variable: ForecastVariable
    units: str
    resolution: str
    data_mode: DataModeEnum
    subdivision_values: Dict[str, float]  # region_id -> value
    ensemble_spread: Dict[str, float]     # region_id -> spread (std dev across members)
    ensemble_members_count: int = 21

class ObservationGrid(BaseModel):
    source: str
    valid_time: str
    variable: ForecastVariable
    units: str
    resolution: str
    subdivision_values: Dict[str, float]  # region_id -> observed value

class BaseForecastProvider(ABC):
    """Abstract base class for NWP and AI-NWP forecast providers."""
    
    def __init__(self, name: str, agency: str, resolution: str, is_connected: bool):
        self.name = name
        self.agency = agency
        self.resolution = resolution
        self.is_connected = is_connected

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Return connectivity, license and resolution metadata."""
        pass

    @abstractmethod
    def fetch_forecast(
        self,
        init_time: str,
        lead_time_days: int,
        variable: ForecastVariable,
        mode: DataModeEnum
    ) -> Optional[ForecastGrid]:
        """Fetch forecast grid for specified run, lead, and variable."""
        pass

class BaseObservationProvider(ABC):
    """Abstract base class for ground-truth observational and reanalysis datasets."""
    
    def __init__(self, name: str, source_type: str, resolution: str):
        self.name = name
        self.source_type = source_type
        self.resolution = resolution

    @abstractmethod
    def fetch_observation(
        self,
        valid_date: str,
        variable: ForecastVariable,
        mode: DataModeEnum
    ) -> Optional[ObservationGrid]:
        """Fetch observation grid for specified valid date."""
        pass
