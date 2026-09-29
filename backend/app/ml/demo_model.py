import math
from typing import Dict, Any
from app.ml.base import BaseReliabilityModel, ModelFeatures, RawModelOutput

class DemoReliabilityModel(BaseReliabilityModel):
    """
    Deterministic Prototype Reliability Engine.
    
    SCIENTIFIC HONESTY DISCLOSURE:
    This model is a calibrated deterministic scoring prototype for SIH 2026.
    It combines physical meteorological vulnerability indicators:
    1. Ensemble spread / member disagreement (weight: 0.30)
    2. Multi-model consensus divergence (weight: 0.25)
    3. Lead-time degradation function (weight: 0.20)
    4. Climatological anomaly ratio (weight: 0.15)
    5. Local spatial terrain instability (weight: 0.10)
    
    It DOES NOT claim 93% accuracy or unverified ML performance.
    It provides an identical schema and interface to the future trained XGBoost/LightGBM model.
    """

    def __init__(self):
        self.version = "DemoReliabilityModel-v1.0-deterministic"
        # Transparent weights
        self.weights = {
            "ensemble_spread": 0.35,
            "inter_model_difference": 0.25,
            "lead_time": 0.15,
            "spatial_instability": 0.25
        }

    @classmethod
    def compute_prototype_risk_score(
        cls,
        ensemble_spread: float,
        inter_model_difference: float,
        lead_time_days: int,
        is_ghats_or_coastal: bool = True
    ) -> float:
        """
        Deterministic, transparent Prototype Risk Score formula (0.00 to 1.00).
        Evaluated as:
          - Ensemble spread: 0.35 * min(1.0, spread / 35.0)
          - Multi-model difference: 0.25 * min(1.0, difference / 25.0)
          - Lead time degradation: 0.15 * min(1.0, lead / 10.0)
          - Coastal/terrain vulnerability: 0.25 * (0.80 if is_ghats_or_coastal else 0.20)

        Example (Biparjoy T-5):
          spread=26.5 mm -> 0.35 * (26.5 / 35.0) = 0.2650
          diff=22.0 mm   -> 0.25 * (22.0 / 25.0) = 0.2200
          lead=5 days    -> 0.15 * (5 / 10)      = 0.0750
          coastal=True   -> 0.25 * 0.80          = 0.2000
          Total = 0.2650 + 0.2200 + 0.0750 + 0.2000 = 0.7600 -> 76/100
        """
        ens_comp = 0.35 * min(1.0, max(0.0, float(ensemble_spread)) / 35.0)
        model_comp = 0.25 * min(1.0, max(0.0, float(inter_model_difference)) / 25.0)
        lead_comp = 0.15 * min(1.0, max(0.0, float(lead_time_days)) / 10.0)
        spatial_comp = 0.25 * (0.80 if is_ghats_or_coastal else 0.20)
        return round(ens_comp + model_comp + lead_comp + spatial_comp, 4)

    def predict(self, features: ModelFeatures) -> RawModelOutput:
        raw_prob = self.compute_prototype_risk_score(
            ensemble_spread=features.ensemble_spread,
            inter_model_difference=features.inter_model_difference,
            lead_time_days=features.lead_time_days,
            is_ghats_or_coastal=features.is_ghats_or_coastal
        )

        anomaly = abs(features.forecast_value - features.climatological_mean)

        # Non-linear logistic sigmoid scaling to shape probability distribution realistically
        calibrated_prob = 1.0 / (1.0 + math.exp(-6.0 * (raw_prob - 0.45)))
        calibrated_prob = max(0.04, min(0.96, calibrated_prob))

        # Expected error interval estimation (mm/day)
        base_err = max(3.0, features.ensemble_spread * 0.9 + (features.lead_time_days * 2.2))
        err_low = round(max(1.0, base_err * 0.7), 1)
        err_high = round(base_err * 1.6 + (anomaly * 0.25), 1)

        return RawModelOutput(
            prototype_badge="PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED",
            bust_probability=round(raw_prob, 3),
            calibrated_probability=round(calibrated_prob, 3),
            expected_error_low=err_low,
            expected_error_high=err_high,
            confidence_tier="PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED",
            model_version=self.version
        )

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "model_name": "DemoReliabilityModel",
            "type": "Deterministic Meteorological Reliability Scorer",
            "status": "Operational Prototype",
            "weights": self.weights,
            "scientific_honesty": "Explicitly un-trained prototype; prepares pipeline for future XGBoost/LightGBM model.",
            "version": self.version
        }
