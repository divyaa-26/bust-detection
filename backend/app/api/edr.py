from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.providers.demo_provider import DemoProvider
from app.schemas.models import ForecastVariable

edr_router = APIRouter(prefix="/edr", tags=["OGC API-EDR-Style Endpoints (Modeled on OGC API-EDR)"])

@edr_router.get("/collections")
def get_collections():
    return {
        "standard_alignment": "Modeled on OGC API - Environmental Data Retrieval (EDR) Part 1 Core (Informational Prototype)",
        "conformance_notice": "OGC API-EDR-style / modeled on OGC API-EDR; formal compliance testing pending MoES Stage 2",
        "collections": [
            {
                "id": "forecast-bust",
                "title": "Medium-Range Forecast Bust Risk & Reliability Intelligence (EDR-Style)",
                "description": "Spatio-temporal forecast bust probabilities and prototype uncertainty intervals over India",
                "extent": {
                    "spatial": {"bbox": [[68.0, 8.0, 97.5, 37.0]]},
                    "temporal": {"interval": [["2022-01-01T00:00:00Z", None]]}
                },
                "data_queries": {
                    "position": {"link": {"href": "/edr/collections/forecast-bust/position"}},
                    "area": {"link": {"href": "/edr/collections/forecast-bust/area"}}
                }
            }
        ]
    }

@edr_router.get("/collections/forecast-bust/position")
def query_position(
    coords: str = Query(..., description="WKT or POINT format: POINT(lon lat) e.g. POINT(70.3 22.3)"),
    lead_time_days: int = Query(5, ge=1, le=10),
    variable: ForecastVariable = Query(ForecastVariable.PRECIPITATION)
):
    """OGC EDR Position Query for a specific lat/lon coordinate in India."""
    try:
        clean = coords.replace("POINT(", "").replace(")", "").strip()
        lon_s, lat_s = clean.split()
        lon, lat = float(lon_s), float(lat_s)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid coordinates format. Use POINT(lon lat), e.g. POINT(72.0 23.0)")
        
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": {
            "query_type": "OGC_EDR_Position",
            "lead_time_days": lead_time_days,
            "variable": variable.value,
            "estimated_bust_risk": 0.68,
            "expected_error_range_mm": [35.0, 68.0],
            "operational_priority": "HIGH — REVIEW",
            "active_models": ["GFS", "AIFS"]
        }
    }

@edr_router.get("/collections/forecast-bust/area")
def query_area(
    bbox: str = Query(..., description="Bounding box minLon,minLat,maxLon,maxLat e.g. 68.0,20.0,75.0,25.0"),
    lead_time_days: int = Query(5, ge=1, le=10)
):
    """OGC EDR Area Query for bounding box polygon."""
    return {
        "type": "FeatureCollection",
        "properties": {
            "query_type": "OGC_EDR_Area",
            "bbox_queried": bbox,
            "lead_time_days": lead_time_days
        },
        "features": []
    }
