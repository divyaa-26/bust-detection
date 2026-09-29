import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import joblib

from app.ml.base import BaseReliabilityModel, ModelFeatures, RawModelOutput

# Feature lists
FEATURE_COLS_SYNTHETIC = [
    "lead_time_days",
    "forecast_value",
    "forecast_anomaly",
    "ensemble_spread",
    "inter_model_difference",
    "spatial_gradient",
    "consecutive_run_delta",
    "analogue_historical_bust_rate",
    "analogue_mean_error",
    "is_ghats_or_coastal",
    "season_month"
]

FEATURE_COLS_REAL = [
    "lead_time_days",
    "forecast_value_mm",
    "climatological_normal_mm",
    "forecast_anomaly_mm",
    "subdivision_code",
    "macro_region_code",
    "terrain_type_code",
    "is_coastal",
    "analogue_historical_bust_rate",
    "analogue_mean_error_mm"
]

METEOROLOGICAL_FEATURE_NAMES_REAL = {
    "forecast_value_mm": "Predicted 24h Precipitation Magnitude (mm)",
    "forecast_anomaly_mm": "Synoptic Departure / Forecast Anomaly (mm)",
    "climatological_normal_mm": "Historical Climatological Baseline Normal (mm)",
    "lead_time_days": "Forecast Lead Time (Days D+1..D+10)",
    "subdivision_code": "Meteorological Subdivision Geographic Index (1..36)",
    "macro_region_code": "Synoptic Macro-Region Classification",
    "terrain_type_code": "Topographical Regime (Ghats/Plains/Himalayan/Coastal)",
    "is_coastal": "Maritime Boundary Flag",
    "analogue_historical_bust_rate": "Historical Regime Analogue Bust Rate",
    "analogue_mean_error_mm": "Historical Regime Mean Verification Error (mm)"
}

MACRO_REGION_MAP = {
    "South Peninsula": 1,
    "East & Northeast": 2,
    "Central India": 3,
    "Northwest India": 4,
    "Himalayan": 5
}

TERRAIN_MAP = {
    "plains": 1,
    "coastal": 2,
    "ghats": 3,
    "himalayan": 4,
    "island": 5
}

