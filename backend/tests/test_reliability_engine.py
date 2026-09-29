import pytest
from app.ml.demo_model import DemoReliabilityModel
from app.ml.base import ModelFeatures
from app.ml.baselines import BaselineComparisonEngine
from app.core.multi_model import MultiModelAgreementEngine
from app.providers.demo_provider import DemoProvider
from app.schemas.models import ForecastVariable

def test_deterministic_demo_model_output():
    model = DemoReliabilityModel()
    feats = ModelFeatures(
        region_id="SUB_22",
        lead_time_days=5,
        forecast_value=45.0,
        ensemble_spread=24.0,
        inter_model_difference=20.0,
        climatological_mean=15.0,
        spatial_gradient=12.0,
        is_ghats_or_coastal=True
    )
    pred = model.predict(feats)
    
    # Check deterministic bounds and confidence tier
    assert 0.0 <= pred.bust_probability <= 1.0
    assert 0.0 <= pred.calibrated_probability <= 1.0
    assert pred.expected_error_high > pred.expected_error_low
    assert "PROTOTYPE ESTIMATE" in pred.confidence_tier
    assert pred.prototype_badge == "PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED"
    assert pred.model_version == model.version

def test_baselines_structure():
    feats = ModelFeatures(
        region_id="SUB_22",
        lead_time_days=5,
        forecast_value=45.0,
        ensemble_spread=24.0,
        inter_model_difference=20.0,
        climatological_mean=15.0,
        spatial_gradient=12.0,
        is_ghats_or_coastal=True
    )
    res = BaselineComparisonEngine.evaluate_all(feats, model_bust_prob=0.74)
    assert "baseline_1_climatology" in res
    assert "baseline_2_ensemble_spread" in res
    assert "baseline_3_lead_decay" in res
    assert "model_estimate" in res

def test_multi_model_graceful_degradation():
    grid_gfs = DemoProvider.generate_synthetic_grid("GFS", "2024-07-15T00:00:00Z", 5, ForecastVariable.PRECIPITATION)
    grid_aifs = DemoProvider.generate_synthetic_grid("AIFS", "2024-07-15T00:00:00Z", 5, ForecastVariable.PRECIPITATION)
    
    # Dual-model mode
    dual_metrics = MultiModelAgreementEngine.compute_agreement([grid_gfs, grid_aifs], "SUB_22")
    assert len(dual_metrics.active_models) == 2
    assert "Multi-Model Disagreement Active" in dual_metrics.mode_description
    
    # Single-model fallback
    single_metrics = MultiModelAgreementEngine.compute_agreement([grid_gfs], "SUB_22")
    assert len(single_metrics.active_models) == 1
    assert "Single-Model Reliability Mode" in single_metrics.mode_description
