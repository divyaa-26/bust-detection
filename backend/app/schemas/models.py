from __future__ import annotations
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class DataModeEnum(str, Enum):
    REAL = "REAL"
    REPLAY = "REPLAY"
    DEMO = "DEMO"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    SEVERE = "SEVERE"

class OperationalPriority(str, Enum):
    LOW = "LOW"
    MONITOR = "MONITOR"
    HIGH_REVIEW = "HIGH — REVIEW"
    CRITICAL_INSPECTION = "CRITICAL — INSPECTION REQUIRED"

class ProviderStatusEnum(str, Enum):
    ACTIVE = "active"
    CONNECTED = "connected"
    PARTIAL = "partial"
    NOT_CONNECTED = "not_connected"

class ForecastVariable(str, Enum):
    PRECIPITATION = "precipitation_mm_day"
    TEMPERATURE = "temperature_2m_c"
    WIND_SPEED = "wind_speed_10m_kmh"

class FeedbackDecision(str, Enum):
    CONFIRM = "CONFIRM"
    REJECT = "REJECT"
    NEEDS_REVIEW = "NEEDS_REVIEW"

# Region Schemas
class RegionMetadata(BaseModel):
    region_id: str
    name: str
    category: str = "meteorological_subdivision"  # or 'state'
    center_lat: float
    center_lon: float
    area_sq_km: Optional[float] = None
    terrain_type: Optional[str] = "plains"  # coastal, ghats, himalayan, plains, plateau

# Forecast Schemas
class ForecastMetadata(BaseModel):
    source: str
    model_name: str
    initialization_time: str
    valid_time: str
    lead_time_days: int
    variable: ForecastVariable
    units: str
    ensemble_members_count: int = 1
    ensemble_member_id: Optional[str] = "ens_mean"
    resolution: str
    data_mode: DataModeEnum

class ForecastGridPoint(BaseModel):
    lat: float
    lon: float
    value: float
    uncertainty_spread: Optional[float] = None

# Bust Definition
class BustDefinitionType(str, Enum):
    ERROR_TAIL = "ERROR_TAIL"               # absolute/normalized error exceeds 90th percentile of training period
    CATEGORY_FAILURE = "CATEGORY_FAILURE"   # rainfall category shift (e.g., predicted light but observed heavy/extreme)
    COMPOUND_SEVERITY = "COMPOUND_SEVERITY" # error magnitude and spatial displacement combined

class BustAttribution(BaseModel):
    definition_id: BustDefinitionType
    threshold_value: float
    threshold_type: str = "PROTOTYPE ASSUMPTION — EMPIRICAL HEURISTIC"
    threshold_source: str = "Empirical ~90th percentile of absolute error (|F - O| >= 35.0 mm/day at D+5) from 2018–2022 IMD Monsoon baseline"
    calibration_period: str = "2018–2022 IMD Daily Gridded Rainfall Baseline (Prototype Reference)"
    forecast_value: float
    observed_value: Optional[float] = None
    absolute_error: Optional[float] = None
    normalized_error: Optional[float] = None
    lead_time_days: int
    region_id: str
    forecast_source: str
    is_bust: bool
    explanation: str

# Explainable Drivers ("Why Distrust This Forecast?")
class DriverDetail(BaseModel):
    driver_name: str
    severity: str  # HIGH, MODERATE, LOW
    metric_value: float
    benchmark_value: float
    description: str

class HistoricalAnalogue(BaseModel):
    analogue_id: str
    event_name: str
    historical_date: str
    region_id: str
    region_name: str
    lead_time_days: int
    similarity_score: float  # 0.0 to 1.0 (cosine or mahalanobis)
    forecast_synoptic_setup: str
    actual_outcome: str
    was_bust: bool
    observed_error_mm: float
    bias_direction: Optional[str] = "UNDERFORECAST"  # UNDERFORECAST, OVERFORECAST, NEUTRAL

class AnalogueErrorSummary(BaseModel):
    analogue_count: int
    historical_bust_rate: float
    mean_observed_error_mm: float
    dominant_bias_direction: str
    summary_text: str

