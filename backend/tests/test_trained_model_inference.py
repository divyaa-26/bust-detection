import pytest
from app.ml.trained_model import TrainedReliabilityModel
from app.ml.base import ModelFeatures

def test_trained_reliability_model_inference():
    model = TrainedReliabilityModel()
    assert model.is_loaded is True, "TrainedReliabilityModel artifacts must be loaded"
    
    feats = ModelFeatures(
        region_id="SUB_22",
        lead_time_days=5,
        forecast_value=45.0,
        ensemble_spread=24.0,
        inter_model_difference=20.0,
        climatological_mean=15.0,
        spatial_gradient=12.0,
        is_ghats_or_coastal=True,
        consecutive_run_delta=8.0,
        analogue_historical_bust_rate=0.75,
        analogue_mean_error=85.0,
        season_month=6
    )
    
    out = model.predict(feats)
    assert 0.0 <= out.bust_probability <= 1.0
    assert 0.0 <= out.calibrated_probability <= 1.0
    assert 0.0 <= out.confidence <= 1.0
    assert round(out.calibrated_probability + out.confidence, 2) == 1.0
    assert out.confidence_score_pct == round(out.confidence * 100.0, 1)
    assert out.expected_error_low < out.expected_error_high
    assert out.confidence_tier == "Trained & Calibrated"
    assert out.shap_attributions is not None
    assert len(out.shap_attributions) > 0
    # Top attribution check
    top_attr = out.shap_attributions[0]
    assert "feature_name" in top_attr
    assert "display_name" in top_attr
    assert "attribution_value" in top_attr
    assert "direction" in top_attr

def test_model_metrics_and_baselines_integrity():
    model = TrainedReliabilityModel()
    info = model.get_model_info()
    assert info["is_loaded"] is True
    assert "metrics" in info
    metrics = info["metrics"]
    assert metrics["brier_score"] < 0.05, "Calibrated model Brier score should be < 0.05"
    assert metrics["brier_skill_score_vs_climatology"] > 0.50, "BSS should be positive vs climatology"
    assert metrics["roc_auc"] > 0.90, "ROC-AUC should exceed 0.90"
    assert metrics["expected_calibration_error"] < 0.05, "ECE should be low"
    
    # Baselines comparison
    baselines = info["baselines_comparison"]
    assert "climatology_brier_score" in baselines
    assert "ensemble_spread_brier_score" in baselines
    assert "lead_decay_brier_score" in baselines
    assert "demo_heuristic_brier_score" in baselines
