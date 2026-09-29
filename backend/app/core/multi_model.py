from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.providers.base import ForecastGrid
from app.config import config

class MultiModelMetrics(BaseModel):
    region_id: str
    active_models: List[str]
    inter_model_difference: float      # absolute difference between model forecasts
    normalized_disagreement: float     # difference normalized by consensus mean [0, 1+]
    consensus_mean: float              # average of available models
    agreement_score: float             # 1.0 (perfect consensus) to 0.0 (extreme discord)
    mode_description: str              # e.g., "Multi-Model Consensus (GFS + AIFS)" or "Single-Model Fallback (GFS only)"

class MultiModelAgreementEngine:
    """
    Computes inter-model divergence and consensus metrics across legitimate NWP/AI providers.
    Supports graceful degradation when one or more models are offline.
    """

    @classmethod
    def compute_agreement(
        cls,
        forecast_grids: List[ForecastGrid],
        region_id: str
    ) -> MultiModelMetrics:
        # Filter available grids
        valid_grids = [g for g in forecast_grids if g is not None and region_id in g.subdivision_values]
        
        if not valid_grids:
            return MultiModelMetrics(
                region_id=region_id,
                active_models=[],
                inter_model_difference=0.0,
                normalized_disagreement=0.0,
                consensus_mean=0.0,
                agreement_score=1.0,
                mode_description="No active models available"
            )

        model_names = [g.source for g in valid_grids]
        values = [g.subdivision_values[region_id] for g in valid_grids]
        
        if len(values) == 1:
            # Single-model fallback
            return MultiModelMetrics(
                region_id=region_id,
                active_models=model_names,
                inter_model_difference=0.0,
                normalized_disagreement=0.0,
                consensus_mean=values[0],
                agreement_score=1.0,
                mode_description=f"Single-Model Reliability Mode ({model_names[0]} only — NCUM/IFS not in consensus pool)"
            )
            
        mean_val = sum(values) / len(values)
        max_diff = max(values) - min(values)
        
        # Normalized disagreement: scale relative to mean value + 5mm smoothing
        norm_disagree = max_diff / (mean_val + 5.0)
        # Agreement score: 1.0 down to 0.0
        agreement_score = max(0.0, min(1.0, 1.0 - (norm_disagree * 0.7)))
        
        models_str = " + ".join(model_names)
        return MultiModelMetrics(
            region_id=region_id,
            active_models=model_names,
            inter_model_difference=round(max_diff, 1),
            normalized_disagreement=round(norm_disagree, 2),
            consensus_mean=round(mean_val, 1),
            agreement_score=round(agreement_score, 2),
            mode_description=f"Multi-Model Disagreement Active ({models_str})"
        )