# Decision Support & Risk Prediction
class PredictionDetail(BaseModel):
    prediction_id: str
    region_id: str
    region_name: str
    center_lat: float
    center_lon: float
    lead_time_days: int
    forecast_date: str
    valid_date: str
    variable: ForecastVariable
    forecast_value: float
    units: str
    
    # Probabilities & Uncertainty (Calibrated LightGBM ML Model with Demo Heuristic fallback)
    prototype_badge: str = "ML MODEL (LightGBM + Isotonic)"
    prototype_risk_score: float = Field(0.0, ge=0.0, le=1.0, description="Risk score (0.0 to 1.0)")
    demo_bust_probability: float = Field(..., ge=0.0, le=1.0, description="Bust probability estimate")
    calibrated_probability_estimate: float = Field(..., ge=0.0, le=1.0, description="Isotonically calibrated bust probability P(Bust)")
    confidence: float = Field(0.5, ge=0.0, le=1.0, description="Calibrated forecast confidence score (1 - P(Bust))")
    confidence_score_pct: float = Field(50.0, ge=0.0, le=100.0, description="Calibrated forecast confidence percentage (0 to 100)")
    risk_level: RiskLevel
    expected_error_range: tuple[float, float]
    prototype_uncertainty_interval: tuple[float, float] = Field(..., description="Prototype uncertainty interval derived from spread-residual heuristic")
    conformal_interval_90: tuple[float, float] = Field(..., description="Legacy alias for uncertainty interval")
    confidence_tier: str = "Trained & Calibrated"
    
    # Model agreement & ensemble
    ensemble_spread: float
    inter_model_disagreement: float
    historical_skill_at_lead: float
    spatial_gradient_instability: float
    
    # Why Distrust drivers & Explainable AI (SHAP attributions and physical drivers)
    why_distrust_drivers: List[DriverDetail]
    shap_attributions: Optional[List[Dict[str, Any]]] = None
    historical_analogues: List[HistoricalAnalogue]
    analogue_error_summary: Optional[AnalogueErrorSummary] = None
    
    # Operational priority
    operational_priority: OperationalPriority
    recommended_action: str
    
    # Scientific honesty & provenance
    model_name: str = "TrainedReliabilityModel (LightGBM + Isotonic Calibration)"
    data_mode: DataModeEnum
    provenance_hash: str

# Forecaster Priority Row
class PriorityQueueItem(BaseModel):
    rank: int
    region_id: str
    region_name: str
    lead_time_days: int
    bust_probability: float
    risk_level: RiskLevel
    expected_error_str: str
    top_driver: str
    operational_priority: OperationalPriority
    recommended_action: str

# Human In The Loop Feedback
class ForecasterFeedbackRequest(BaseModel):
    prediction_id: str
    forecast_id: str
    region_id: str
    lead_time_days: int
    user_name: str
    user_role: str  # e.g., Senior Duty Forecaster, Met Officer Grade II
    decision: FeedbackDecision
    decision_reason: str
    observed_actual_value: Optional[float] = None
    notes: Optional[str] = None
    calibrated_probability: Optional[float] = None
    risk_tier: Optional[str] = None
    model_version: Optional[str] = None

class ForecasterFeedbackRecord(ForecasterFeedbackRequest):
    feedback_id: str
    timestamp: str

# Counterfactual Replay Step
class ReplayEventStep(BaseModel):
    step_lead: str  # T-5, T-4, T-3, T-2, T-1, EVENT_REVEAL
    lead_time_days: int
    valid_date: str
    as_of_cutoff_utc: str
    forecast_source: str = "NOAA Operational GFS 0.25° Cycle"
    observation_source: str = "IMD Daily Gridded Rainfall (0.25° x 0.25°)"
    units: str = "mm/day"
    forecast_rainfall_mm: float
    bust_risk_percent: float
    risk_level: RiskLevel
    ensemble_spread_mm: float
    multi_model_disagreement: float
    historical_similarity: float
    priority: OperationalPriority
    why_distrust_summary: str
    prototype_badge: str = "PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED"
    prototype_uncertainty_interval: tuple[float, float] = (15.0, 45.0)
    leakage_guard_verified: bool = True
    actual_outcome_revealed: bool = False
    observed_rainfall_mm: Optional[float] = None
    bust_occurred: Optional[bool] = None
    error_calculation_trace: Optional[str] = None

class HistoricalReplayEvent(BaseModel):
    event_id: str
    event_name: str
    event_category: str  # Cyclone, Extreme Monsoon, Western Disturbance
    start_date: str
    event_date: str
    target_region_id: str
    target_region_name: str
    coordinates_lat_lon: tuple[float, float] = (22.3, 70.3)
    forecast_source: str = "NOAA Operational GFS 0.25° Cycle"
    observation_source: str = "IMD Daily Gridded Rainfall Analysis (0.25° x 0.25°)"
    units: str = "mm/day"
    synoptic_description: str
    post_event_analysis: str
    error_derivation_formula: str = "|Forecast - Observed| vs Empirical Tail Threshold & IMD Rain Category Transition"
    steps: List[ReplayEventStep]

# Governance & Provenance
class GovernanceRecord(BaseModel):
    prediction_id: str
    forecast_source: str
    forecast_model: str
    initialization_time: str
    valid_time: str
    lead_time_days: int
    dataset_version: str
    feature_version: str
    bust_definition_version: str
    model_version: str
    calibration_version: str
    git_commit: str
    inference_timestamp: str
    data_mode: DataModeEnum
    regridding_method: str = "conservative_areal_interpolation"
    target_resolution: str = "0.25deg"

# System Monitoring & Drift Status
class SystemMonitoringStatus(BaseModel):
    overall_status: str  # Nominal, Watch, Reliability Degrading
    data_mode: DataModeEnum
    last_cycle_timestamp: str
    active_providers_count: int
    total_predictions_evaluated: int
    observed_drift_index: float  # 0.0 to 1.0
    drift_status_note: str
    active_providers: Dict[str, Any]
