import pytest
from datetime import datetime, timedelta
from app.alignment.validator import AlignmentValidator, AlignmentValidationError
from app.providers.demo_provider import DemoProvider
from app.schemas.models import ForecastVariable, DataModeEnum
from app.ml.features import FeatureEngineeringEngine
from app.ml.demo_model import DemoReliabilityModel

def test_no_future_observation_leakage():
    """Verify that an inference run rejects any observation timestamp occurring after inference time."""
    inference_time = "2024-07-15T00:00:00Z"
    future_obs_time = "2024-07-20T00:00:00Z"
    
    # Must raise AlignmentValidationError to prevent target leakage into features
    with pytest.raises(AlignmentValidationError, match="CRITICAL LEAKAGE DETECTED"):
        AlignmentValidator.audit_future_leakage(inference_time, future_obs_time)

def test_past_observation_permitted():
    """Historical observations occurring before or at inference time are safe to consume."""
    inference_time = "2024-07-15T00:00:00Z"
    past_obs_time = "2024-07-14T00:00:00Z"
    assert AlignmentValidator.audit_future_leakage(inference_time, past_obs_time) is True

def test_lead_time_date_consistency():
    """Verify that valid_time strictly equals init_time + lead_time_days with zero off-by-one error."""
    init_time = "2024-07-15T00:00:00Z"
    valid_time = "2024-07-20T00:00:00Z"
    lead_days = 5
    
    # 5 days from July 15 is July 20: passes
    assert AlignmentValidator.validate_lead_time_consistency(init_time, valid_time, lead_days) is True
    
    # Off-by-one error (claiming D+5 is July 21) must fail
    with pytest.raises(AlignmentValidationError, match="Temporal misalignment"):
        AlignmentValidator.validate_lead_time_consistency(init_time, "2024-07-21T00:00:00Z", lead_days)

def test_feature_engine_does_not_consume_observations():
    """Verify that feature engineering at inference uses only forecast grids, not ground truth observations."""
    gfs_grid = DemoProvider.generate_synthetic_grid(
        source="GFS",
        init_time="2024-07-15T00:00:00Z",
        lead_time_days=5,
        variable=ForecastVariable.PRECIPITATION
    )
    
    feats = FeatureEngineeringEngine.extract_features(
        primary_grid=gfs_grid,
        secondary_grid=None,
        region_id="SUB_22",
        lead_time_days=5
    )
    
    # Verify features contain only valid forecast quantities
    assert hasattr(feats, "forecast_value")
    assert hasattr(feats, "ensemble_spread")
    assert not hasattr(feats, "observed_target_value")
    assert feats.lead_time_days == 5

def test_analogue_temporal_leakage_prevented():
    """
    Verify that historical analogue search at forecast time T enforces strict temporal anti-leakage:
    candidates cannot contain events or outcomes occurring on or after T.
    """
    from app.core.analogues import HistoricalAnalogueEngine
    
    # Biparjoy forecast initialization at T-5 is 2023-06-10
    as_of_date = "2023-06-10"
    analogues = HistoricalAnalogueEngine.find_top_analogues(
        target_region_id="SUB_22",
        lead_time_days=5,
        forecast_value=42.0,
        ensemble_spread=26.5,
        model_disagreement=22.0,
        as_of_date=as_of_date,
        top_k=5
    )
    
    # Must return valid pre-2023 analogues
    assert len(analogues) > 0
    
    # Every returned analogue MUST have historical_date strictly prior to as_of_date
    for ana in analogues:
        assert ana.historical_date < as_of_date, (
            f"LEAKAGE VIOLATION: Analogue {ana.analogue_id} ({ana.historical_date}) "
            f"occurs on or after as_of_date {as_of_date}!"
        )
        assert ana.analogue_id != "ANA_2023_BIPARJOY", "LEAKAGE: Event cannot be its own future analogue!"
        assert ana.analogue_id != "ANA_2023_MICHAUNG", "LEAKAGE: December 2023 event leaked into June 2023 run!"
        assert ana.analogue_id != "ANA_2024_WESTERN_DISTURBANCE", "LEAKAGE: 2024 event leaked into 2023 run!"
    
    # Verify pre-2023 Gujarat tropical cyclone was found
    analogue_ids = [a.analogue_id for a in analogues]
    assert any("TAUKTAE" in a_id or "VAYU" in a_id or "WESTERN_GHATS" in a_id for a_id in analogue_ids)

