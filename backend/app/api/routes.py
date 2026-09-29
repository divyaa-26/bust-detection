from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from app.config import config, DataMode
from app.schemas.models import (
    DataModeEnum,
    ForecastVariable,
    RiskLevel,
    OperationalPriority,
    PredictionDetail,
    PriorityQueueItem,
    ForecasterFeedbackRequest,
    ForecasterFeedbackRecord,
    HistoricalReplayEvent,
    SystemMonitoringStatus,
    GovernanceRecord
)
from app.providers import GFSProvider, AIFSProvider, ECMWFProvider, NCUMProvider, IMDObservationProvider, DemoProvider
from app.providers.live_fetcher import LiveForecastFetcher
from app.alignment import Regridder, AlignmentValidator
from app.core.bust_definition import ForecastBustDefinition
from app.core.multi_model import MultiModelAgreementEngine
from app.core.analogues import HistoricalAnalogueEngine
from app.core.decision_support import DecisionSupportEngine
from app.core.governance import GovernanceEngine
from app.core.feedback import feedback_store
from app.core.monitoring import MonitoringEngine
from app.core.replay_events import ReplayCatalogEngine
from app.ml.demo_model import DemoReliabilityModel
from app.ml.features import FeatureEngineeringEngine
from app.ml.baselines import BaselineComparisonEngine
from app.ml.calibration import ProbabilityCalibrationEngine
from app.ml.uncertainty import UncertaintyEngine

router = APIRouter(prefix="/api", tags=["Operational API"])

regridder = Regridder()
gfs_provider = GFSProvider()
aifs_provider = AIFSProvider()
ecmwf_provider = ECMWFProvider()
ncum_provider = NCUMProvider()
imd_obs_provider = IMDObservationProvider()
demo_model = DemoReliabilityModel()
bust_evaluator = ForecastBustDefinition()

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": config.app_name,
        "version": config.app_version,
        "data_mode": config.data_mode.value,
        "git_commit": config.git_commit
    }

@router.get("/config")
def get_configuration():
    return {
        "app_name": config.app_name,
        "problem_statement": config.problem_statement,
        "sponsor": config.sponsor,
        "data_mode": config.data_mode.value,
        "model_version": config.model_version,
        "feature_version": config.feature_version,
        "bust_definition_version": config.bust_definition_version,
        "dataset_version": config.dataset_version,
        "git_commit": config.git_commit,
        "active_providers": config.active_providers
    }

@router.get("/regions")
def get_regions():
    """Returns list of 36 IMD meteorological subdivisions."""
    return regridder.get_subdivision_list()

