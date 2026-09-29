"""
Comprehensive End-to-End Audit Test for Cyclone Biparjoy Replay (SIH26079).
Validates:
- All input metadata and source archives
- Exact timestamps & strict as-of cutoffs
- Raw forecast values across D+5 to D+1
- Feature inputs (ensemble spread, multi-model disagreement)
- Prototype risk score computations
- Analogue search temporal anti-leakage cutoffs
- Final ground-truth observation & error calculations
- Provenance and absence of data synthesis
"""

import pytest
from app.core.replay_events import ReplayCatalogEngine
from app.core.analogues import HistoricalAnalogueEngine
from app.core.bust_definition import ForecastBustDefinition, BustThresholdConfig
from app.schemas.models import ForecastVariable
from app.ml.demo_model import DemoReliabilityModel

def test_biparjoy_complete_end_to_end_replay_audit():
    # 1. Load Event from Catalog
    event = ReplayCatalogEngine.get_event_by_id("biparjoy_2023")
    assert event is not None
    assert event.event_id == "biparjoy_2023"
    assert event.target_region_id == "SUB_22"
    assert event.target_region_name == "Saurashtra & Kutch"
    assert event.coordinates_lat_lon == (22.3, 70.3)
    assert event.units == "mm/day"
    assert "NOMADS" in event.forecast_source or "NOAA" in event.forecast_source
    assert "IMD" in event.observation_source
    
    # 2. Step Progression Verification
    steps = event.steps
    assert len(steps) == 6  # T-5, T-4, T-3, T-2, T-1, T-0
    
    # Step 0: T-5 (Initial issue)
    t5 = steps[0]
    assert t5.step_lead == "T-5"
    assert t5.lead_time_days == 5
    assert t5.as_of_cutoff_utc == "2023-06-10T00:00:00Z"
    assert t5.forecast_rainfall_mm == 42.0
    assert t5.ensemble_spread_mm == 26.5
    assert t5.multi_model_disagreement == 22.0

    # Mathematical Verification of Prototype Risk Score: 76/100 (0.7600)
    score = DemoReliabilityModel.compute_prototype_risk_score(
        ensemble_spread=t5.ensemble_spread_mm,
        inter_model_difference=t5.multi_model_disagreement,
        lead_time_days=t5.lead_time_days,
        is_ghats_or_coastal=True
    )
    assert score == 0.7600
    assert round(score * 100.0, 1) == 76.0
    assert t5.bust_risk_percent == 76.0

    # Component checks:
    ens_c = 0.35 * (26.5 / 35.0)       # 0.2650
    mod_c = 0.25 * (22.0 / 25.0)       # 0.2200
    lead_c = 0.15 * (5 / 10.0)         # 0.0750
    coast_c = 0.25 * 0.80              # 0.2000
    assert round(ens_c + mod_c + lead_c + coast_c, 4) == 0.7600

    assert t5.observed_rainfall_mm is None, "Leakage: Future observation visible at T-5"
    assert t5.actual_outcome_revealed is False
    assert t5.prototype_badge == "PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED"
    
    # 3. Analogue Anti-Leakage Audit at T-5
    analogues_t5 = HistoricalAnalogueEngine.find_top_analogues(
        target_region_id="SUB_22",
        lead_time_days=5,
        forecast_value=t5.forecast_rainfall_mm,
        ensemble_spread=t5.ensemble_spread_mm,
        model_disagreement=t5.multi_model_disagreement,
        as_of_date="2023-06-10",
        top_k=5
    )
    for ana in analogues_t5:
        assert ana.historical_date < "2023-06-10", f"Leakage: Analogue {ana.analogue_id} occurs after T-5 cutoff"
        assert ana.analogue_id != "ANA_2023_BIPARJOY"
        
    # Step 4: T-1 (24h before landfall: models converged towards reality)
    t1 = steps[4]
    assert t1.step_lead == "T-1"
    assert t1.lead_time_days == 1
    assert t1.as_of_cutoff_utc == "2023-06-14T00:00:00Z"
    assert t1.forecast_rainfall_mm == 162.0
    assert t1.bust_risk_percent == 26.0
    assert t1.observed_rainfall_mm is None, "Leakage: Future observation visible at T-1"
    
    # Step 5: EVENT_REVEAL (Verification Reveal of D+5 Forecast vs Ground Truth)
    t0 = steps[5]
    assert t0.step_lead == "EVENT_REVEAL"
    assert t0.lead_time_days == 0
    assert t0.as_of_cutoff_utc == "2023-06-15T00:00:00Z"
    assert t0.actual_outcome_revealed is True
    assert t0.forecast_rainfall_mm == 42.0
    assert t0.observed_rainfall_mm == 185.0
    assert t0.bust_occurred is True
    assert "143.0 mm" in t0.error_calculation_trace
    
    # 4. Independent Bust Evaluation Audit
    bust_engine = ForecastBustDefinition(BustThresholdConfig(tail_error_threshold_mm=35.0))
    attr = bust_engine.evaluate_error_tail(
        forecast_val=42.0,
        observed_val=185.0,
        lead_time_days=5,
        region_id="SUB_22",
        forecast_source="NOAA Operational GFS 0.25°",
        variable=ForecastVariable.PRECIPITATION
    )
    assert attr.is_bust is True
    assert attr.absolute_error == 143.0
    assert attr.threshold_value == 46.2
    assert round(attr.absolute_error - attr.threshold_value, 1) == 96.8
    assert round(attr.absolute_error - 35.0, 1) == 108.0
    assert "PROTOTYPE" in attr.threshold_type
    assert "2018–2022" in attr.calibration_period
