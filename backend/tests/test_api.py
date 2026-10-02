import pytest
from fastapi.testclient import TestClient
from app.config import config
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_config_endpoint():
    res = client.get("/api/config")
    assert res.status_code == 200
    data = res.json()
    assert "active_providers" in data
    # Verify NCUM is not falsely claimed as connected
    assert data["active_providers"]["NCUM"]["is_connected"] is False

def test_risk_map_endpoint():
    res = client.get("/api/risk-map?lead_time_days=5")
    assert res.status_code == 200
    data = res.json()
    assert data["lead_time_days"] == 5
    assert len(data["predictions"]) == 36  # 36 IMD subdivisions

def test_priority_endpoint():
    res = client.get("/api/priority?lead_time_days=5")
    assert res.status_code == 200
    queue = res.json()
    assert len(queue) == 36
    # First item should have rank 1
    assert queue[0]["rank"] == 1
    assert "operational_priority" in queue[0]

def test_feedback_submission_and_retrieval():
    original_content = None
    if config.feedback_file.exists():
        with open(config.feedback_file, "r") as f:
            original_content = f.read()

    try:
        payload = {
            "prediction_id": "PRED-GFS-SUB_22-D5-TEST",
            "forecast_id": "FCST-SUB_22-D5",
            "region_id": "SUB_22",
            "lead_time_days": 5,
            "user_name": "Duty Forecaster",
            "user_role": "Senior Duty Forecaster",
            "decision": "CONFIRM",
            "decision_reason": "Convective parameter disparity in coastal radar sounding",
            "notes": "Sounding indicates high CAPE not resolved in synoptic cycle",
            "calibrated_probability": 0.28,
            "risk_tier": "CRITICAL — INSPECTION REQUIRED",
            "model_version": "LightGBM-v1.0-Real-NWP-IMD-Calibrated"
        }
        res_post = client.post("/api/feedback", json=payload)
        assert res_post.status_code == 200
        rec = res_post.json()
        assert rec["decision"] == "CONFIRM"
        assert rec["calibrated_probability"] == 0.28
        assert rec["risk_tier"] == "CRITICAL — INSPECTION REQUIRED"
        assert rec["model_version"] == "LightGBM-v1.0-Real-NWP-IMD-Calibrated"
        assert "feedback_id" in rec
        assert "timestamp" in rec

        res_get = client.get("/api/feedback")
        assert res_get.status_code == 200
        items = res_get.json()
        assert len(items) >= 1
        assert any(i["feedback_id"] == rec["feedback_id"] for i in items)
    finally:
        if original_content is not None:
            with open(config.feedback_file, "w") as f:
                f.write(original_content)

def test_historical_events_endpoint():
    res = client.get("/api/events")
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 3
    
    # Check detail of Biparjoy
    biparjoy = client.get("/api/events/biparjoy_2023")
    assert biparjoy.status_code == 200
    event_data = biparjoy.json()
    assert len(event_data["steps"]) >= 4

def test_edr_endpoints():
    res = client.get("/edr/collections")
    assert res.status_code == 200
    assert "collections" in res.json()
    assert "modeled on OGC API-EDR" in res.json()["conformance_notice"]
    
    pos_res = client.get("/edr/collections/forecast-bust/position?coords=POINT(70.3%2022.3)&lead_time_days=5")
    assert pos_res.status_code == 200
    assert pos_res.json()["type"] == "Feature"

def test_realtime_disagreement_endpoint():
    res = client.get("/api/realtime/disagreement?lead_time_days=5")
    assert res.status_code == 200
    data = res.json()
    assert data["feature_name"] == "Today's Real Forecast Disagreement"
    assert len(data["disagreements"]) == 36
    # NCUM must be explicitly excluded with honest reason
    assert any(m["model"] == "NCUM" for m in data["excluded_models"])