@router.get("/risk-map")
def get_risk_map(
    lead_time_days: int = 5,
    variable: ForecastVariable = ForecastVariable.PRECIPITATION,
    forecast_run: str = "2024-07-15T00:00:00Z"
):
    """
    Computes spatially explicit bust probabilities and operational review priority across all 36 subdivisions.
    """
    # Fetch primary NWP model (GFS) and secondary AI model (AIFS)
    gfs_grid = gfs_provider.fetch_forecast(forecast_run, lead_time_days, variable, config.data_mode)
    aifs_grid = aifs_provider.fetch_forecast(forecast_run, lead_time_days, variable, config.data_mode)
    
    # Audit alignment
    AlignmentValidator.validate_grid_alignment(gfs_grid)
    
    subdivisions = regridder.get_subdivision_list()
    features_geojson = []
    region_predictions = []
    
    for sub in subdivisions:
        reg_id = sub["region_id"]
        reg_name = sub["name"]
        lat = sub["center_lat"]
        lon = sub["center_lon"]
        is_ghats_or_coastal = sub.get("terrain_type") in ["coastal", "coastal_ghats", "coastal_plateau", "coastal_arid"]
        
        # 1. Feature Engineering
        model_feats = FeatureEngineeringEngine.extract_features(
            primary_grid=gfs_grid,
            secondary_grid=aifs_grid,
            region_id=reg_id,
            lead_time_days=lead_time_days
        )
        model_feats.is_ghats_or_coastal = is_ghats_or_coastal
        
        # 2. Multi-Model Agreement
        multi_metrics = MultiModelAgreementEngine.compute_agreement([gfs_grid, aifs_grid], reg_id)
        
        # 3. Model Inference (Deterministic Demo Prototype)
        raw_pred = demo_model.predict(model_feats)
        
        # 4. Historical Analogues Search with Strict Temporal Anti-Leakage
        as_of_date = forecast_run.split("T")[0] if forecast_run else None
        analogues = HistoricalAnalogueEngine.find_top_analogues(
            target_region_id=reg_id,
            lead_time_days=lead_time_days,
            forecast_value=model_feats.forecast_value,
            ensemble_spread=model_feats.ensemble_spread,
            model_disagreement=multi_metrics.inter_model_difference,
            as_of_date=as_of_date,
            top_k=3
        )
        
        # 5. Decision Support & Priority
        priority, risk_level, rec_action, drivers = DecisionSupportEngine.evaluate_priority(
            bust_probability=raw_pred.calibrated_probability,
            lead_time_days=lead_time_days,
            ensemble_spread=model_feats.ensemble_spread,
            model_disagreement=multi_metrics.inter_model_difference,
            forecast_value=model_feats.forecast_value,
            analogues=analogues,
            is_coastal_or_ghats=is_ghats_or_coastal
        )
        
        # 6. Conformal Uncertainty
        conformal = UncertaintyEngine.compute_conformal_interval(
            point_forecast=model_feats.forecast_value,
            ensemble_spread=model_feats.ensemble_spread,
            lead_time_days=lead_time_days
        )
        
        pred_id = GovernanceEngine.generate_prediction_id(
            source="GFS",
            init_time=forecast_run,
            region_id=reg_id,
            lead_time_days=lead_time_days
        )
        
        detail = PredictionDetail(
            prediction_id=pred_id,
            region_id=reg_id,
            region_name=reg_name,
            center_lat=lat,
            center_lon=lon,
            lead_time_days=lead_time_days,
            forecast_date=forecast_run[:10],
            valid_date=gfs_grid.valid_time,
            variable=variable,
            forecast_value=model_feats.forecast_value,
            units="mm/day" if variable == ForecastVariable.PRECIPITATION else "°C",
            prototype_badge="PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED",
            prototype_risk_score=raw_pred.bust_probability,
            demo_bust_probability=raw_pred.bust_probability,
            calibrated_probability_estimate=raw_pred.calibrated_probability,
            risk_level=risk_level,
            expected_error_range=(raw_pred.expected_error_low, raw_pred.expected_error_high),
            prototype_uncertainty_interval=(conformal.lower_bound, conformal.upper_bound),
            conformal_interval_90=(conformal.lower_bound, conformal.upper_bound),
            confidence_tier="PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED",
            ensemble_spread=model_feats.ensemble_spread,
            inter_model_disagreement=multi_metrics.inter_model_difference,
            historical_skill_at_lead=round(max(0.2, 1.0 - (lead_time_days * 0.08)), 2),
            spatial_gradient_instability=model_feats.spatial_gradient,
            why_distrust_drivers=drivers,
            historical_analogues=analogues,
            operational_priority=priority,
            recommended_action=rec_action,
            model_name=raw_pred.model_version,
            data_mode=config.data_mode,
            provenance_hash=pred_id
        )
        
        region_predictions.append(detail)
        
    return {
        "initialization_time": forecast_run,
        "valid_date": gfs_grid.valid_time,
        "lead_time_days": lead_time_days,
        "variable": variable.value,
        "data_mode": config.data_mode.value,
        "active_models": ["GFS", "AIFS"],
        "disconnected_models": ["NCUM (Restricted credentials required)"],
        "predictions": region_predictions
    }

