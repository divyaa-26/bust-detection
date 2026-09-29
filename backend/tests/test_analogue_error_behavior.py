import pytest
from app.core.analogues import HistoricalAnalogueEngine, HISTORICAL_ANALOGUE_CATALOG
from app.schemas.models import HistoricalAnalogue

def test_analogue_error_statistics_computation():
    analogues = HistoricalAnalogueEngine.find_top_analogues(
        target_region_id="SUB_22",
        lead_time_days=5,
        forecast_value=60.0,
        ensemble_spread=25.0,
        model_disagreement=25.0,
        as_of_date="2024-01-01",
        top_k=3
    )
    
    stats = HistoricalAnalogueEngine.compute_analogue_error_statistics(analogues)
    assert stats.analogue_count == len(analogues)
    assert 0.0 <= stats.historical_bust_rate <= 1.0
    assert stats.mean_observed_error_mm > 0.0
    assert stats.dominant_bias_direction in ["UNDERFORECAST", "OVERFORECAST", "MIXED_BIAS"]
    assert "historical bust frequency" in stats.summary_text

def test_analogue_temporal_leakage_strict_boundary():
    # Target date: 2023-06-10 (before Biparjoy landfall on 2023-06-15)
    as_of = "2023-06-10"
    analogues = HistoricalAnalogueEngine.find_top_analogues(
        target_region_id="SUB_22",
        lead_time_days=5,
        forecast_value=65.0,
        ensemble_spread=28.0,
        model_disagreement=30.0,
        as_of_date=as_of,
        top_k=5
    )
    
    # Assert Biparjoy (2023-06-15) is NEVER returned when as_of_date is 2023-06-10
    analogue_ids = [a.analogue_id for a in analogues]
    assert "ANA_2023_BIPARJOY" not in analogue_ids
    for a in analogues:
        assert a.historical_date < as_of, f"Analogue date {a.historical_date} violates cutoff {as_of}"

def test_analogue_bias_direction_variety():
    # Verify catalogue contains both UNDERFORECAST and OVERFORECAST cases
    overforecasts = [item for item in HISTORICAL_ANALOGUE_CATALOG if item.get("bias_direction") == "OVERFORECAST"]
    underforecasts = [item for item in HISTORICAL_ANALOGUE_CATALOG if item.get("bias_direction") == "UNDERFORECAST"]
    assert len(overforecasts) >= 2, "Must include at least 2 overforecast / false-alarm cases"
    assert len(underforecasts) >= 4, "Must include underforecast cases"
