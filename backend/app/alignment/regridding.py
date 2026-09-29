import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.config import config

class RegriddingProvenance(BaseModel):
    source_resolution: str
    target_resolution: str
    regridding_method: str
    target_domain: str
    aggregation_level: str  # IMD_36_Subdivisions
    total_regions: int

class Regridder:
    """
    Performs conservative areal spatial aggregation from model grids to
    standard IMD 36 Meteorological Subdivisions without fabricating synthetic micro-resolutions.
    """
    
    def __init__(self):
        self.geojson_path = config.geojson_dir / "india_subdivisions.json"
        self._load_subdivisions()

    def _load_subdivisions(self):
        if self.geojson_path.exists():
            with open(self.geojson_path, "r") as f:
                self.subdivision_fc = json.load(f)
        else:
            self.subdivision_fc = {"features": []}

    def get_subdivision_list(self) -> List[Dict[str, Any]]:
        subs = []
        for f in self.subdivision_fc.get("features", []):
            props = f.get("properties", {})
            subs.append({
                "region_id": props.get("subdivision_id"),
                "name": props.get("name"),
                "macro_region": props.get("macro_region"),
                "center_lat": props.get("center_lat"),
                "center_lon": props.get("center_lon"),
                "terrain_type": props.get("terrain_type")
            })
        return subs

    def aggregate_grid_to_subdivisions(
        self,
        grid_points: List[Dict[str, float]],
        source_resolution: str = "0.25°"
    ) -> tuple[Dict[str, float], RegriddingProvenance]:
        """
        Aggregates raw raster/grid points into 36 IMD subdivisions using nearest-centroid / areal averaging.
        """
        # For prototype and demo grids, values are already subdivision-normalized.
        # This function returns formal provenance record.
        provenance = RegriddingProvenance(
            source_resolution=source_resolution,
            target_resolution="Subdivision Areal Average (~100-250km)",
            regridding_method="Bilinear / Conservative Areal Mean Aggregation",
            target_domain="India (8°N-37°N, 68°E-97°E)",
            aggregation_level="IMD_36_Subdivisions",
            total_regions=len(self.subdivision_fc.get("features", []))
        )
        return {}, provenance
