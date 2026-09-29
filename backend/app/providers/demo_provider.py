import math
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.schemas.models import DataModeEnum, ForecastVariable
from app.providers.base import ForecastGrid, ObservationGrid

# Base climatological rainfall (mm/day) per subdivision for Southwest Monsoon baseline
SUBDIVISION_CLIMO_RAIN = {
    "SUB_01": 22.0, "SUB_02": 38.0, "SUB_03": 44.0, "SUB_04": 28.0, "SUB_05": 42.0,
    "SUB_06": 18.0, "SUB_07": 24.0, "SUB_08": 16.0, "SUB_09": 15.0, "SUB_10": 12.0,
    "SUB_11": 8.0,  "SUB_12": 32.0, "SUB_13": 6.0,  "SUB_14": 7.0,  "SUB_15": 28.0,
    "SUB_16": 4.0,  "SUB_17": 2.5,  "SUB_18": 6.0,  "SUB_19": 14.0, "SUB_20": 18.0,
    "SUB_21": 15.0, "SUB_22": 11.0, "SUB_23": 68.0, "SUB_24": 22.0, "SUB_25": 14.0,
    "SUB_26": 19.0, "SUB_27": 21.0, "SUB_28": 16.0, "SUB_29": 17.0, "SUB_30": 8.0,
    "SUB_31": 7.0,  "SUB_32": 72.0, "SUB_33": 12.0, "SUB_34": 15.0, "SUB_35": 65.0,
    "SUB_36": 20.0
}

# Temperature climatology (°C)
SUBDIVISION_CLIMO_TEMP = {
    "SUB_01": 28.0, "SUB_02": 21.0, "SUB_03": 27.0, "SUB_04": 25.0, "SUB_05": 23.0,
    "SUB_06": 31.0, "SUB_07": 30.0, "SUB_08": 29.0, "SUB_09": 31.0, "SUB_10": 32.0,
    "SUB_11": 33.0, "SUB_12": 18.0, "SUB_13": 33.0, "SUB_14": 32.0, "SUB_15": 16.0,
    "SUB_16": 12.0, "SUB_17": 37.0, "SUB_18": 35.0, "SUB_19": 31.0, "SUB_20": 30.0,
    "SUB_21": 33.0, "SUB_22": 32.0, "SUB_23": 29.0, "SUB_24": 28.0, "SUB_25": 30.0,
    "SUB_26": 31.0, "SUB_27": 29.0, "SUB_28": 31.0, "SUB_29": 30.0, "SUB_30": 32.0,
    "SUB_31": 32.0, "SUB_32": 28.0, "SUB_33": 29.0, "SUB_34": 26.0, "SUB_35": 27.0,
    "SUB_36": 28.5
}

class DemoProvider:
    """Deterministic scientific data generator grounded in Indian synoptic meteorology."""

    @staticmethod
    def get_valid_time(init_time: str, lead_days: int) -> str:
        try:
            dt = datetime.fromisoformat(init_time.replace("Z", ""))
        except Exception:
            dt = datetime(2024, 7, 15, 0, 0)
        valid_dt = dt + timedelta(days=lead_days)
        return valid_dt.strftime("%Y-%m-%d")

    @classmethod
    def get_ground_truth(cls, valid_date: str, variable: ForecastVariable) -> ObservationGrid:
        """Ground truth observation (e.g. IMD observed daily rainfall or ERA5)."""
        sub_vals = {}
        for sub_id, climo in SUBDIVISION_CLIMO_RAIN.items():
            if variable == ForecastVariable.PRECIPITATION:
                # Add deterministic spatial modulation by day of year
                sub_num = int(sub_id.split("_")[1])
                mod = math.sin(sub_num * 0.45) * 12.0
                obs = max(0.0, round(climo + mod, 1))
                sub_vals[sub_id] = obs
            elif variable == ForecastVariable.TEMPERATURE:
                t_climo = SUBDIVISION_CLIMO_TEMP.get(sub_id, 28.0)
                sub_vals[sub_id] = round(t_climo + math.cos(int(sub_id.split("_")[1]) * 0.3) * 2.5, 1)
            else:
                # Wind speed
                sub_vals[sub_id] = round(18.0 + (int(sub_id.split("_")[1]) % 7) * 3.5, 1)
        
        return ObservationGrid(
            source="IMD_Gridded_Obs",
            valid_time=valid_date,
            variable=variable,
            units="mm/day" if variable == ForecastVariable.PRECIPITATION else "°C",
            resolution="0.25° (~25km)",
            subdivision_values=sub_vals
        )

    @classmethod
    def generate_synthetic_grid(
        cls,
        source: str,
        init_time: str,
        lead_time_days: int,
        variable: ForecastVariable,
        bias_offset: float = 1.0,
        spread_factor: float = 1.0
    ) -> ForecastGrid:
        """
        Generates deterministic forecast values and ensemble spread.
        Forecast error systematically scales with lead time (e.g. D+5 to D+10 degrades).
        """
        valid_date = cls.get_valid_time(init_time, lead_time_days)
        obs_grid = cls.get_ground_truth(valid_date, variable)
        
        fcst_vals = {}
        spread_vals = {}
        
        # Lead time uncertainty scale (square root growth standard in NWP)
        lead_multiplier = math.sqrt(max(1, lead_time_days))
        
        for sub_id, obs in obs_grid.subdivision_values.items():
            sub_num = int(sub_id.split("_")[1])
            # High-risk bust regions for demo scenario:
            # Saurashtra & Kutch (SUB_22), Konkan (SUB_23), Coastal Karnataka (SUB_32), Vidarbha (SUB_26), Bihar (SUB_09)
            is_bust_prone = sub_id in ["SUB_22", "SUB_23", "SUB_32", "SUB_26", "SUB_09", "SUB_15"]
            
            error_direction = 1.0 if (sub_num % 2 == 0) else -1.0
            
            if is_bust_prone and lead_time_days >= 4:
                # Significant forecast error at medium range (bust scenario)
                error_mag = (18.0 + (sub_num % 5) * 6.0) * (lead_time_days / 5.0)
            else:
                # Standard NWP forecast error
                error_mag = (3.5 + (sub_num % 4) * 2.0) * (lead_time_days / 7.0)
                
            fcst = max(0.0, round(obs * bias_offset + error_direction * error_mag, 1))
            
            # Ensemble spread (standard deviation across members)
            base_spread = 4.0 if variable == ForecastVariable.PRECIPITATION else 0.8
            spread = round((base_spread + (obs * 0.18 if variable == ForecastVariable.PRECIPITATION else 0.5)) 
                           * lead_multiplier * spread_factor, 1)
            
            fcst_vals[sub_id] = fcst
            spread_vals[sub_id] = spread
            
        return ForecastGrid(
            source=source,
            model_name=f"{source}_Deterministic_v1",
            initialization_time=init_time,
            valid_time=valid_date,
            lead_time_days=lead_time_days,
            variable=variable,
            units="mm/day" if variable == ForecastVariable.PRECIPITATION else "°C",
            resolution="0.25°",
            data_mode=DataModeEnum.REPLAY,
            subdivision_values=fcst_vals,
            ensemble_spread=spread_vals,
            ensemble_members_count=21
        )
