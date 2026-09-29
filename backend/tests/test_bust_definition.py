import pytest
from app.core.bust_definition import ForecastBustDefinition, BustThresholdConfig
from app.schemas.models import BustDefinitionType, ForecastVariable

def test_error_tail_bust_triggered():
    evaluator = ForecastBustDefinition(BustThresholdConfig(tail_error_threshold_mm=35.0))
    # Forecast = 15.0 mm, Observed = 75.0 mm (abs error = 60.0 mm > threshold 35.0 mm)
    res = evaluator.evaluate_error_tail(
        forecast_val=15.0,
        observed_val=75.0,
        lead_time_days=5,
        region_id="SUB_22",
        forecast_source="GFS"
    )
    assert res.is_bust is True
    assert res.definition_id == BustDefinitionType.ERROR_TAIL
    assert res.absolute_error == 60.0

def test_error_tail_non_bust():
    evaluator = ForecastBustDefinition(BustThresholdConfig(tail_error_threshold_mm=35.0))
    # Forecast = 22.0 mm, Observed = 28.0 mm (abs error = 6.0 mm < threshold)
    res = evaluator.evaluate_error_tail(
        forecast_val=22.0,
        observed_val=28.0,
        lead_time_days=3,
        region_id="SUB_20",
        forecast_source="GFS"
    )
    assert res.is_bust is False
    assert res.absolute_error == 6.0

def test_category_failure_bust():
    evaluator = ForecastBustDefinition()
    # Predicted Light Rain (10mm) vs Observed Extremely Heavy Rain (220mm)
    res = evaluator.evaluate_category_failure(
        forecast_val=10.0,
        observed_val=220.0,
        lead_time_days=4,
        region_id="SUB_23",
        forecast_source="GFS"
    )
    assert res.is_bust is True
    assert res.definition_id == BustDefinitionType.CATEGORY_FAILURE