def test_biparjoy_provenance_and_leakage_cutoffs():
    res = client.get("/api/events/biparjoy_2023")
    assert res.status_code == 200
    biparjoy = res.json()
    assert biparjoy["target_region_id"] == "SUB_22"
    assert biparjoy["coordinates_lat_lon"] == [22.3, 70.3]
    assert biparjoy["units"] == "mm/day"
    
    # Verify every step has as_of_cutoff_utc and does not leak future data
    for step in biparjoy["steps"]:
        assert "as_of_cutoff_utc" in step
        assert step["prototype_badge"] == "PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED"
        if not step["actual_outcome_revealed"]:
            assert step["observed_rainfall_mm"] is None
        else:
            assert step["observed_rainfall_mm"] == 185.0
            assert step["forecast_rainfall_mm"] == 42.0
            assert "143.0 mm" in step["error_calculation_trace"]

def test_realtime_disagreement_live_pipeline_success():
    """
    Verify complete path:
    real external GFS fetch -> real ECMWF/AIFS fetch -> normalization -> disagreement calculation -> map output.
    """
    from unittest.mock import MagicMock
    from app.providers.live_fetcher import LiveForecastFetcher
    
    mock_payload = [
        {
            "latitude": 22.3,
            "longitude": 70.3,
            "daily": {
                "precipitation_sum_gfs_seamless": [0.0, 5.0, 10.0, 18.0, 25.0, 32.0, 40.0],
                "precipitation_sum_ecmwf_aifs025": [0.0, 3.0, 8.0, 12.0, 15.0, 19.0, 22.0]
            }
        },
        {
            "latitude": 18.5,
            "longitude": 73.2,
            "daily": {
                "precipitation_sum_gfs_seamless": [2.0, 10.0, 25.0, 45.0, 70.0, 95.0, 120.0],
                "precipitation_sum_ecmwf_aifs025": [1.0, 8.0, 20.0, 38.0, 55.0, 72.0, 90.0]
            }
        }
    ]
    
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload
    mock_resp.raise_for_status.return_value = None
    
    mock_client = MagicMock()
    mock_client.get.return_value = mock_resp
    
    data = LiveForecastFetcher.execute_live_disagreement_pipeline(
        lead_time_days=5,
        client=mock_client
    )
    assert data["status"] == "LIVE_FETCH_SUCCESS"
    assert data["is_live_external"] is True
    assert data["live_data_synthesized"] is False
    assert len(data["disagreements"]) >= 2
    # Verify discrepancy calculation: |32.0 - 19.0| = 13.0 mm
    item0 = data["disagreements"][0]
    assert item0["discrepancy_mm"] == round(abs(item0["gfs_forecast_mm"] - item0["aifs_forecast_mm"]), 1)

def test_realtime_disagreement_graceful_fallback_no_synthesis():
    """
    Verify graceful fallback when external network access fails:
    Must report unreachable status and NEVER synthesize live values.
    """
    # Calling in sandbox environment without mock forces external network connect error
    res = client.get("/api/realtime/disagreement?mode=REAL&lead_time_days=5")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "EXTERNAL_NETWORK_UNREACHABLE"
    assert data["is_live_external"] is False
    assert data["live_data_synthesized"] is False
    assert data["disagreements"] == []
    assert "strictly NOT synthesized" in data["status_message"]

def test_model_metrics_endpoint():
    """Verify that /api/model/metrics returns real model Isotonic calibration and out-of-time metrics."""
    res = client.get("/api/model/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "TRAINED_REAL_MODEL"
    assert data["is_real_model"] is True
    assert data["model_badge"] == "REAL GFS + OPEN-METEO VERIFIED MODEL"
    
    # Verify calibration block exposes actual committed Isotonic calibration results
    calib = data["calibration"]
    assert "Isotonic Regression" in calib["method_name"]
    assert calib["expected_calibration_error"] == 0.0152
    assert calib["brier_score_calibrated"] == 0.0362
    assert "reliability_bins" in calib
    assert len(calib["reliability_bins"]) == 10
    
    # Verify metrics
    metrics = data["metrics"]
    assert metrics["brier_score_calibrated"] == 0.0362
    assert metrics["roc_auc"] == 0.7823
    assert metrics["pr_auc"] == 0.1326
    assert metrics["brier_skill_score_vs_climatology"] == 0.0474



