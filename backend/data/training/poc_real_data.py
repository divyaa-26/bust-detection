import eccodes
import httpx
import numpy as np
from datetime import datetime, timedelta
from app.core.bust_definition import ForecastBustDefinition, BustThresholdConfig
from app.schemas.models import ForecastVariable

# 1. Configuration
INIT_DATE_STR = "2024-07-15"
INIT_CYCLE = "00"
REGIONS = [
    {"id": "SUB_22", "name": "Saurashtra & Kutch", "lat": 22.3, "lon": 70.3},
    {"id": "SUB_23", "name": "Konkan & Goa", "lat": 18.5, "lon": 73.2},
    {"id": "SUB_20", "name": "East Madhya Pradesh", "lat": 23.5, "lon": 80.5}
]

# 2. Observed Rainfall (from Historical Verification Archive)
OBSERVED_DAILY = {
    "SUB_22": [44.4, 2.9, 26.6, 18.4, 6.0, 82.6, 39.0, 16.1, 14.2, 0.8],
    "SUB_23": [9.6, 28.8, 36.1, 39.9, 67.2, 32.5, 40.9, 37.3, 43.0, 67.6],
    "SUB_20": [1.0, 4.2, 2.8, 10.3, 11.1, 4.3, 18.4, 44.0, 46.5, 23.1]
}

# 3. Download and Decode Real NOAA GFS Forecast for D1..D10 (03Z Aligned for IMD Verification)
# IMD daily observation for date D represents: (D-1) 03:00 UTC -> D 03:00 UTC (08:30 IST)
# Therefore, GFS initialized at 00 UTC requires steps:
#   f003: init + 3h (D-0 03:00 UTC)
#   f027: init + 27h (D-1 03:00 UTC) -> D1 interval = f027 - f003
#   f051: init + 51h (D-2 03:00 UTC) -> D2 interval = f051 - f027
#   ... up to f243: init + 243h (D-10 03:00 UTC) -> D10 interval = f243 - f219
base_s3 = f"https://noaa-gfs-bdp-pds.s3.amazonaws.com/gfs.{INIT_DATE_STR.replace('-', '')}/{INIT_CYCLE}/atmos"
steps_03z = [3] + [24 * d + 3 for d in range(1, 11)]  # [3, 27, 51, 75, 99, 123, 147, 171, 195, 219, 243]

cum_03z = {r["id"]: [] for r in REGIONS}

print(f"Downloading real NOAA GFS 0.25° run {INIT_DATE_STR} {INIT_CYCLE}Z across 03Z-aligned leads f003 to f243...")

with httpx.Client(timeout=30.0) as client:
    for s in steps_03z:
        f_str = f"f{s:03d}"
        idx_url = f"{base_s3}/gfs.t{INIT_CYCLE}z.pgrb2.0p25.{f_str}.idx"
        grib_url = f"{base_s3}/gfs.t{INIT_CYCLE}z.pgrb2.0p25.{f_str}"
        
        # Fetch idx
        r_idx = client.get(idx_url)
        lines = r_idx.text.strip().split("\n")
        
        # Look for cumulative precipitation: "APCP:surface:0-s hour acc fcst"
        target_str = f"APCP:surface:0-{s} hour acc fcst"
        target_line = None
        for i, line in enumerate(lines):
            if target_str in line:
                target_line = line
                next_line = lines[i+1]
                break
                
        if not target_line:
            raise ValueError(f"Target {target_str} not found in {f_str}.idx")

        start_byte = int(target_line.split(":")[1])
        end_byte = int(next_line.split(":")[1]) - 1
        
        # Download slice
        r_slice = client.get(grib_url, headers={"Range": f"bytes={start_byte}-{end_byte}"})
        
        # Decode with eccodes
        gid = eccodes.codes_new_from_message(r_slice.content)
        vals = eccodes.codes_get_values(gid)
        Ni = eccodes.codes_get(gid, "Ni") # 1440
        Nj = eccodes.codes_get(gid, "Nj") # 721
        eccodes.codes_release(gid)
        
        grid = vals.reshape((Nj, Ni))
        lats = np.linspace(90, -90, Nj)
        lons = np.linspace(0, 359.75, Ni)
        
        # Extract at region coordinates
        for r in REGIONS:
            lat_idx = int(np.argmin(np.abs(lats - r["lat"])))
            lon_idx = int(np.argmin(np.abs(lons - r["lon"])))
            cum_val = float(grid[lat_idx, lon_idx])
            cum_03z[r["id"]].append(cum_val)
            
        print(f"  Step {f_str} (acc: 0-{s}h): downloaded & decoded ({len(r_slice.content)} bytes)")

# 4. De-accumulate to exact 24-hour daily increments matching 03Z-03Z IMD observation
daily_forecasts = {r["id"]: [] for r in REGIONS}
for r in REGIONS:
    arr = cum_03z[r["id"]]
    for d in range(1, 11):
        daily_val = max(0.0, arr[d] - arr[d-1])
        daily_forecasts[r["id"]].append(round(daily_val, 1))

# 5. Evaluate ForecastBustDefinition and Assemble Proof-of-Concept Rows
bust_evaluator = ForecastBustDefinition(BustThresholdConfig(tail_error_threshold_mm=35.0))
init_dt = datetime.strptime(INIT_DATE_STR, "%Y-%m-%d")

poc_rows = []
for r in REGIONS:
    rid = r["id"]
    rname = r["name"]
    for d in range(1, 11):
        valid_dt = init_dt + timedelta(days=d)
        valid_str = valid_dt.strftime("%Y-%m-%d")
        
        fcst = daily_forecasts[rid][d-1]
        obs = OBSERVED_DAILY[rid][d-1]
        abs_err = round(abs(fcst - obs), 1)
        
        tail_eval = bust_evaluator.evaluate_error_tail(
            forecast_val=fcst,
            observed_val=obs,
            lead_time_days=d,
            region_id=rid,
            forecast_source="NOAA GFS 0.25° Operational",
            variable=ForecastVariable.PRECIPITATION
        )
        cat_eval = bust_evaluator.evaluate_category_failure(
            forecast_val=fcst,
            observed_val=obs,
            lead_time_days=d,
            region_id=rid,
            forecast_source="NOAA GFS 0.25° Operational"
        )
        
        is_bust = int(tail_eval.is_bust or cat_eval.is_bust)
        
        applied_thresh = round(35.0 * (1.0 + 0.08 * (d - 1)), 1)
        
        poc_rows.append({
            "init_date": INIT_DATE_STR,
            "valid_date": valid_str,
            "region": f"{rname} ({rid})",
            "lead": f"D+{d}",
            "forecast_rainfall": fcst,
            "observed_rainfall": obs,
            "absolute_error": abs_err,
            "applied_threshold": applied_thresh,
            "bust_label": is_bust
        })

print("\n" + "="*95)
print(f"PROOF OF CONCEPT: REAL NOAA GFS + OBSERVATION VERIFICATION ({len(poc_rows)} ROWS)")
print("="*95)
header = f"{'Init Date':<11} {'Valid Date':<11} {'Region':<24} {'Lead':<5} {'Fcst(mm)':<9} {'Obs(mm)':<9} {'Err(mm)':<9} {'Thresh':<7} {'Bust?'}"
print(header)
print("-" * len(header))
for row in poc_rows:
    print(f"{row['init_date']:<11} {row['valid_date']:<11} {row['region']:<24} {row['lead']:<5} {row['forecast_rainfall']:<9.1f} {row['observed_rainfall']:<9.1f} {row['absolute_error']:<9.1f} {row['applied_threshold']:<7.1f} {row['bust_label']}")
