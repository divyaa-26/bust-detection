import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_region_lead_matrix_endpoint():
    response = client.get("/api/matrix/region-lead?forecast_run=2024-07-15T00:00:00Z")
    assert response.status_code == 200
    data = response.json()
    
    assert "lead_days" in data
    assert data["lead_days"] == [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    assert data["regions_count"] == 36
    assert "lead_summary" in data
    assert len(data["lead_summary"]) == 10
    
    # Check matrix entries: 36 subdivisions * 10 lead days = 360 cells
    matrix = data["matrix"]
    assert len(matrix) == 360
    
    for cell in matrix[:10]:
        assert "region_id" in cell
        assert "lead_time_days" in cell
        assert "bust_probability" in cell
        assert "confidence" in cell
        assert "risk_level" in cell
        assert 0.0 <= cell["bust_probability"] <= 1.0
        assert 0.0 <= cell["confidence"] <= 1.0
        assert round(cell["bust_probability"] + cell["confidence"], 2) == 1.0

def test_model_metrics_endpoint_reflects_trained_model():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "TRAINED_OPERATIONAL"
    assert "LightGBM" in data["model_type"]
    assert data["metrics"]["brier_skill_score_vs_climatology"] > 0.50
    assert "baselines_comparison" in data
    assert len(data["feature_importance_shap"]) > 0
