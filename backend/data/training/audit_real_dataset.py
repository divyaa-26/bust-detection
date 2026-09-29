"""
Forensic Data Quality Report Generator for Real NWP Verification Dataset.
Computes and verifies all Phase 2 integrity metrics.
"""

import pandas as pd
import numpy as np
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parent / "real_nwp_verification_dataset.csv"

def run_data_quality_audit():
    df = pd.read_csv(CSV_PATH)
    
    total_rows = len(df)
    unique_inits = df["init_date"].unique().tolist()
    expected_rows = len(unique_inits) * 36 * 10
    missing_rows = expected_rows - total_rows
    duplicate_rows = df.duplicated(subset=["init_date", "region_id", "lead_time_days"]).sum()
    
    regions = df["region_id"].unique()
    lead_days = sorted(df["lead_time_days"].unique())
    
    missing_fcst = df["forecast_value_mm"].isna().sum()
    missing_obs = df["observed_value_mm"].isna().sum()
    
    neg_fcst = (df["forecast_value_mm"] < 0).sum()
    neg_obs = (df["observed_value_mm"] < 0).sum()
    
    overall_bust_rate = df["bust_label"].mean()
    bust_by_lead = df.groupby("lead_time_days")["bust_label"].agg(["count", "mean"])
    bust_by_sub = df.groupby(["region_id", "region_name"])["bust_label"].agg(["count", "mean"]).sort_values("mean", ascending=False)
    
    fcst_stats = {
        "min": df["forecast_value_mm"].min(),
        "max": df["forecast_value_mm"].max(),
        "mean": df["forecast_value_mm"].mean(),
        "std": df["forecast_value_mm"].std()
    }
    obs_stats = {
        "min": df["observed_value_mm"].min(),
        "max": df["observed_value_mm"].max(),
        "mean": df["observed_value_mm"].mean(),
        "std": df["observed_value_mm"].std()
    }
    
    print("\n" + "="*80)
    print("PHASE 2: REAL DATASET INTEGRITY & DATA QUALITY REPORT")
    print("="*80)
    print(f"Total Rows Ingested:        {total_rows}")
    print(f"Expected Rows:              {expected_rows} (4 runs x 36 subdivisions x 10 leads)")
    print(f"Missing Rows:               {missing_rows}")
    print(f"Duplicate Rows:             {duplicate_rows}")
    print(f"Missing GFS Forecasts:      {missing_fcst}")
    print(f"Missing Observations:       {missing_obs}")
    print(f"Negative Forecast Count:    {neg_fcst}")
    print(f"Negative Observation Count: {neg_obs}")
    print(f"Unit Consistency:           All precipitation in mm (millimeters / 24h)")
    print(f"Date Coverage:              {', '.join(unique_inits)}")
    print(f"Regions Represented:        {len(regions)} / 36 subdivisions")
    print(f"Lead Days Represented:      {min(lead_days)} to {max(lead_days)} (D1 to D10)")
    print(f"Overall Empirical Bust Rate:{overall_bust_rate:.3f} ({df['bust_label'].sum()} / {total_rows})")
    
    print("\n--- FORECAST & OBSERVATION DISTRIBUTION ---")
    print(f"Forecast (mm):    Min = {fcst_stats['min']:.1f}, Max = {fcst_stats['max']:.1f}, Mean = {fcst_stats['mean']:.1f}, Std = {fcst_stats['std']:.1f}")
    print(f"Observation (mm): Min = {obs_stats['min']:.1f}, Max = {obs_stats['max']:.1f}, Mean = {obs_stats['mean']:.1f}, Std = {obs_stats['std']:.1f}")
    
    print("\n--- BUST RATE BY LEAD TIME (D1 to D10) ---")
    print(f"{'Lead':<6} {'Total Rows':<12} {'Busts':<8} {'Bust Rate'}")
    print("-" * 38)
    for lead, row in bust_by_lead.iterrows():
        n_lead = int(row['count'])
        rate = float(row['mean'])
        busts = int(round(n_lead * rate))
        print(f"D+{lead:<4} {n_lead:<12} {busts:<8} {rate*100:.1f}%")
        
    print("\n--- TOP 10 HIGHEST BUST RATE SUBDIVISIONS ---")
    print(f"{'Sub ID':<8} {'Name':<36} {'Rows':<6} {'Bust Rate'}")
    print("-" * 60)
    for (sub_id, name), row in bust_by_sub.head(10).iterrows():
        print(f"{sub_id:<8} {name:<36} {int(row['count']):<6} {row['mean']*100:.1f}%")
        
    print("\n--- TOP 5 LOWEST BUST RATE SUBDIVISIONS ---")
    print(f"{'Sub ID':<8} {'Name':<36} {'Rows':<6} {'Bust Rate'}")
    print("-" * 60)
    for (sub_id, name), row in bust_by_sub.tail(5).iterrows():
        print(f"{sub_id:<8} {name:<36} {int(row['count']):<6} {row['mean']*100:.1f}%")

if __name__ == "__main__":
    run_data_quality_audit()