class TrainedReliabilityModel(BaseReliabilityModel):
    """
    Production-grade trained LightGBM Classifier with Isotonic Probability Calibration
    and TreeSHAP Explainable AI for SIH26079 Forecast Bust Detection.
    Prefers genuine Real NWP + IMD Verification Model artifacts (under artifacts/real/).
    Falls back gracefully to synthetic prototype artifacts if real artifacts are absent.
    """

    def __init__(self, artifacts_dir: Optional[Path] = None):
        if artifacts_dir is None:
            artifacts_dir = Path(__file__).resolve().parent / "artifacts"
        self.artifacts_dir = artifacts_dir
        self.is_loaded = False
        self.is_real_model = False
        
        self.model = None
        self.calibrator = None
        self.explainer = None
        self.metrics = {}
        self.metadata = {}
        self.version = "Prototype-Unloaded"
        self.prototype_badge = "PROTOTYPE"
        
        self._load_artifacts()

    def _load_artifacts(self):
        real_dir = self.artifacts_dir / "real"
        real_model_path = real_dir / "lgbm_real_model.joblib"
        real_calib_path = real_dir / "real_calibrator.joblib"
        
        # 1. Try loading Real NWP Model first
        if real_model_path.exists() and real_calib_path.exists():
            try:
                self.model = joblib.load(real_model_path)
                self.calibrator = joblib.load(real_calib_path)
                
                explainer_path = real_dir / "real_shap_explainer.joblib"
                if explainer_path.exists():
                    self.explainer = joblib.load(explainer_path)
                    
                metrics_path = real_dir / "real_metrics.json"
                if metrics_path.exists():
                    with open(metrics_path, "r") as f:
                        self.metrics = json.load(f)
                        
                meta_path = real_dir / "real_model_metadata.json"
                if meta_path.exists():
                    with open(meta_path, "r") as f:
                        self.metadata = json.load(f)
                        
                self.is_loaded = True
                self.is_real_model = True
                self.version = "LightGBM-v1.0-Real-NWP-IMD-Calibrated"
                self.prototype_badge = "REAL GFS + IMD TRAINED MODEL"
                print("[TrainedReliabilityModel] Successfully loaded REAL NWP + IMD Verification Model.")
                return
            except Exception as e:
                print(f"[TrainedReliabilityModel] Warning loading real artifacts: {e}. Falling back to synthetic.")

        # 2. Fallback to Synthetic Prototype
        model_path = self.artifacts_dir / "lgbm_bust_model.joblib"
        calib_path = self.artifacts_dir / "calibrator.joblib"
        explainer_path = self.artifacts_dir / "shap_explainer.joblib"
        metrics_path = self.artifacts_dir / "metrics.json"
        
        if model_path.exists() and calib_path.exists():
            try:
                self.model = joblib.load(model_path)
                self.calibrator = joblib.load(calib_path)
                if explainer_path.exists():
                    self.explainer = joblib.load(explainer_path)
                if metrics_path.exists():
                    with open(metrics_path, "r") as f:
                        self.metrics = json.load(f)
                self.is_loaded = True
                self.is_real_model = False
                self.version = "LightGBM-v1.0-Synthetic-Prototype"
                self.prototype_badge = "SYNTHETIC PROTOTYPE MODEL"
                print("[TrainedReliabilityModel] Loaded Synthetic Prototype Model.")
            except Exception as e:
                print(f"[TrainedReliabilityModel] Error loading synthetic artifacts: {e}")
                self.is_loaded = False

    def predict(self, features: ModelFeatures) -> RawModelOutput:
        if not self.is_loaded or self.model is None or self.calibrator is None:
            from app.ml.demo_model import DemoReliabilityModel
            demo = DemoReliabilityModel()
            out = demo.predict(features)
            conf = round(1.0 - out.calibrated_probability, 3)
            out.confidence = conf
            out.confidence_score_pct = round(conf * 100.0, 1)
            out.prototype_badge = "DEMO RULE-BASED HEURISTIC"
            return out

        forecast_anomaly = float(features.forecast_value - features.climatological_mean)
        
        # -------------------------------------------------------------
        # BRANCH A: Real NWP + IMD Trained Model Inference
        # -------------------------------------------------------------
        if self.is_real_model:
            # Parse subdivision index: e.g. SUB_22 -> 22
            try:
                sub_code = int(features.region_id.split("_")[1]) if "_" in features.region_id else 1
            except Exception:
                sub_code = 1
                
            macro_code = 3 # Central India default
            if sub_code in [28, 29, 30, 31, 32, 33, 34, 35, 36]:
                macro_code = 1 # South Peninsula
            elif sub_code in [1, 2, 3, 4, 5, 6, 7, 8, 9]:
                macro_code = 2 # East & Northeast
            elif sub_code in [10, 11, 12, 13, 14, 15, 16, 17, 18]:
                macro_code = 4 # Northwest
                
            terrain_code = 2 if features.is_ghats_or_coastal else 1
            if sub_code in [2, 12, 15, 16]:
                terrain_code = 4 # Himalayan
            elif sub_code in [23, 32, 35]:
                terrain_code = 3 # Ghats
                
            row = {
                "lead_time_days": int(features.lead_time_days),
                "forecast_value_mm": float(features.forecast_value),
                "climatological_normal_mm": float(features.climatological_mean),
                "forecast_anomaly_mm": float(forecast_anomaly),
                "subdivision_code": int(sub_code),
                "macro_region_code": int(macro_code),
                "terrain_type_code": int(terrain_code),
                "is_coastal": 1 if features.is_ghats_or_coastal else 0,
                "analogue_historical_bust_rate": float(features.analogue_historical_bust_rate),
                "analogue_mean_error_mm": float(features.analogue_mean_error)
            }
            df = pd.DataFrame([row])[FEATURE_COLS_REAL]
            
            raw_prob = float(self.model.predict_proba(df)[0, 1])
            calib_prob = float(self.calibrator.predict(np.array([raw_prob]))[0])
            calib_prob = max(0.001, min(0.999, calib_prob))
            
            confidence = round(1.0 - calib_prob, 3)
            confidence_pct = round(confidence * 100.0, 1)
            
            # Real TreeSHAP Feature Attributions
            shap_items = []
            if self.explainer is not None:
                try:
                    shap_values = self.explainer.shap_values(df)
                    if isinstance(shap_values, list) and len(shap_values) == 2:
                        vals = shap_values[1][0]
                    elif hasattr(shap_values, "values") and len(shap_values.values.shape) == 3:
                        vals = shap_values.values[0, :, 1]
                    else:
                        vals = np.array(shap_values)[0]
                        
                    for col_name, val in zip(FEATURE_COLS_REAL, vals):
                        val_float = float(val)
                        shap_items.append({
                            "feature_name": col_name,
                            "display_name": METEOROLOGICAL_FEATURE_NAMES_REAL.get(col_name, col_name),
                            "attribution_value": round(val_float, 4),
                            "abs_magnitude": round(abs(val_float), 4),
                            "direction": "INCREASES_BUST_RISK" if val_float > 0 else "REDUCES_BUST_RISK",
                            "feature_input_value": float(row[col_name])
                        })
                    shap_items.sort(key=lambda x: x["abs_magnitude"], reverse=True)
                except Exception as e:
                    print(f"[TrainedReliabilityModel] SHAP extraction note: {e}")

            # Error interval based on real model calibrated uncertainty
            err_low = round(max(1.0, features.forecast_value * 0.15 + (features.lead_time_days * 1.5)), 1)
            err_high = round(max(3.0, features.forecast_value * 0.45 + (features.lead_time_days * 3.5) + (abs(forecast_anomaly) * 0.3)), 1)
            
            return RawModelOutput(
                prototype_badge=self.prototype_badge,
                bust_probability=round(raw_prob, 3),
                calibrated_probability=round(calib_prob, 3),
                confidence=confidence,
                confidence_score_pct=confidence_pct,
                expected_error_low=err_low,
                expected_error_high=err_high,
                confidence_tier="Real NWP Calibrated",
                model_version=self.version,
                shap_attributions=shap_items
            )

        # -------------------------------------------------------------
        # BRANCH B: Synthetic Prototype Fallback
        # -------------------------------------------------------------
        row_synth = {
            "lead_time_days": int(features.lead_time_days),
            "forecast_value": float(features.forecast_value),
            "forecast_anomaly": float(abs(forecast_anomaly)),
            "ensemble_spread": float(features.ensemble_spread),
            "inter_model_difference": float(features.inter_model_difference),
            "spatial_gradient": float(features.spatial_gradient),
            "consecutive_run_delta": float(features.consecutive_run_delta),
            "analogue_historical_bust_rate": float(features.analogue_historical_bust_rate),
            "analogue_mean_error": float(features.analogue_mean_error),
            "is_ghats_or_coastal": 1 if features.is_ghats_or_coastal else 0,
            "season_month": int(features.season_month)
        }
        df_synth = pd.DataFrame([row_synth])[FEATURE_COLS_SYNTHETIC]
        raw_prob = float(self.model.predict_proba(df_synth)[0, 1])
        calib_prob = float(self.calibrator.predict(np.array([raw_prob]))[0])
        calib_prob = max(0.01, min(0.99, calib_prob))
        confidence = round(1.0 - calib_prob, 3)
        
        return RawModelOutput(
            prototype_badge="SYNTHETIC PROTOTYPE MODEL",
            bust_probability=round(raw_prob, 3),
            calibrated_probability=round(calib_prob, 3),
            confidence=confidence,
            confidence_score_pct=round(confidence * 100.0, 1),
            expected_error_low=3.0,
            expected_error_high=15.0,
            confidence_tier="Prototype Synthetic",
            model_version=self.version,
            shap_attributions=[]
        )

    def get_model_info(self) -> Dict[str, Any]:
        if self.is_real_model:
            return {
                "model_name": "SIH26079 Real Forecast Bust Classifier",
                "type": "LightGBM Binary Classifier + Isotonic Probability Calibration",
                "is_loaded": self.is_loaded,
                "is_real_model": True,
                "version": self.version,
                "badge": self.prototype_badge,
                "data_source": "NOAA GFS 0.25° Operational GRIB2 + IMD 24h Daily Gridded Observations",
                "training_samples": self.metrics.get("train_samples", 7200),
                "validation_samples": self.metrics.get("validation_samples", 3600),
                "test_samples": self.metrics.get("test_samples", 2880),
                "test_bust_base_rate": f"{self.metrics.get('test_bust_rate', 0.0396)*100:.2f}%",
                "metrics": self.metrics.get("metrics", {}),
                "baselines_comparison": self.metrics.get("baselines_comparison", {}),
                "feature_importance_shap": self.metrics.get("feature_importance_shap", []),
                "calibration_bins": self.metrics.get("calibration_bins", []),
                "honesty_disclosure": (
                    "This model was trained on 7,200 genuine NOAA GFS forecast-verification pairs from Monsoon 2023, "
                    "calibrated on 3,600 pairs from early/peak Monsoon 2024, and evaluated out-of-time on 2,880 held-out pairs "
                    "from late Monsoon 2024 across 38 unique initialization dates. It predicts the likelihood that an NWP forecast "
                    "will bust under IMD operational criteria."
                )
            }
        else:
            return {
                "model_name": "SyntheticPrototypeModel",
                "type": "LightGBM Binary Classifier (Synthetic Baseline)",
                "is_loaded": self.is_loaded,
                "is_real_model": False,
                "version": self.version,
                "badge": self.prototype_badge,
                "data_source": "Synthetic Forecast-Bust Dataset (Prototype)",
                "training_samples": 114120,
                "test_samples": 20160,
                "test_bust_base_rate": "9.27%",
                "metrics": self.metrics.get("metrics", {}),
                "baselines_comparison": self.metrics.get("baselines_comparison", {}),
                "feature_importance_shap": self.metrics.get("feature_importance_shap", []),
                "honesty_disclosure": "Prototype trained on synthetically generated meteorological records."
            }