@router.get("/predictions/{prediction_id}")
def get_prediction_by_id(
    prediction_id: str,
    lead_time_days: int = 5,
    forecast_run: str = "2024-07-15T00:00:00Z"
):
    """Fetches in-depth diagnostic details for a specific prediction."""
    # Extract region_id if formatted like PRED-GFS-SUB_22-...
    parts = prediction_id.split("-")
    reg_id = "SUB_22"
    for p in parts:
        if p.startswith("SUB_"):
            reg_id = p
            break
            
    risk_data = get_risk_map(lead_time_days=lead_time_days, forecast_run=forecast_run)
    for pred in risk_data["predictions"]:
        if pred.region_id == reg_id or pred.prediction_id == prediction_id:
            gov = GovernanceEngine.create_governance_record(
                prediction_id=pred.prediction_id,
                forecast_source="GFS",
                forecast_model="GFS_0.25deg_Operational",
                initialization_time=forecast_run,
                valid_time=pred.valid_date,
                lead_time_days=lead_time_days,
                data_mode=config.data_mode
            )
            # Evaluate baselines
            feats = FeatureEngineeringEngine.extract_features(
                primary_grid=gfs_provider.fetch_forecast(forecast_run, lead_time_days, ForecastVariable.PRECIPITATION, config.data_mode),
                secondary_grid=None,
                region_id=reg_id,
                lead_time_days=lead_time_days
            )
            baselines = BaselineComparisonEngine.evaluate_all(feats, pred.calibrated_probability_estimate)
            return {
                "prediction": pred,
                "governance": gov,
                "baselines": baselines
            }
            
    raise HTTPException(status_code=404, detail="Prediction not found")

@router.get("/priority")
def get_priority_queue(
    lead_time_days: int = 5,
    variable: ForecastVariable = ForecastVariable.PRECIPITATION
) -> List[PriorityQueueItem]:
    """
    Ranks India regions by Forecaster Operational Review Priority.
    Answers: 'Which regions should a forecaster inspect first?'
    """
    risk_data = get_risk_map(lead_time_days=lead_time_days, variable=variable)
    sorted_preds = sorted(
        risk_data["predictions"],
        key=lambda p: (
            1 if p.operational_priority == OperationalPriority.CRITICAL_INSPECTION else
            2 if p.operational_priority == OperationalPriority.HIGH_REVIEW else
            3 if p.operational_priority == OperationalPriority.MONITOR else 4,
            -p.calibrated_probability_estimate
        )
    )
    
    queue = []
    for rank, p in enumerate(sorted_preds, 1):
        top_driver = p.why_distrust_drivers[0].driver_name if p.why_distrust_drivers else "Baseline Stability"
        queue.append(PriorityQueueItem(
            rank=rank,
            region_id=p.region_id,
            region_name=p.region_name,
            lead_time_days=p.lead_time_days,
            bust_probability=p.calibrated_probability_estimate,
            risk_level=p.risk_level,
            expected_error_str=f"{p.expected_error_range[0]}–{p.expected_error_range[1]} mm",
            top_driver=top_driver,
            operational_priority=p.operational_priority,
            recommended_action=p.recommended_action
        ))
    return queue

@router.get("/events")
def get_historical_events() -> List[HistoricalReplayEvent]:
    """Curated list of historical counterfactual replay events."""
    return ReplayCatalogEngine.get_all_events()

@router.get("/events/{event_id}")
def get_historical_event_detail(event_id: str):
    """Retrieve full step progression (T-5 to reveal) for chosen event."""
    event = ReplayCatalogEngine.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Replay event not found")
    return event

@router.get("/model/metrics")
def get_model_metrics():
    """Honest scientific validation and probability calibration profiles."""
    calib = ProbabilityCalibrationEngine.compute_reliability_curve()
    return {
        "status": "PROTOTYPE_STAGE_1",
        "honesty_notice": "Final ML model training is deferred per specification. Metrics reflect validation baseline profile.",
        "calibration": calib,
        "active_model_info": demo_model.get_model_info()
    }

@router.get("/monitoring")
def get_system_monitoring():
    """Model drift and real-time operational reliability status."""
    return MonitoringEngine.get_system_status()

