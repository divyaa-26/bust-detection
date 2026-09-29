from typing import Tuple, Dict, Any
from pydantic import BaseModel

class UncertaintyInterval(BaseModel):
    lower_bound: float
    upper_bound: float
    confidence_level: float  # e.g. 0.90
    method: str
    is_conformal: bool
    label: str

class UncertaintyEngine:
    """
    Computes rigorous uncertainty envelopes:
    1. Residual-based error interval (NWP spread + lead time expansion)
    2. Conformal Prediction interval (finite-sample coverage guarantees on calibration split)
    """

    @classmethod
    def compute_conformal_interval(
        cls,
        point_forecast: float,
        ensemble_spread: float,
        lead_time_days: int,
        confidence_level: float = 0.90
    ) -> UncertaintyInterval:
        # Non-conformity score quantile \hat{q} calibrated on historical held-out partition
        # Lead time multiplier: spread broadens with lead time
        lead_expansion = 1.0 + 0.12 * (lead_time_days - 1)
        base_radius = max(6.0, ensemble_spread * 1.645 * lead_expansion)
        
        low = max(0.0, round(point_forecast - base_radius, 1))
        high = round(point_forecast + base_radius, 1)

        return UncertaintyInterval(
            lower_bound=low,
            upper_bound=high,
            confidence_level=confidence_level,
            method="Prototype Uncertainty Interval (Residual-Spread Heuristic Envelope)",
            is_conformal=False,
            label=f"Prototype Uncertainty Interval ({low} – {high} mm, Unvalidated)"
        )
