import pytest
from app.ml.trained_model import TrainedReliabilityModel
from app.ml.base import ModelFeatures

def test_real_trained_reliability_model_inference():
    model = TrainedReliabilityModel()
    assert model.is_loaded is True, "TrainedReliabilityModel artifacts must be loaded"
    assert model.is_real_model is True, "Must prioritize and load REAL NWP + IMD Verification Model"
    assert model.prototype_badge == "REAL GFS + IMD TRAINED MODEL"
    
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
    assert round(out.calibrated_probability + out.confidence, 2) == 1.0, "Confidence must strictly equal 1 - P(Bust)"
    assert out.confidence_score_pct == round(out.confidence * 100.0, 1)
    assert out.expected_error_low < out.expected_error_high
    assert out.prototype_badge == "REAL GFS + IMD TRAINED MODEL"
    assert out.shap_attributions is not None
    assert len(out.shap_attributions) > 0
    
    # Top attribution check
    top_attr = out.shap_attributions[0]
    assert "feature_name" in top_attr
    assert "display_name" in top_attr
    assert "attribution_value" in top_attr
    assert "direction" in top_attr

def test_real_model_metrics_and_baselines_integrity():
    model = TrainedReliabilityModel()
    info = model.get_model_info()
    assert info["is_loaded"] is True
    assert info["is_real_model"] is True
    assert "metrics" in info
    metrics = info["metrics"]
    
    # Real metrics tests
    assert metrics["brier_score_calibrated"] < 0.05, "Calibrated Brier score should be < 0.05"
    assert metrics["brier_skill_score_vs_climatology"] > 0.0, "BSS must be positive vs climatology"
    assert metrics["roc_auc"] > 0.70, "Real out-of-time ROC-AUC must exceed 0.70"
    assert metrics["expected_calibration_error"] < 0.03, "ECE should be under 3%"
    
    # Baselines comparison
    baselines = info["baselines_comparison"]
    assert "climatological_brier" in baselines
    assert "lead_decay_brier" in baselines
    assert "real_calibrated_brier" in baselines
    assert baselines["real_calibrated_brier"] <= baselines["climatological_brier"]

def test_synthetic_fallback_labeled_distinctly():
    """Verify that if forced to synthetic artifacts, it labels badge clearly as SYNTHETIC PROTOTYPE."""
    from pathlib import Path
    # Pass a path that only has synthetic artifacts (not real)
    parent_artifacts = Path(__file__).resolve().parents[1] / "app" / "ml" / "artifacts"
    # By creating an empty or synthetic-only wrapper:
    synthetic_model = TrainedReliabilityModel(artifacts_dir=parent_artifacts / "synthetic_non_existent")
    # Should fall back cleanly to demo heuristic
    feats = ModelFeatures(
        region_id="SUB_22", lead_time_days=3, forecast_value=12.0, ensemble_spread=5.0,
        inter_model_difference=3.0, climatological_mean=8.0, spatial_gradient=2.0
    )
    res = synthetic_model.predict(feats)
    assert res.prototype_badge in ["DEMO RULE-BASED HEURISTIC", "SYNTHETIC PROTOTYPE MODEL"]
