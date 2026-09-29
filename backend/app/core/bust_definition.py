from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.models import BustDefinitionType, BustAttribution, ForecastVariable

# IMD standard rainfall intensity categories (mm in 24 hours)
IMD_RAIN_CATEGORIES = [
    ("NO_RAIN", 0.0, 2.4, 0),
    ("LIGHT_RAIN", 2.5, 15.5, 1),
    ("MODERATE_RAIN", 15.6, 64.4, 2),
    ("HEAVY_RAIN", 64.5, 115.5, 3),
    ("VERY_HEAVY_RAIN", 115.6, 204.4, 4),
    ("EXTREMELY_HEAVY_RAIN", 204.5, 1000.0, 5)
]

def get_imd_category(rain_mm: float) -> tuple[str, int]:
    for cat_name, low, high, rank in IMD_RAIN_CATEGORIES:
        if low <= rain_mm <= high:
            return cat_name, rank
    return "EXTREMELY_HEAVY_RAIN", 5

class BustThresholdConfig(BaseModel):
    # Error-tail percentile threshold (e.g. 90th percentile of absolute error)
    tail_error_threshold_mm: float = 35.0
    tail_percentile: float = 0.90
    threshold_label: str = "PROTOTYPE TAIL-ERROR THRESHOLD (UNVALIDATED)"
    threshold_definition: str = "Absolute forecast error threshold |F - O| >= 35.0 mm/day"
    threshold_source: str = "Empirical ~90th percentile of absolute forecast error over baseline medium-range (D+5) monsoon reference period"
    calibration_period: str = "2018–2022 IMD Daily Gridded Rainfall Baseline (Prototype Reference)"
    # Category failure threshold: difference in IMD rainfall rank
    category_difference_threshold: int = 2
    # Temperature error threshold (°C)
    temperature_tail_threshold_c: float = 3.5

class ForecastBustDefinition:
    """
    Configurable Forecast Bust evaluation engine.
    Supports Definition A (Error-Tail) and Definition B (Category Failure).
    Never hardcodes one arbitrary rule permanently.
    """

    def __init__(self, config: Optional[BustThresholdConfig] = None):
        self.config = config or BustThresholdConfig()

    def evaluate_error_tail(
        self,
        forecast_val: float,
        observed_val: float,
        lead_time_days: int,
        region_id: str,
        forecast_source: str,
        variable: ForecastVariable = ForecastVariable.PRECIPITATION
    ) -> BustAttribution:
        """
        DEFINITION A:
        Forecast error exceeds the specified tail threshold (e.g. 90th percentile).
        """
        abs_err = abs(forecast_val - observed_val)
        threshold = (
            self.config.tail_error_threshold_mm 
            if variable == ForecastVariable.PRECIPITATION 
            else self.config.temperature_tail_threshold_c
        )
        
        # Scale threshold slightly with lead time as error distribution naturally broadens
        scaled_threshold = threshold * (1.0 + 0.08 * (lead_time_days - 1))
        norm_err = abs_err / max(1.0, observed_val if variable == ForecastVariable.PRECIPITATION else 10.0)
        is_bust = abs_err >= scaled_threshold

        explanation = (
            f"Absolute error of {abs_err:.1f} exceeds the {int(self.config.tail_percentile*100)}th "
            f"percentile prototype tail threshold of {scaled_threshold:.1f} mm/day (Lead D+{lead_time_days}; "
            f"Reference: {self.config.calibration_period})."
            if is_bust else
            f"Absolute error of {abs_err:.1f} is within acceptable envelope (< {scaled_threshold:.1f})."
        )

        return BustAttribution(
            definition_id=BustDefinitionType.ERROR_TAIL,
            threshold_value=round(scaled_threshold, 1),
            threshold_type=self.config.threshold_label,
            threshold_source=self.config.threshold_source,
            calibration_period=self.config.calibration_period,
            forecast_value=round(forecast_val, 1),
            observed_value=round(observed_val, 1),
            absolute_error=round(abs_err, 1),
            normalized_error=round(norm_err, 2),
            lead_time_days=lead_time_days,
            region_id=region_id,
            forecast_source=forecast_source,
            is_bust=is_bust,
            explanation=explanation
        )

    def evaluate_category_failure(
        self,
        forecast_val: float,
        observed_val: float,
        lead_time_days: int,
        region_id: str,
        forecast_source: str
    ) -> BustAttribution:
        """
        DEFINITION B:
        Forecast category materially differs from observed category by >= 2 IMD rainfall levels,
        or misses severe warning (forecast < Moderate while observed >= Very Heavy).
        """
        fcst_cat, fcst_rank = get_imd_category(forecast_val)
        obs_cat, obs_rank = get_imd_category(observed_val)
        rank_diff = abs(fcst_rank - obs_rank)
        
        is_bust = rank_diff >= self.config.category_difference_threshold
        # Missed extreme event is always a bust
        if fcst_rank <= 1 and obs_rank >= 3:
            is_bust = True

        abs_err = abs(forecast_val - observed_val)
        explanation = (
            f"Category Failure: Forecast predicted {fcst_cat} ({forecast_val:.1f}mm) "
            f"while observed was {obs_cat} ({observed_val:.1f}mm), rank difference = {rank_diff}."
            if is_bust else
            f"Category consistent: Forecast {fcst_cat} vs observed {obs_cat} (difference {rank_diff})."
        )

        return BustAttribution(
            definition_id=BustDefinitionType.CATEGORY_FAILURE,
            threshold_value=float(self.config.category_difference_threshold),
            forecast_value=round(forecast_val, 1),
            observed_value=round(observed_val, 1),
            absolute_error=round(abs_err, 1),
            normalized_error=round(abs_err / max(1.0, observed_val), 2),
            lead_time_days=lead_time_days,
            region_id=region_id,
            forecast_source=forecast_source,
            is_bust=is_bust,
            explanation=explanation
        )
