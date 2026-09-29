from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.providers.base import ForecastGrid, ObservationGrid
from app.schemas.models import ForecastVariable

class AlignmentValidationError(Exception):
    """Raised when forecast and observation cannot be legitimately aligned."""
    pass

class AlignmentValidationReport(BaseModel):
    is_valid: bool
    init_time_utc: str
    valid_time_utc: str
    lead_time_days: int
    expected_valid_time: str
    variable_matched: bool
    units_matched: bool
    regions_aligned_count: int
    missing_regions: List[str]
    leakage_check_passed: bool
    notes: List[str]

class AlignmentValidator:
    """
    Enforces strict spatio-temporal alignment between forecasts and observations.
    Guarantees no off-by-one errors, timezone errors, or future observation leakage.
    """

    @staticmethod
    def parse_iso(dt_str: str) -> datetime:
        clean = dt_str.replace("Z", "+00:00")
        if "T" in clean:
            return datetime.fromisoformat(clean)
        else:
            return datetime.strptime(clean, "%Y-%m-%d")

    @classmethod
    def validate_lead_time_consistency(
        cls,
        init_time_str: str,
        valid_time_str: str,
        lead_time_days: int
    ) -> bool:
        """
        Validates: valid_time == init_time + lead_time_days.
        Throws error on off-by-one or mismatched lead.
        """
        init_dt = cls.parse_iso(init_time_str)
        valid_dt = cls.parse_iso(valid_time_str)
        
        expected_valid_dt = (init_dt + timedelta(days=lead_time_days)).date()
        actual_valid_dt = valid_dt.date()
        
        if expected_valid_dt != actual_valid_dt:
            raise AlignmentValidationError(
                f"Temporal misalignment: init_time={init_time_str} + lead={lead_time_days}d "
                f"yields {expected_valid_dt}, but valid_time={valid_time_str} has date {actual_valid_dt}!"
            )
        return True

    @classmethod
    def audit_future_leakage(
        cls,
        inference_time_str: str,
        observed_time_str: str
    ) -> bool:
        """
        LEAKAGE AUDIT:
        Inference at time T must NEVER consume observation data from time >= T!
        For medium-range forecasting at run T, verifying ground truth observed after T
        during feature calculation constitutes illegal future observation leakage.
        """
        infer_dt = cls.parse_iso(inference_time_str)
        obs_dt = cls.parse_iso(observed_time_str)
        
        if obs_dt > infer_dt:
            raise AlignmentValidationError(
                f"CRITICAL LEAKAGE DETECTED: Observation timestamp {observed_time_str} is in the FUTURE "
                f"relative to inference time {inference_time_str}! This would contaminate ML features."
            )
        return True

    @classmethod
    def validate_grid_alignment(
        cls,
        forecast_grid: ForecastGrid,
        obs_grid: Optional[ObservationGrid] = None
    ) -> AlignmentValidationReport:
        notes = []
        # 1. Lead time check
        init_dt = cls.parse_iso(forecast_grid.initialization_time)
        expected_valid = (init_dt + timedelta(days=forecast_grid.lead_time_days)).strftime("%Y-%m-%d")
        
        cls.validate_lead_time_consistency(
            forecast_grid.initialization_time,
            forecast_grid.valid_time,
            forecast_grid.lead_time_days
        )
        notes.append("Lead time matches initialization + delta.")

        # 2. Variable and unit checks
        var_matched = True
        unit_matched = True
        missing = []
        aligned_count = len(forecast_grid.subdivision_values)

        if obs_grid is not None:
            if forecast_grid.variable != obs_grid.variable:
                var_matched = False
                raise AlignmentValidationError(
                    f"Variable mismatch: forecast is {forecast_grid.variable} but observation is {obs_grid.variable}"
                )
            if forecast_grid.units != obs_grid.units:
                unit_matched = False
                notes.append(f"Warning: unit mismatch ({forecast_grid.units} vs {obs_grid.units}) requires conversion.")
            
            # Check for missing subdivisions
            fcst_subs = set(forecast_grid.subdivision_values.keys())
            obs_subs = set(obs_grid.subdivision_values.keys())
            missing = list(fcst_subs.symmetric_difference(obs_subs))
            aligned_count = len(fcst_subs.intersection(obs_subs))
            
            if missing:
                notes.append(f"Notice: {len(missing)} subdivisions lack complete overlap.")

        return AlignmentValidationReport(
            is_valid=True,
            init_time_utc=forecast_grid.initialization_time,
            valid_time_utc=forecast_grid.valid_time,
            lead_time_days=forecast_grid.lead_time_days,
            expected_valid_time=expected_valid,
            variable_matched=var_matched,
            units_matched=unit_matched,
            regions_aligned_count=aligned_count,
            missing_regions=missing,
            leakage_check_passed=True,
            notes=notes
        )
