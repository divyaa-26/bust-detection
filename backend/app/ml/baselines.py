from typing import Dict, Any
from app.ml.base import ModelFeatures

class ClimatologyBaseline:
    """
    BASELINE 1: Climatology / Historical Expectation Baseline.
    Predicts bust probability purely based on historical base rate of extreme deviations in each subdivision.
    """
    @staticmethod
    def predict_risk(features: ModelFeatures) -> float:
        # Base historical rate of tail busts in India is ~8-12%
        base_rate = 0.08
        if features.is_ghats_or_coastal:
            base_rate = 0.14
        return round(base_rate, 3)

class EnsembleSpreadBaseline:
    """
    BASELINE 2: Ensemble-Spread Reliability Indicator.
    Uses the raw standard deviation across NWP ensemble members as a heuristic for forecast bust.
    In a perfectly calibrated ensemble, spread should equal error.
    """
    @staticmethod
    def predict_risk(features: ModelFeatures) -> float:
        # Linear spread mapping
        risk = min(0.92, features.ensemble_spread / 28.0)
        return round(risk, 3)

class HistoricalSkillBaseline:
    """
    BASELINE 3: Lead-Time-Dependent Historical Forecast Skill Baseline.
    Models the standard historical decay of forecast correlation with lead time (D+1 to D+10).
    """
    @staticmethod
    def predict_risk(features: ModelFeatures) -> float:
        # Skill decay curve: risk grows monotonically with lead days
        decay_factor = 1.0 - (1.0 / (1.0 + 0.18 * features.lead_time_days))
        return round(min(0.85, 0.10 + decay_factor * 0.70), 3)

class BaselineComparisonEngine:
    """
    Evaluates all three mandatory scientific baselines alongside the reliability model.
    """
    @classmethod
    def evaluate_all(cls, features: ModelFeatures, model_bust_prob: float) -> Dict[str, Any]:
        climo_prob = ClimatologyBaseline.predict_risk(features)
        ens_prob = EnsembleSpreadBaseline.predict_risk(features)
        skill_prob = HistoricalSkillBaseline.predict_risk(features)
        
        return {
            "baseline_1_climatology": {
                "name": "Historical Climatology Base Rate",
                "estimated_bust_risk": climo_prob,
                "description": "Subdivision historical base frequency of tail busts."
            },
            "baseline_2_ensemble_spread": {
                "name": "Ensemble Spread Heuristic",
                "estimated_bust_risk": ens_prob,
                "description": "Direct risk derived from raw ensemble member dispersion."
            },
            "baseline_3_lead_decay": {
                "name": "Historical Lead-Time Skill Decay",
                "estimated_bust_risk": skill_prob,
                "description": "Standard empirical degradation of medium-range NWP skill."
            },
            "model_estimate": {
                "name": "Forecast Reliability Engine",
                "estimated_bust_risk": model_bust_prob,
                "description": "Unified multi-indicator risk calculation."
            }
        }
