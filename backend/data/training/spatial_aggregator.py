"""
Area-Weighted Spatial Aggregator for IMD 36 Meteorological Subdivisions.
Computes latitude-cosine area-weighted spatial aggregation of regular 0.25° gridded 
NWP forecasts (NOAA GFS) and gridded observations (IMD) over subdivision polygons.
"""

import json
from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np
from shapely.geometry import shape, box, Polygon

GEOJSON_PATH = Path(__file__).resolve().parent.parent / "geojson" / "india_subdivisions.json"

class SubdivisionSpatialAggregator:
    def __init__(self, geojson_path: Path = GEOJSON_PATH, res_deg: float = 0.25):
        self.res_deg = res_deg
        self.half_res = res_deg / 2.0
        
        with open(geojson_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        self.features = data["features"]
        self.subdivisions = {}
        for feat in self.features:
            props = feat["properties"]
            sub_id = props["subdivision_id"]
            geom = shape(feat["geometry"])
            self.subdivisions[sub_id] = {
                "id": sub_id,
                "name": props["name"],
                "macro_region": props.get("macro_region", "Unknown"),
                "terrain_type": props.get("terrain_type", "plains"),
                "coastal": props.get("coastal", "coastal" in props.get("terrain_type", "").lower()),
                "center_lat": props["center_lat"],
                "center_lon": props["center_lon"],
                "polygon": geom,
                "bounds": geom.bounds  # (minx, miny, maxx, maxy) = (min_lon, min_lat, max_lon, max_lat)
            }
            
        # Precomputed weights cache: sub_id -> dict of (lat_idx, lon_idx) -> normalized_weight
        self._weights_cache = {}

    def get_grid_coordinates(self, lats: np.ndarray, lons: np.ndarray, sub_id: str) -> List[Tuple[int, int, float]]:
        """
        Returns list of (lat_idx, lon_idx, normalized_area_weight) for grid points inside the subdivision polygon.
        Calculates latitude-cosine area-weighting: Area = cos(latitude) * cell_intersection_area.
        """
        if sub_id in self._weights_cache:
            return self._weights_cache[sub_id]

        sub = self.subdivisions[sub_id]
        poly = sub["polygon"]
        min_lon, min_lat, max_lon, max_lat = sub["bounds"]

        # Filter candidate lats and lons within bounding box with a 1-cell buffer
        cand_lat_mask = (lats >= min_lat - self.res_deg) & (lats <= max_lat + self.res_deg)
        cand_lon_mask = (lons >= min_lon - self.res_deg) & (lons <= max_lon + self.res_deg)

        cand_lat_indices = np.where(cand_lat_mask)[0]
        cand_lon_indices = np.where(cand_lon_mask)[0]

        raw_weights = []
        for i in cand_lat_indices:
            lat = float(lats[i])
            # Latitude cosine factor for spherical Earth grid cell area
            cos_lat = np.cos(np.radians(lat))
            if cos_lat <= 0:
                continue

            for j in cand_lon_indices:
                lon = float(lons[j])
                
                # Construct 0.25° grid cell box centered at (lon, lat)
                cell_box = box(
                    lon - self.half_res,
                    lat - self.half_res,
                    lon + self.half_res,
                    lat + self.half_res
                )
                
                if poly.intersects(cell_box):
                    intersection = poly.intersection(cell_box)
                    inter_area = intersection.area  # In deg^2
                    if inter_area > 0:
                        # Area-weight = cos(lat) * intersection_area
                        weight = cos_lat * inter_area
                        raw_weights.append((i, j, weight))

        # Fallback to nearest centroid grid point if tiny island polygon misses cell center
        if not raw_weights:
            c_lat, c_lon = sub["center_lat"], sub["center_lon"]
            i = int(np.argmin(np.abs(lats - c_lat)))
            j = int(np.argmin(np.abs(lons - c_lon)))
            raw_weights.append((i, j, 1.0))

        # Normalize weights so sum(weights) == 1.0
        total_w = sum(w for _, _, w in raw_weights)
        norm_weights = [(i, j, w / total_w) for i, j, w in raw_weights]

        self._weights_cache[sub_id] = norm_weights
        return norm_weights

    def aggregate_field(self, grid_2d: np.ndarray, lats: np.ndarray, lons: np.ndarray, sub_id: str) -> float:
        """
        Computes the area-weighted spatial mean of a 2D scalar field (e.g. precipitation in mm) over subdivision polygon.
        """
        weights = self.get_grid_coordinates(lats, lons, sub_id)
        weighted_sum = sum(grid_2d[i, j] * w for i, j, w in weights)
        return float(weighted_sum)

    def aggregate_all_subdivisions(self, grid_2d: np.ndarray, lats: np.ndarray, lons: np.ndarray) -> Dict[str, float]:
        """
        Computes area-weighted spatial mean for all 36 subdivisions in one pass.
        """
        results = {}
        for sub_id in self.subdivisions:
            val = self.aggregate_field(grid_2d, lats, lons, sub_id)
            results[sub_id] = round(val, 2)
        return results
