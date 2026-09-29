"""
Comprehensive Forensic Audit for Expanded Real NWP Dataset (13,680 Rows).
Verifies all Phase 9 requirements, temporal splits, and empirical bust statistics.
"""

import pandas as pd
import numpy as np
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parent / "expanded_real_nwp_dataset.csv"

def run_expanded_audit():
    df = pd.read_csv(CSV_PATH)
    
    total_rows = len(df)
    unique_inits = sorted(df["init_date"].unique().tolist())
    earliest_init = min(unique_inits)
    latest_init = max(unique_inits)
    
    expected_rows = len(unique_inits) * 36 * 10
    missing_rows = expected_rows - total_rows
    duplicate_rows = df.duplicated(subset=["init_date", "region_id", "lead_time_days"]).sum()
    
    missing_fcst = df["forecast_value_mm"].isna().sum()
    missing_obs = df["observed_value_mm"].isna().sum()
    
    total_busts = int(df["bust_label"].sum())
    overall_bust_rate = df["bust_label"].mean()
    
    # Lead breakdown
    bust_by_lead = df.groupby("lead_time_days")["bust_label"].agg(["count", "sum", "mean"])
    
    # Region breakdown
    bust_by_region = df.groupby(["region_id", "region_name"])["bust_label"].agg(["count", "sum", "mean"]).sort_values("mean", ascending=False)
    
    # Monthly breakdown (extracting month from init_date)
    df["init_month"] = df["init_date"].str[:7]
    bust_by_month = df.groupby("init_month")["bust_label"].agg(["count", "sum", "mean"])
    
    # Temporal Split breakdown
    split_stats = df.groupby("split_partition")["bust_label"].agg(["count", "sum", "mean"])
    
    print("="*90)
    print("PHASE 9: EXPANDED REAL NWP VERIFICATION DATASET AUDIT (13,680 ROWS)")
    print("="*90)
    print(f"A. Unique Initialization Dates:    {len(unique_inits)} dates")
    print(f"   Earliest Date:                  {earliest_init}")
    print(f"   Latest Date:                    {latest_init}")
    print(f"B. Total Real Rows:                {total_rows}")
    print(f"   Expected Rows:                  {expected_rows} (38 dates x 36 subdivisions x 10 leads)")
    print(f"   Missing Rows:                   {missing_rows}")
    print(f"   Duplicate Rows:                 {duplicate_rows}")
    print(f"   Missing Forecast Values:        {missing_fcst}")
    print(f"   Missing Observations:           {missing_obs}")
    print(f"C. Total Real Busts:               {total_busts}")
    print(f"D. Overall Empirical Bust Rate:    {overall_bust_rate*100:.2f}% ({total_busts} / {total_rows})")
    
    print("\n" + "="*90)
    print("E. BUST RATE BY LEAD TIME (D1 to D10)")
    print("="*90)
    print(f"{'Lead':<6} {'Total Rows':<12} {'Real Busts':<12} {'Bust Rate':<10}")
    print("-" * 42)
    for lead, row in bust_by_lead.iterrows():
        print(f"D+{lead:<4} {int(row['count']):<12} {int(row['sum']):<12} {row['mean']*100:.2f}%")
        
    print("\n" + "="*90)
    print("F. TEMPORAL TRAIN / VALIDATION / TEST SPLIT BREAKDOWN")
    print("="*90)
    print(f"{'Partition':<14} {'Date Range':<26} {'Dates':<7} {'Total Rows':<12} {'Busts':<8} {'Bust Rate'}")
    print("-" * 80)
    splits_info = [
        ("TRAIN", "2023-06-05 to 2023-09-25", 20),
        ("VALIDATION", "2024-06-05 to 2024-07-25", 10),
        ("TEST", "2024-08-05 to 2024-09-15", 8)
    ]
    for split_name, drange, n_dates in splits_info:
        sub_df = df[df["split_partition"] == split_name]
        cnt = len(sub_df)
        bst = int(sub_df["bust_label"].sum())
        rt = sub_df["bust_label"].mean()
        print(f"{split_name:<14} {drange:<26} {n_dates:<7} {cnt:<12} {bst:<8} {rt*100:.2f}%")
        
    print("\n" + "="*90)
    print("G. MONTHLY / SEASONAL BREAKDOWN (Initialization Month)")
    print("="*90)
    print(f"{'Month':<10} {'Dates Count':<14} {'Total Rows':<12} {'Real Busts':<12} {'Bust Rate'}")
    print("-" * 60)
    for month, row in bust_by_month.iterrows():
        n_dates = len(df[df["init_month"] == month]["init_date"].unique())
        print(f"{month:<10} {n_dates:<14} {int(row['count']):<12} {int(row['sum']):<12} {row['mean']*100:.2f}%")
        
    print("\n" + "="*90)
    print("H. TOP 10 HIGHEST BUST RATE SUBDIVISIONS")
    print("="*90)
    print(f"{'Sub ID':<8} {'Name':<36} {'Rows':<8} {'Busts':<8} {'Bust Rate'}")
    print("-" * 70)
    for (sid, name), row in bust_by_region.head(10).iterrows():
        print(f"{sid:<8} {name:<36} {int(row['count']):<8} {int(row['sum']):<8} {row['mean']*100:.2f}%")
        
    print("\n" + "="*90)
    print("I. TOP 5 LOWEST BUST RATE SUBDIVISIONS")
    print("="*90)
    print(f"{'Sub ID':<8} {'Name':<36} {'Rows':<8} {'Busts':<8} {'Bust Rate'}")
    print("-" * 70)
    for (sid, name), row in bust_by_region.tail(5).iterrows():
        print(f"{sid:<8} {name:<36} {int(row['count']):<8} {int(row['sum']):<8} {row['mean']*100:.2f}%")

if __name__ == "__main__":
    run_expanded_audit()
