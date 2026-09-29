"""
Automated Test for Temporal Integrity of GFS Forecast vs IMD Verification Windows.
Verifies that for leads D1 through D10, the GFS accumulation window exactly matches
the 24-hour IMD observation window ending at 03:00 UTC (08:30 IST) on the stamped date.
"""

import pytest
from datetime import datetime, timedelta

def get_gfs_step_indices(lead_day: int) -> tuple[int, int]:
    """
    Returns (start_hour, end_hour) for GFS 00Z cycle aligned to 03Z-03Z IMD observation.
    D1: f003 -> f027
    D2: f027 -> f051
    ...
    D10: f219 -> f243
    """
    assert 1 <= lead_day <= 10, "Lead day must be between 1 and 10"
    start_h = 24 * (lead_day - 1) + 3
    end_h = 24 * lead_day + 3
    return start_h, end_h

def get_forecast_window_utc(init_dt: datetime, lead_day: int) -> tuple[datetime, datetime]:
    start_h, end_h = get_gfs_step_indices(lead_day)
    start_dt = init_dt + timedelta(hours=start_h)
    end_dt = init_dt + timedelta(hours=end_h)
    return start_dt, end_dt

def get_imd_observation_window_utc(valid_date_str: str) -> tuple[datetime, datetime]:
    """
    IMD daily rainfall stamped YYYY-MM-DD represents the 24-hour accumulation 
    ending at 08:30 IST (03:00 UTC) on YYYY-MM-DD.
    """
    valid_dt = datetime.strptime(valid_date_str, "%Y-%m-%d")
    end_dt = valid_dt.replace(hour=3, minute=0, second=0)
    start_dt = end_dt - timedelta(hours=24)
    return start_dt, end_dt

def test_all_10_leads_temporal_alignment():
    init_dt = datetime(2024, 7, 15, 0, 0, 0) # 00 UTC cycle
    
    for lead in range(1, 11):
        # Forecast window
        fcst_start, fcst_end = get_forecast_window_utc(init_dt, lead)
        
        # Target verification date
        target_valid_date = init_dt.date() + timedelta(days=lead)
        valid_date_str = target_valid_date.strftime("%Y-%m-%d")
        
        # Observation window
        obs_start, obs_end = get_imd_observation_window_utc(valid_date_str)
        
        # 1. Start timestamps must be identical
        assert fcst_start == obs_start, f"Lead D+{lead} start mismatch: {fcst_start} != {obs_start}"
        
        # 2. End timestamps must be identical
        assert fcst_end == obs_end, f"Lead D+{lead} end mismatch: {fcst_end} != {obs_end}"
        
        # 3. Exactly 24-hour window
        assert (fcst_end - fcst_start).total_seconds() == 86400, f"Lead D+{lead} duration is not 24h"
        assert (obs_end - obs_start).total_seconds() == 86400, f"Lead D+{lead} obs duration is not 24h"
        
        # 4. End time must be 03:00 UTC (08:30 IST)
        assert fcst_end.hour == 3 and fcst_end.minute == 0, f"Lead D+{lead} end time is not 03:00 UTC"

def test_gfs_step_indices_explicit_mapping():
    expected_steps = {
        1: (3, 27),
        2: (27, 51),
        3: (51, 75),
        4: (75, 99),
        5: (99, 123),
        6: (123, 147),
        7: (147, 171),
        8: (171, 195),
        9: (195, 219),
        10: (219, 243)
    }
    for lead, (exp_start, exp_end) in expected_steps.items():
        start, end = get_gfs_step_indices(lead)
        assert start == exp_start, f"Lead D+{lead} start step mismatch: {start} != {exp_start}"
        assert end == exp_end, f"Lead D+{lead} end step mismatch: {end} != {exp_end}"
