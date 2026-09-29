from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.schemas.models import RiskLevel, OperationalPriority

class ModelFeatures(BaseModel):
    region_id: str
    lead_time_days: int
    forecast_value: float
    ensemble_spread: float
    inter_model_difference: float
    climatological_mean: float
    spatial_gradient: float
    is_ghats_or_coastal: bool = False

class RawModelOutput(BaseModel):
    prototype_badge: str = "PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED"
    bust_probability: float
    calibrated_probability: float
    expected_error_low: float
    expected_error_high: float
    confidence_tier: str = "PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED"
    model_version: str

class BaseReliabilityModel(ABC):
    """
    Abstract Model Interface.
    Enforces identical signature across DemoReliabilityModel and FutureTrainedModel (XGBoost/LightGBM).
    The frontend and API NEVER depend on model internals.
    """
    
    @abstractmethod
    def predict(self, features: ModelFeatures) -> RawModelOutput:
        """Derive bust risk and uncertainty interval from features without future leakage."""
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """Return model metadata, training status, and honesty disclosure."""
        pass
