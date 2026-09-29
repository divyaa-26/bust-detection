import httpx
import eccodes
import numpy as np
from datetime import datetime, timedelta
from app.core.bust_definition import ForecastBustDefinition, BustThresholdConfig
from app.schemas.models import ForecastVariable

INIT_DATE_STR = "2024-07-15"
INIT_CYCLE = "00"
REGIONS = [
    {"id": "SUB_22", "name": "Saurashtra & Kutch", "lat": 22.3, "lon": 70.3},
    {"id": "SUB_23", "name": "Konkan & Goa", "lat": 18.5, "lon": 73.2},
    {"id": "SUB_20", "name": "East Madhya Pradesh", "lat": 23.5, "lon": 80.5}
]
OBSERVED_DAILY = {
    "SUB_22": [44.4, 2.9, 26.6, 18.4, 6.0, 82.6, 39.0, 16.1, 14.2, 0.8],
    "SUB_23": [9.6, 28.8, 36.1, 39.9, 67.2, 32.5, 40.9, 37.3, 43.0, 67.6],
    "SUB_20": [1.0, 4.2, 2.8, 10.3, 11.1, 4.3, 18.4, 44.0, 46.5, 23.1]
}

# 1. Fetch 03Z-aligned steps: 3, 27, 51, 75, 99, 123, 147, 171, 195, 219, 243
steps_03z = [3, 27, 51, 75, 99, 123, 147, 171, 195, 219, 243]
date_slug = INIT_DATE_STR.replace("-", "")
base_s3 = f"https://noaa-gfs-bdp-pds.s3.amazonaws.com/gfs.{date_slug}/{INIT_CYCLE}/atmos"

cum_03z = {r["id"]: [] for r in REGIONS}

print("Fetching and decoding 03Z-aligned GFS steps (f003 to f243)...")
with httpx.Client(timeout=30.0) as client:
    for s in steps_03z:
        f_str = f"f{s:03d}"
        idx_url = f"{base_s3}/gfs.t{INIT_CYCLE}z.pgrb2.0p25.{f_str}.idx"
        grib_url = f"{base_s3}/gfs.t{INIT_CYCLE}z.pgrb2.0p25.{f_str}"
        
        lines = client.get(idx_url).text.splitlines()
        target_str = f"APCP:surface:0-{s} hour acc fcst"
        target_line = None
        for i, line in enumerate(lines):
            if target_str in line:
                target_line = line
                next_line = lines[i+1]
                break
        if not target_line:
            raise ValueError(f"Could not find {target_str} in {f_str}.idx")
            
        start_byte = int(target_line.split(":")[1])
        end_byte = int(next_line.split(":")[1]) - 1
        
        r_slice = client.get(grib_url, headers={"Range": f"bytes={start_byte}-{end_byte}"})
        gid = eccodes.codes_new_from_message(r_slice.content)
        vals = eccodes.codes_get_values(gid)
        Ni = eccodes.codes_get(gid, "Ni")
        Nj = eccodes.codes_get(gid, "Nj")
        eccodes.codes_release(gid)
        
        grid = vals.reshape((Nj, Ni))
        lats = np.linspace(90, -90, Nj)
        lons = np.linspace(0, 359.75, Ni)
        
        for r in REGIONS:
            lat_idx = int(np.argmin(np.abs(lats - r["lat"])))
            lon_idx = int(np.argmin(np.abs(lons - r["lon"])))
            cum_03z[r["id"]].append(float(grid[lat_idx, lon_idx]))
        print(f"  Loaded step {f_str} (acc: 0-{s}h)")

# 2. Compute Corrected Daily Differences (03Z to 03Z)
daily_03z = {r["id"]: [] for r in REGIONS}
for r in REGIONS:
    arr = cum_03z[r["id"]]
    for d in range(1, 11):
        diff = max(0.0, arr[d] - arr[d-1])
        daily_03z[r["id"]].append(round(diff, 1))

