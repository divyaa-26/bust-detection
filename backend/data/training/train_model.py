"""
LightGBM Training, Calibration, SHAP Attribution, and Baseline Benchmarking Pipeline
for SIH26079 Forecast Reliability Intelligence System.

Adheres to:
- Temporal train / validation / test blocking (Zero hindsight leakage).
- Probability Calibration (Isotonic Regression on held-out validation period).
- TreeSHAP feature attribution for explainable AI.
- Multi-baseline benchmarking: Climatology, Lead Decay, Ensemble Spread, and Demo Heuristic.
- Rigorous scoring: Brier Score, Brier Skill Score (BSS), ROC-AUC, PR-AUC, ECE.
"""

import json
import math
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import brier_score_loss, roc_auc_score, average_precision_score
from sklearn.isotonic import IsotonicRegression
import lightgbm as lgb
import shap

DATA_DIR = Path(__file__).resolve().parent
DATASET_PATH = DATA_DIR / "forecast_bust_dataset.csv"
ARTIFACTS_DIR = Path(__file__).resolve().parents[2] / "app" / "ml" / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = [
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

TARGET_COL = "bust_label"

def compute_ece(probs: np.ndarray, labels: np.ndarray, n_bins: int = 10) -> tuple[float, list[dict]]:
    """Computes Expected Calibration Error and binned calibration histogram."""
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    bin_details = []
    
    for i in range(n_bins):
        b_low, b_high = bins[i], bins[i+1]
        mask = (probs >= b_low) & (probs < b_high if i < n_bins - 1 else probs <= b_high)
        n_k = int(np.sum(mask))
        if n_k > 0:
            p_mean = float(np.mean(probs[mask]))
            o_mean = float(np.mean(labels[mask]))
            ece += (n_k / len(probs)) * abs(p_mean - o_mean)
            bin_details.append({
                "bin_index": i + 1,
                "bin_center": round((b_low + b_high) / 2.0, 2),
                "forecast_prob": round(p_mean, 3),
                "observed_frequency": round(o_mean, 3),
                "sample_count": n_k
            })
        else:
            bin_details.append({
                "bin_index": i + 1,
                "bin_center": round((b_low + b_high) / 2.0, 2),
                "forecast_prob": round((b_low + b_high) / 2.0, 3),
                "observed_frequency": 0.0,
                "sample_count": 0
            })
            
    return float(ece), bin_details

def compute_demo_heuristic_probabilities(df: pd.DataFrame) -> np.ndarray:
    """Computes the deterministic prototype heuristic score for baseline comparison."""
    ens_c = 0.35 * np.clip(df["ensemble_spread"].values / 35.0, 0.0, 1.0)
    mod_c = 0.25 * np.clip(df["inter_model_difference"].values / 25.0, 0.0, 1.0)
    lead_c = 0.15 * np.clip(df["lead_time_days"].values / 10.0, 0.0, 1.0)
    coast_c = 0.25 * np.where(df["is_ghats_or_coastal"].values == 1, 0.80, 0.20)
    raw = ens_c + mod_c + lead_c + coast_c
    # Sigmoid scaling
    scaled = 1.0 / (1.0 + np.exp(-6.0 * (raw - 0.45)))
    return np.clip(scaled, 0.02, 0.98)

def train_and_evaluate():
    print(f"Loading dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)
    
    train_df = df[df["partition"] == "TRAIN"].copy()
    val_df = df[df["partition"] == "VALIDATION"].copy()
    test_df = df[df["partition"] == "TEST"].copy()
    
    print(f"Train samples: {len(train_df)} (Bust rate: {train_df[TARGET_COL].mean():.2%})")
    print(f"Validation samples: {len(val_df)} (Bust rate: {val_df[TARGET_COL].mean():.2%})")
    print(f"Test samples: {len(test_df)} (Bust rate: {test_df[TARGET_COL].mean():.2%})")
    
    X_train, y_train = train_df[FEATURE_COLS], train_df[TARGET_COL]
    X_val, y_val = val_df[FEATURE_COLS], val_df[TARGET_COL]
    X_test, y_test = test_df[FEATURE_COLS], test_df[TARGET_COL]
    
    # 1. Train LightGBM Classifier
    print("\nTraining LightGBM Binary Classifier...")
    model = lgb.LGBMClassifier(
        objective="binary",
        n_estimators=150,
        learning_rate=0.05,
        num_leaves=31,
        min_child_samples=20,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=-1
    )
    model.fit(X_train, y_train)
    
    # 2. Probability Calibration on Validation Partition
    print("Fitting Isotonic Probability Calibrator on Validation split...")
    raw_val_probs = model.predict_proba(X_val)[:, 1]
    
    calibrator = IsotonicRegression(out_of_bounds="clip")
    calibrator.fit(raw_val_probs, y_val)
    
    # 3. Predictions on Untouched Test Partition
    print("Evaluating Model on Hold-Out Test Split...")
    raw_test_probs = model.predict_proba(X_test)[:, 1]
    calibrated_test_probs = np.clip(calibrator.predict(raw_test_probs), 0.01, 0.99)
    
    # 4. Evaluate Standard Baselines on Test Partition
    # Baseline 1: Climatology (Constant base rate of training partition)
    climo_rate = float(y_train.mean())
    b1_climo_probs = np.full(len(y_test), climo_rate)
    
    # Baseline 2: Lead Decay (Atmospheric error growth penalty)
    b2_decay_probs = np.clip(1.0 - (1.0 / (1.0 + 0.08 * X_test["lead_time_days"].values)), 0.05, 0.85)
    
    # Baseline 3: Ensemble Spread Heuristic
    b3_spread_probs = np.clip(X_test["ensemble_spread"].values / 35.0, 0.02, 0.95)
    
    # Baseline 4: Demo Heuristic Model (Existing deterministic prototype formula)
    b4_demo_probs = compute_demo_heuristic_probabilities(test_df)
    
    # Calculate Brier Scores
    bs_climo = brier_score_loss(y_test, b1_climo_probs)
    bs_decay = brier_score_loss(y_test, b2_decay_probs)
    bs_spread = brier_score_loss(y_test, b3_spread_probs)
    bs_demo = brier_score_loss(y_test, b4_demo_probs)
    bs_raw_lgbm = brier_score_loss(y_test, raw_test_probs)
    bs_calibrated_lgbm = brier_score_loss(y_test, calibrated_test_probs)
    
    # Brier Skill Score (BSS) relative to Climatology: BSS = 1 - (BS_model / BS_climo)
    bss_lgbm = 1.0 - (bs_calibrated_lgbm / bs_climo)
    bss_demo = 1.0 - (bs_demo / bs_climo)
    
    # Discrimination Metrics
    auc_lgbm = roc_auc_score(y_test, calibrated_test_probs)
    prauc_lgbm = average_precision_score(y_test, calibrated_test_probs)
    auc_demo = roc_auc_score(y_test, b4_demo_probs)
    
    # Expected Calibration Error (ECE)
    ece_lgbm, calib_bins = compute_ece(calibrated_test_probs, y_test.values, n_bins=10)
    ece_demo, _ = compute_ece(b4_demo_probs, y_test.values, n_bins=10)
    
    print("\n" + "="*70)
    print("                 FINAL EVALUATION BENCHMARK ON TEST DATA")
    print("="*70)
    print(f"Baseline 1 (Climatology):           Brier Score = {bs_climo:.4f}")
    print(f"Baseline 2 (Lead Decay):            Brier Score = {bs_decay:.4f}")
    print(f"Baseline 3 (Ensemble Spread):       Brier Score = {bs_spread:.4f}")
    print(f"Baseline 4 (Demo Heuristic Model):  Brier Score = {bs_demo:.4f} | BSS = {bss_demo:.3f} | ROC-AUC = {auc_demo:.3f} | ECE = {ece_demo:.4f}")
    print(f"Trained LightGBM (Raw):             Brier Score = {bs_raw_lgbm:.4f}")
    print(f"Trained LightGBM (Calibrated):      Brier Score = {bs_calibrated_lgbm:.4f} | BSS = {bss_lgbm:.3f} | ROC-AUC = {auc_lgbm:.3f} | PR-AUC = {prauc_lgbm:.3f} | ECE = {ece_lgbm:.4f}")
    print("="*70)
    
    # 5. TreeSHAP Explainer
    print("\nFitting TreeSHAP Explainer for Explainable AI...")
    explainer = shap.TreeExplainer(model)
    # Verify explainer on a small test slice
    shap_vals = explainer.shap_values(X_test.iloc[:50])
    # For binary classification, lightgbm tree explainer might return a single array or list of 2
    if isinstance(shap_vals, list):
        shap_vals_arr = shap_vals[1]
    else:
        shap_vals_arr = shap_vals
        
    global_importance = np.abs(shap_vals_arr).mean(axis=0)
    feature_importance = [
        {"feature": col, "mean_abs_shap": round(float(imp), 4)}
        for col, imp in sorted(zip(FEATURE_COLS, global_importance), key=lambda x: x[1], reverse=True)
    ]
    print(f"Top 5 SHAP Features: {[f['feature'] for f in feature_importance[:5]]}")
    
    # 6. Save Model Artifacts
    print(f"\nSaving model artifacts to {ARTIFACTS_DIR}...")
    joblib.dump(model, ARTIFACTS_DIR / "lgbm_bust_model.joblib")
    joblib.dump(calibrator, ARTIFACTS_DIR / "calibrator.joblib")
    joblib.dump(explainer, ARTIFACTS_DIR / "shap_explainer.joblib")
    
    metrics_payload = {
        "model_type": "LightGBM + Isotonic Calibration",
        "training_partition": "2018-01-01 to 2022-12-31",
        "validation_partition": "2023-01-01 to 2023-05-31",
        "test_partition": "2023-06-01 to 2024-03-31",
        "test_samples_count": len(test_df),
        "test_bust_base_rate": round(float(y_test.mean()), 4),
        "metrics": {
            "brier_score": round(float(bs_calibrated_lgbm), 4),
            "brier_skill_score_vs_climatology": round(float(bss_lgbm), 4),
            "roc_auc": round(float(auc_lgbm), 4),
            "pr_auc": round(float(prauc_lgbm), 4),
            "expected_calibration_error": round(float(ece_lgbm), 4)
        },
        "baselines_comparison": {
            "climatology_brier_score": round(float(bs_climo), 4),
            "lead_decay_brier_score": round(float(bs_decay), 4),
            "ensemble_spread_brier_score": round(float(bs_spread), 4),
            "demo_heuristic_brier_score": round(float(bs_demo), 4),
            "demo_heuristic_roc_auc": round(float(auc_demo), 4)
        },
        "feature_importance_shap": feature_importance,
        "calibration_bins": calib_bins
    }
    
    with open(ARTIFACTS_DIR / "metrics.json", "w") as f:
        json.dump(metrics_payload, f, indent=2)
        
    with open(ARTIFACTS_DIR / "feature_schema.json", "w") as f:
        json.dump({
            "features": FEATURE_COLS,
            "target": TARGET_COL,
            "target_description": "Forecast Bust Event indicator (1 if |F - O| >= threshold or category shift >= 2 else 0)"
        }, f, indent=2)
        
    print("Model training, calibration, and artifact generation COMPLETE!")

if __name__ == "__main__":
    train_and_evaluate()
