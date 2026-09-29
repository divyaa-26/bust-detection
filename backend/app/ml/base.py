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
    consecutive_run_delta: float = 0.0
    analogue_historical_bust_rate: float = 0.086
    analogue_mean_error: float = 12.0
    season_month: int = 7

class RawModelOutput(BaseModel):
    prototype_badge: str = "ML MODEL (LightGBM + Isotonic)"
    bust_probability: float
    calibrated_probability: float
    confidence: float = 0.5
    confidence_score_pct: float = 50.0
    expected_error_low: float
    expected_error_high: float
    confidence_tier: str = "Trained & Calibrated"
    model_version: str
    shap_attributions: Optional[List[Dict[str, Any]]] = None

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