# Previous 00Z-00Z values from poc_real_data.py
daily_00z = {
    "SUB_22": [6.8, 43.8, 26.4, 0.7, 9.6, 4.6, 0.2, 0.2, 0.4, 1.5],
    "SUB_23": [21.4, 27.6, 38.2, 47.1, 47.3, 64.2, 23.5, 39.9, 44.4, 61.1],
    "SUB_20": [4.3, 0.4, 4.9, 21.4, 12.2, 19.8, 33.5, 10.1, 32.6, 5.4]
}

# 3. Evaluate ForecastBustDefinition for Corrected 03Z-aligned data
bust_evaluator = ForecastBustDefinition(BustThresholdConfig(tail_error_threshold_mm=35.0))
init_dt = datetime.strptime(INIT_DATE_STR, "%Y-%m-%d")

comparison_rows = []

for r in REGIONS:
    rid = r["id"]
    rname = r["name"]
    for d in range(1, 11):
        valid_dt = init_dt + timedelta(days=d)
        valid_str = valid_dt.strftime("%Y-%m-%d")
        
        # 00Z values (before)
        fcst_old = daily_00z[rid][d-1]
        
        # 03Z values (after)
        fcst_new = daily_03z[rid][d-1]
        obs = OBSERVED_DAILY[rid][d-1]
        
        err_old = round(abs(fcst_old - obs), 1)
        err_new = round(abs(fcst_new - obs), 1)
        
        applied_thresh = round(35.0 * (1.0 + 0.08 * (d - 1)), 1)
        
        # Evaluate Bust on Old
        t_old = bust_evaluator.evaluate_error_tail(fcst_old, obs, d, rid, "NOAA GFS", ForecastVariable.PRECIPITATION)
        c_old = bust_evaluator.evaluate_category_failure(fcst_old, obs, d, rid, "NOAA GFS")
        bust_old = int(t_old.is_bust or c_old.is_bust)
        
        # Evaluate Bust on New
        t_new = bust_evaluator.evaluate_error_tail(fcst_new, obs, d, rid, "NOAA GFS", ForecastVariable.PRECIPITATION)
        c_new = bust_evaluator.evaluate_category_failure(fcst_new, obs, d, rid, "NOAA GFS")
        bust_new = int(t_new.is_bust or c_new.is_bust)
        
        changed = (fcst_old != fcst_new) or (bust_old != bust_new)
        
        comparison_rows.append({
            "region": f"{rname} ({rid})",
            "lead": f"D+{d}",
            "valid_date": valid_str,
            "obs": obs,
            "fcst_old": fcst_old,
            "fcst_new": fcst_new,
            "err_old": err_old,
            "err_new": err_new,
            "thresh": applied_thresh,
            "bust_old": bust_old,
            "bust_new": bust_new,
            "changed": changed
        })

print("\n" + "="*120)
print(f"BEFORE (00Z-00Z) VS AFTER (03Z-03Z IMD ALIGNED) COMPARISON")
print("="*120)
header = f"{'Region':<24} {'Lead':<5} {'Valid Date':<11} {'Obs(mm)':<8} {'FcstOld':<8} {'FcstNew':<8} {'ErrOld':<8} {'ErrNew':<8} {'Thresh':<7} {'BustOld':<8} {'BustNew':<8} {'Delta'}"
print(header)
print("-" * len(header))
for row in comparison_rows:
    delta_str = f"{row['fcst_new'] - row['fcst_old']:+.1f}mm"
    if row['bust_old'] != row['bust_new']:
        delta_str += f" [BUST CHANGED: {row['bust_old']}->{row['bust_new']}]"
    print(f"{row['region']:<24} {row['lead']:<5} {row['valid_date']:<11} {row['obs']:<8.1f} {row['fcst_old']:<8.1f} {row['fcst_new']:<8.1f} {row['err_old']:<8.1f} {row['err_new']:<8.1f} {row['thresh']:<7.1f} {row['bust_old']:<8} {row['bust_new']:<8} {delta_str}")
