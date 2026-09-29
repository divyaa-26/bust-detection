import math
from typing import List, Dict, Any, Optional
from app.schemas.models import HistoricalAnalogue, AnalogueErrorSummary

# Catalog of verified historical medium-range forecast bust cases across India
HISTORICAL_ANALOGUE_CATALOG = [
    {
        "analogue_id": "ANA_2023_BIPARJOY",
        "event_name": "Extremely Severe Cyclonic Storm Biparjoy Landfall",
        "historical_date": "2023-06-15",
        "region_id": "SUB_22",
        "region_name": "Saurashtra & Kutch",
        "lead_time_days": 5,
        "features": {"rainfall_level": 65.0, "spread": 28.5, "lead": 5, "disagreement": 32.0},
        "forecast_synoptic_setup": "Arabian Sea deep vortex recurvature; GFS and AIFS diverged on landfall track and slow translation speed.",
        "actual_outcome": "Observed 185 mm torrential rainfall with storm surge; medium-range forecast underpredicted total inland rain accumulation.",
        "was_bust": True,
        "observed_error_mm": 120.0,
        "bias_direction": "UNDERFORECAST"
    },
    {
        "analogue_id": "ANA_2022_WESTERN_GHATS",
        "event_name": "Western Ghats Active Monsoon Surge & Orographic Cloudburst",
        "historical_date": "2022-07-08",
        "region_id": "SUB_23",
        "region_name": "Konkan & Goa",
        "lead_time_days": 4,
        "features": {"rainfall_level": 85.0, "spread": 24.0, "lead": 4, "disagreement": 26.0},
        "forecast_synoptic_setup": "Offshore trough along Gujarat to Kerala coast; strong low-level westerly jet exceeding 45 knots.",
        "actual_outcome": "Observed 242 mm; models struggled with sub-grid orographic enhancement at lead D+4.",
        "was_bust": True,
        "observed_error_mm": 157.0,
        "bias_direction": "UNDERFORECAST"
    },
    {
        "analogue_id": "ANA_2023_MICHAUNG",
        "event_name": "Severe Cyclonic Storm Michaung Coastal Stalling",
        "historical_date": "2023-12-04",
        "region_id": "SUB_28",
        "region_name": "Coastal Andhra Pradesh & Yanam",
        "lead_time_days": 3,
        "features": {"rainfall_level": 55.0, "spread": 19.5, "lead": 3, "disagreement": 18.0},
        "forecast_synoptic_setup": "Bay of Bengal cyclone stalling parallel to south Andhra / north Tamil Nadu coast.",
        "actual_outcome": "Extended convective band caused catastrophic inundation (over 280 mm in 24h); D+3 forecast failed on translation speed.",
        "was_bust": True,
        "observed_error_mm": 165.0,
        "bias_direction": "UNDERFORECAST"
    },
    {
        "analogue_id": "ANA_2024_WESTERN_DISTURBANCE",
        "event_name": "Intense Mid-Latitude Western Disturbance Over Northwest India",
        "historical_date": "2024-01-31",
        "region_id": "SUB_15",
        "region_name": "Himachal Pradesh",
        "lead_time_days": 5,
        "features": {"rainfall_level": 35.0, "spread": 16.0, "lead": 5, "disagreement": 22.0},
        "forecast_synoptic_setup": "Deep 500 hPa trough extending into northern Arabian Sea with heavy moisture feed.",
        "actual_outcome": "Heavy snowfall and blizzard conditions (observed liquid equivalent 72 mm vs 18 mm predicted).",
        "was_bust": True,
        "observed_error_mm": 54.0,
        "bias_direction": "UNDERFORECAST"
    },
    {
        "analogue_id": "ANA_2023_MAHARASHTRA_TROUGH",
        "event_name": "Monsoon Trough Sudden Southward Dip Over Central India",
        "historical_date": "2023-07-21",
        "region_id": "SUB_26",
        "region_name": "Vidarbha",
        "lead_time_days": 4,
        "features": {"rainfall_level": 40.0, "spread": 15.0, "lead": 4, "disagreement": 17.0},
        "forecast_synoptic_setup": "Low pressure area over northwest Bay moved west-northwestward; shear zone at 3.1 km.",
        "actual_outcome": "Observed 115 mm localized downpour causing flash flooding; D+4 forecast placed rain core 140km further north.",
        "was_bust": True,
        "observed_error_mm": 75.0,
        "bias_direction": "UNDERFORECAST"
    },
    {
        "analogue_id": "ANA_2022_NORMAL_MONSOON",
        "event_name": "Well-Behaved Southwest Monsoon Transverse Trough",
        "historical_date": "2022-08-14",
        "region_id": "SUB_20",
        "region_name": "East Madhya Pradesh",
        "lead_time_days": 3,
        "features": {"rainfall_level": 22.0, "spread": 6.5, "lead": 3, "disagreement": 5.0},
        "forecast_synoptic_setup": "Standard quasi-stationary monsoon trough; uniform low-level convergence.",
        "actual_outcome": "Forecast predicted 25 mm; observed was 23.5 mm. High reliability, non-bust verification.",
        "was_bust": False,
        "observed_error_mm": 1.5,
        "bias_direction": "NEUTRAL"
    },
    {
        "analogue_id": "ANA_2021_TAUKTAE",
        "event_name": "Extremely Severe Cyclonic Storm Tauktae Gujarat Landfall",
        "historical_date": "2021-05-17",
        "region_id": "SUB_22",
        "region_name": "Saurashtra & Kutch",
        "lead_time_days": 5,
        "features": {"rainfall_level": 70.0, "spread": 26.0, "lead": 5, "disagreement": 28.0},
        "forecast_synoptic_setup": "Arabian Sea northward tracking cyclone with rapid pre-landfall intensification.",
        "actual_outcome": "Observed 210 mm torrential rain; models underpredicted convective rainband width and inland penetration.",
        "was_bust": True,
        "observed_error_mm": 140.0,
        "bias_direction": "UNDERFORECAST"
    },
    {
        "analogue_id": "ANA_2019_VAYU",
        "event_name": "Very Severe Cyclonic Storm Vayu Coastal Skirting",
        "historical_date": "2019-06-13",
        "region_id": "SUB_22",
        "region_name": "Saurashtra & Kutch",
        "lead_time_days": 4,
        "features": {"rainfall_level": 45.0, "spread": 22.0, "lead": 4, "disagreement": 24.0},
        "forecast_synoptic_setup": "Cyclone moving parallel to Saurashtra coast; track recurvature uncertainty and dry-air entrainment.",
        "actual_outcome": "Forecast underpredicted offshore moisture divergence; observed 110 mm.",
        "was_bust": True,
        "observed_error_mm": 65.0,
        "bias_direction": "UNDERFORECAST"
    },
    {
        "analogue_id": "ANA_2020_NISARGA",
        "event_name": "Severe Cyclonic Storm Nisarga Maharashtra Landfall",
        "historical_date": "2020-06-03",
        "region_id": "SUB_23",
        "region_name": "Konkan & Goa",
        "lead_time_days": 3,
        "features": {"rainfall_level": 80.0, "spread": 20.0, "lead": 3, "disagreement": 18.0},
        "forecast_synoptic_setup": "Early June Arabian Sea cyclone striking North Maharashtra and South Gujarat boundary.",
        "actual_outcome": "Observed 175 mm rain; D+3 forecast failed on rainfield asymmetry.",
        "was_bust": True,
        "observed_error_mm": 95.0,
        "bias_direction": "UNDERFORECAST"
    },
    {
        "analogue_id": "ANA_2022_FALSE_ALARM_CYCLONE_ASANI",
        "event_name": "Severe Cyclonic Storm Asani Rapid Offshore Weakening",
        "historical_date": "2022-05-11",
        "region_id": "SUB_10",
        "region_name": "Odisha",
        "lead_time_days": 4,
        "features": {"rainfall_level": 110.0, "spread": 21.0, "lead": 4, "disagreement": 24.0},
        "forecast_synoptic_setup": "Bay of Bengal cyclone projected to bring catastrophic coastal deluges; high shear induced dry-air entrainment.",
        "actual_outcome": "System sheared and stalled offshore; observed only 18.0 mm vs 110.0 mm forecast (major overforecast false alarm).",
        "was_bust": True,
        "observed_error_mm": 92.0,
        "bias_direction": "OVERFORECAST"
    },
    {
        "analogue_id": "ANA_2023_FALSE_ALARM_MONSOON_SURGE",
        "event_name": "Over-Predicted Monsoon Depression Incursion Over West Rajasthan",
        "historical_date": "2023-08-05",
        "region_id": "SUB_17",
        "region_name": "West Rajasthan",
        "lead_time_days": 5,
        "features": {"rainfall_level": 75.0, "spread": 23.0, "lead": 5, "disagreement": 20.0},
        "forecast_synoptic_setup": "Mid-tropospheric cyclonic circulation forecasted to penetrate deep into desert sector.",
        "actual_outcome": "Persistent anti-cyclonic ridge blocked moisture influx; observed 8.5 mm vs 75.0 mm forecast (false alarm bust).",
        "was_bust": True,
        "observed_error_mm": 66.5,
        "bias_direction": "OVERFORECAST"
    }
]