@router.post("/feedback")
def submit_forecaster_feedback(request: ForecasterFeedbackRequest) -> ForecasterFeedbackRecord:
    """Store human-in-the-loop review decisions."""
    return feedback_store.add_feedback(request)

@router.get("/feedback")
def list_forecaster_feedback() -> List[ForecasterFeedbackRecord]:
    """List recent forecaster review submissions."""
    return feedback_store.get_all_feedback()

@router.get("/realtime/disagreement")
def get_realtime_forecast_disagreement(
    lead_time_days: int = 5,
    variable: ForecastVariable = ForecastVariable.PRECIPITATION,
    forecast_run: str = "2024-07-15T00:00:00Z",
    mode: Optional[DataModeEnum] = None
):
    """
    Today's Real Forecast Disagreement (Feature #15).
    Compares legitimately accessible current GFS and ECMWF/AIFS data feeds over India.
    Pipeline: Real external GFS fetch -> Real external AIFS fetch -> Normalization -> Disagreement -> Output.
    Graceful fallback: When external network is unreachable, reports offline status without synthesizing fake values.
    """
    active_mode = mode or config.data_mode
    if active_mode == DataModeEnum.REAL:
        return LiveForecastFetcher.execute_live_disagreement_pipeline(
            lead_time_days=lead_time_days,
            variable=variable
        )
        
    # In REPLAY / DEMO mode: provide verified baseline comparison
    gfs_grid = gfs_provider.fetch_forecast(forecast_run, lead_time_days, variable, active_mode)
    aifs_grid = aifs_provider.fetch_forecast(forecast_run, lead_time_days, variable, active_mode)
    
    subdivisions = regridder.get_subdivision_list()
    disagreement_items = []
    
    for sub in subdivisions:
        reg_id = sub["region_id"]
        reg_name = sub["name"]
        gfs_val = gfs_grid.subdivision_values.get(reg_id, 0.0)
        aifs_val = aifs_grid.subdivision_values.get(reg_id, 0.0)
        diff_mm = round(abs(gfs_val - aifs_val), 1)
        
        # Agreement classification
        if diff_mm >= 18.0:
            agreement_level = "SEVERE_DISCORD"
            rec = "Significant model divergence. Duty forecaster review recommended before issuing guidance."
        elif diff_mm >= 10.0:
            agreement_level = "MODERATE_DISCORD"
            rec = "Moderate discrepancy. Cross-reference regional radar soundings."
        else:
            agreement_level = "HIGH_CONSENSUS"
            rec = "High model agreement. Standard operational consensus."
            
        disagreement_items.append({
            "region_id": reg_id,
            "region_name": reg_name,
            "lead_time_days": lead_time_days,
            "gfs_forecast_mm": gfs_val,
            "aifs_forecast_mm": aifs_val,
            "discrepancy_mm": diff_mm,
            "agreement_level": agreement_level,
            "recommendation": rec
        })
        
    disagreement_items.sort(key=lambda x: x["discrepancy_mm"], reverse=True)
    
    return {
        "status": "REPLAY_ARCHIVE_SUCCESS",
        "data_source": "VERIFIED_REPLAY_ARCHIVE",
        "live_data_synthesized": False,
        "feature_name": "Today's Real Forecast Disagreement",
        "reference_run_utc": forecast_run,
        "lead_time_days": lead_time_days,
        "variable": variable.value,
        "active_models": [
            {"model": "GFS", "agency": "NOAA / NCEP", "resolution": "0.25°", "status": "active"},
            {"model": "AIFS", "agency": "ECMWF Open Data", "resolution": "0.25°", "status": "connected"}
        ],
        "excluded_models": [
            {"model": "NCUM", "agency": "NCMRWF / MoES", "status": "not_connected", "reason": "Institutional credentials restricted — No fabricated data"}
        ],
        "max_discrepancy_region": disagreement_items[0]["region_name"] if disagreement_items else None,
        "max_discrepancy_mm": disagreement_items[0]["discrepancy_mm"] if disagreement_items else 0.0,
        "disagreements": disagreement_items
    }

