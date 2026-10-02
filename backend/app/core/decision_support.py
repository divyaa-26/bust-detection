from typing import List, Tuple
from app.schemas.models import (
    RiskLevel,
    OperationalPriority,
    DriverDetail,
    HistoricalAnalogue
)

class DecisionSupportEngine:
    """
    Translates bust risk probabilities, ensemble indicators, and multi-model disagreement
    into an actionable Forecaster Review Priority queue.
    
    IMPORTANT: This system is STRICTLY ADVISORY for operational meteorologists.
    It DOES NOT issue public weather warnings.
    """

    @classmethod
    def evaluate_priority(
        cls,
        bust_probability: float,
        lead_time_days: int,
        ensemble_spread: float,
        model_disagreement: float,
        forecast_value: float,
        analogues: List[HistoricalAnalogue],
        is_coastal_or_ghats: bool = False
    ) -> Tuple[OperationalPriority, RiskLevel, str, List[DriverDetail]]:
        drivers: List[DriverDetail] = []
        
        # 1. Ensemble Disagreement / Spread Check (Contextual rule; not a LightGBM model feature)
        spread_thresh = 15.0 + (lead_time_days * 1.5)
        if ensemble_spread >= spread_thresh:
            drivers.append(DriverDetail(
                driver_name="Ensemble Member Disagreement",
                severity="HIGH",
                metric_value=ensemble_spread,
                benchmark_value=spread_thresh,
                description=f"Ensemble member spread of {ensemble_spread:.1f} mm exceeds reference threshold ({spread_thresh:.1f} mm). Rule-based context indicator (not a LightGBM model feature)."
            ))
        elif ensemble_spread >= spread_thresh * 0.7:
            drivers.append(DriverDetail(
                driver_name="Ensemble Member Spread",
                severity="MODERATE",
                metric_value=ensemble_spread,
                benchmark_value=spread_thresh * 0.7,
                description=f"Ensemble spread of {ensemble_spread:.1f} mm exceeds moderate reference threshold ({spread_thresh * 0.7:.1f} mm). Rule-based context indicator (not a LightGBM model feature)."
            ))

        # 2. Multi-Model Disagreement (GFS vs AIFS) (Contextual rule; not a LightGBM model feature)
        if model_disagreement >= 12.0:
            drivers.append(DriverDetail(
                driver_name="Inter-Model Discrepancy (GFS vs AIFS)",
                severity="HIGH",
                metric_value=model_disagreement,
                benchmark_value=12.0,
                description=f"Model inter-comparison discrepancy between GFS and AIFS is {model_disagreement:.1f} mm, exceeding reference threshold (12.0 mm). Rule-based context indicator (not a LightGBM model feature)."
            ))

        # 3. Lead Time Degradation Factor
        lead_factor = min(1.0, (lead_time_days / 10.0))
        if lead_time_days >= 5:
            drivers.append(DriverDetail(
                driver_name="Medium-Range Lead Degradation",
                severity="HIGH" if lead_time_days >= 7 else "MODERATE",
                metric_value=float(lead_time_days),
                benchmark_value=5.0,
                description=f"Forecast lead time D+{lead_time_days} reaches or exceeds medium-range reference threshold (D+5). Rule-based context indicator."
            ))

        # 4. Historical Analogue Precedent
        busted_analogues = [a for a in analogues if a.was_bust]
        if analogues and len(busted_analogues) >= 2:
            drivers.append(DriverDetail(
                driver_name="Historical Precedent Association",
                severity="HIGH",
                metric_value=float(len(busted_analogues)),
                benchmark_value=1.0,
                description=f"Historical precedent: {len(busted_analogues)} of {len(analogues)} closest analogue atmospheric setups exhibited operational forecast busts."
            ))

        # 5. Spatial / Terrain Vulnerability
        if is_coastal_or_ghats and forecast_value >= 40.0:
            drivers.append(DriverDetail(
                driver_name="Orographic / Maritime Complex Boundary",
                severity="HIGH",
                metric_value=forecast_value,
                benchmark_value=40.0,
                description=f"Forecast precipitation ({forecast_value:.1f} mm) in coastal or Ghats terrain exceeds reference threshold (40.0 mm). Rule-based context indicator."
            ))

        # Risk Level & Operational Priority (Synchronized to Calibrated P(Bust) Meteorological Thresholds)
        # Climatological base rate P0 = 0.04 (4.0%)
        # < 8%    : Low Risk (< 2.0x base)          -> Priority: LOW
        # 8–14%   : Moderate Risk (2.0 - 3.5x base) -> Priority: MONITOR
        # 14–24%  : High Risk (3.5 - 6.0x base)     -> Priority: HIGH — REVIEW
        # >= 24%  : Severe Risk (>= 6.0x base)      -> Priority: CRITICAL — INSPECTION REQUIRED
        if bust_probability >= 0.24:
            risk_level = RiskLevel.SEVERE
            priority = OperationalPriority.CRITICAL_INSPECTION
            recommendation = (
                "IMMEDIATE FORECASTER ATTENTION: Compare physical soundings and satellite water-vapor loops; "
                "consider issuing ensemble-probabilistic cone instead of single-model deterministic threshold."
            )
        elif bust_probability >= 0.14:
            risk_level = RiskLevel.HIGH
            priority = OperationalPriority.HIGH_REVIEW
            recommendation = (
                "RECOMMEND REVIEW: High uncertainty at current lead time. Cross-verify multi-model consensus and local Doppler radar trends."
            )
        elif bust_probability >= 0.08:
            risk_level = RiskLevel.MODERATE
            priority = OperationalPriority.MONITOR
            recommendation = "MONITOR: Regular watch status. Maintain baseline verification on next 6-hourly cycle."
        else:
            risk_level = RiskLevel.LOW
            priority = OperationalPriority.LOW
            recommendation = "ROUTINE: High model consensus and stable synoptic pattern. Standard operational guidance."

        return priority, risk_level, recommendation, drivers