class HistoricalAnalogueEngine:
    """
    K-Nearest Neighbor similarity search in normalized atmospheric setup feature space.
    Finds verified historical analogues to provide empirical context to forecasters.
    Enforces strict temporal anti-leakage via as_of_date cutoffs.
    Calculates historical forecast error behavior (bust rate, mean error, bias direction).
    """

    @classmethod
    def find_top_analogues(
        cls,
        target_region_id: str,
        lead_time_days: int,
        forecast_value: float,
        ensemble_spread: float,
        model_disagreement: float,
        as_of_date: Optional[str] = None,
        top_k: int = 3
    ) -> List[HistoricalAnalogue]:
        scored_analogues = []
        
        # Target feature vector: [rainfall_level, spread, lead, disagreement]
        target_vec = [forecast_value, ensemble_spread, float(lead_time_days), model_disagreement]
        # Normalization scale factors
        scales = [50.0, 20.0, 5.0, 20.0]
        
        for item in HISTORICAL_ANALOGUE_CATALOG:
            # Strict Anti-Leakage Guard:
            # Candidate analogue historical date must be strictly prior to as_of_date.
            # An event and its outcome cannot be used as an analogue before it occurs.
            if as_of_date and item["historical_date"] >= as_of_date:
                continue

            item_feats = item["features"]
            feat_vec = [
                item_feats["rainfall_level"],
                item_feats["spread"],
                float(item["lead_time_days"]),
                item_feats["disagreement"]
            ]
            
            # Weighted Euclidean distance in normalized feature space
            dist_sq = 0.0
            for t_val, f_val, s in zip(target_vec, feat_vec, scales):
                diff = (t_val - f_val) / s
                dist_sq += diff * diff
            dist = math.sqrt(dist_sq)
            
            # Region boost if same meteorological subdivision or macro-region
            region_boost = 0.85 if item["region_id"] == target_region_id else 1.0
            adjusted_dist = dist * region_boost
            
            # Similarity score between 0.0 and 1.0
            similarity = round(1.0 / (1.0 + adjusted_dist), 3)
            
            analogue = HistoricalAnalogue(
                analogue_id=item["analogue_id"],
                event_name=item["event_name"],
                historical_date=item["historical_date"],
                region_id=item["region_id"],
                region_name=item["region_name"],
                lead_time_days=item["lead_time_days"],
                similarity_score=similarity,
                forecast_synoptic_setup=item["forecast_synoptic_setup"],
                actual_outcome=item["actual_outcome"],
                was_bust=item["was_bust"],
                observed_error_mm=item["observed_error_mm"],
                bias_direction=item.get("bias_direction", "UNDERFORECAST")
            )
            scored_analogues.append((similarity, analogue))
            
        scored_analogues.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_analogues[:top_k]]

    @classmethod
    def compute_analogue_error_statistics(cls, analogues: List[HistoricalAnalogue]) -> AnalogueErrorSummary:
        """
        Derives empirical forecast error behavior across the matched analogue cluster.
        Provides duty forecasters with empirical baseline bust rates, mean error, and bias direction.
        """
        if not analogues:
            return AnalogueErrorSummary(
                analogue_count=0,
                historical_bust_rate=0.086,
                mean_observed_error_mm=12.0,
                dominant_bias_direction="NEUTRAL",
                summary_text="No prior historical analogues matched within temporal cutoff; regional climatological baseline applied."
            )
            
        n = len(analogues)
        bust_count = sum(1 for a in analogues if a.was_bust)
        bust_rate = round(bust_count / n, 3)
        mean_err = round(sum(a.observed_error_mm for a in analogues) / n, 1)
        
        over_count = sum(1 for a in analogues if a.bias_direction == "OVERFORECAST")
        under_count = sum(1 for a in analogues if a.bias_direction == "UNDERFORECAST")
        
        if under_count > over_count:
            dominant_bias = "UNDERFORECAST"
            bias_label = "underprediction of extreme totals"
        elif over_count > under_count:
            dominant_bias = "OVERFORECAST"
            bias_label = "overprediction / false alarm inflation"
        else:
            dominant_bias = "MIXED_BIAS"
            bias_label = "mixed over/under-forecast tendencies"
            
        summary_text = (
            f"{bust_count} of {n} matched historical analogues resulted in verified forecast busts "
            f"({round(bust_rate * 100, 1)}% historical bust frequency, mean verification error: {mean_err} mm/day, "
            f"dominant failure mode: {bias_label})."
        )
        
        return AnalogueErrorSummary(
            analogue_count=n,
            historical_bust_rate=bust_rate,
            mean_observed_error_mm=mean_err,
            dominant_bias_direction=dominant_bias,
            summary_text=summary_text
        )
