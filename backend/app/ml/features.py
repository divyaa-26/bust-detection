from typing import Dict, Any, List, Optional
import math
from app.providers.base import ForecastGrid
from app.ml.base import ModelFeatures
from app.providers.demo_provider import SUBDIVISION_CLIMO_RAIN

class FeatureEngineeringEngine:
    """
    Extracts spatio-temporal, ensemble, multi-model, and historical features
    strictly without leaking future observation information.
    """

    @classmethod
    def extract_features(
        cls,
        primary_grid: ForecastGrid,
        secondary_grid: Optional[ForecastGrid],
        region_id: str,
        lead_time_days: int
    ) -> ModelFeatures:
        fcst_val = primary_grid.subdivision_values.get(region_id, 0.0)
        spread_val = primary_grid.ensemble_spread.get(region_id, 4.0)
        
        # Inter-model difference
        if secondary_grid and region_id in secondary_grid.subdivision_values:
            sec_val = secondary_grid.subdivision_values[region_id]
            diff = abs(fcst_val - sec_val)
        else:
            diff = 0.0
            
        climo = SUBDIVISION_CLIMO_RAIN.get(region_id, 20.0)
        
        # Coastal / Ghats terrain indicator
        is_ghats_or_coastal = region_id in [
            "SUB_22", "SUB_23", "SUB_28", "SUB_31", "SUB_32", "SUB_35", "SUB_07"
        ]

        # Spatial gradient / neighborhood contrast indicator
        spatial_gradient = round(abs(fcst_val - climo) * 0.45, 2)

        return ModelFeatures(
            region_id=region_id,
            lead_time_days=lead_time_days,
            forecast_value=round(fcst_val, 1),
            ensemble_spread=round(spread_val, 1),
            inter_model_difference=round(diff, 1),
            climatological_mean=round(climo, 1),
            spatial_gradient=spatial_gradient,
            is_ghats_or_coastal=is_ghats_or_coastal
        )
