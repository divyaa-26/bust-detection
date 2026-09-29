import json
from pathlib import Path

# 36 IMD Meteorological Subdivisions with realistic bounding boxes and coordinates
SUBDIVISIONS = [
    {"id": "SUB_01", "name": "Andaman & Nicobar Islands", "region": "South Peninsula", "lat": 11.74, "lon": 92.65, "terrain": "island", "box": [92.0, 93.5, 9.0, 13.5]},
    {"id": "SUB_02", "name": "Arunachal Pradesh", "region": "East & Northeast", "lat": 28.21, "lon": 94.72, "terrain": "himalayan", "box": [91.5, 97.4, 26.6, 29.5]},
    {"id": "SUB_03", "name": "Assam & Meghalaya", "region": "East & Northeast", "lat": 26.20, "lon": 92.93, "terrain": "hills_valleys", "box": [89.7, 95.8, 25.0, 27.9]},
    {"id": "SUB_04", "name": "Nagaland, Manipur, Mizoram & Tripura", "region": "East & Northeast", "lat": 24.81, "lon": 93.93, "terrain": "hills", "box": [91.1, 95.2, 21.9, 27.0]},
    {"id": "SUB_05", "name": "Sub-Himalayan West Bengal & Sikkim", "region": "East & Northeast", "lat": 27.03, "lon": 88.50, "terrain": "himalayan", "box": [87.9, 89.9, 26.0, 27.9]},
    {"id": "SUB_06", "name": "Gangetic West Bengal", "region": "East & Northeast", "lat": 22.98, "lon": 87.85, "terrain": "plains", "box": [86.5, 89.1, 21.5, 24.5]},
    {"id": "SUB_07", "name": "Odisha", "region": "East & Northeast", "lat": 20.95, "lon": 85.09, "terrain": "coastal_plateau", "box": [81.3, 87.5, 17.8, 22.6]},
    {"id": "SUB_08", "name": "Jharkhand", "region": "East & Northeast", "lat": 23.61, "lon": 85.27, "terrain": "plateau", "box": [83.3, 87.9, 21.9, 25.3]},
    {"id": "SUB_09", "name": "Bihar", "region": "East & Northeast", "lat": 25.09, "lon": 85.31, "terrain": "plains", "box": [83.3, 88.3, 24.3, 27.5]},
    {"id": "SUB_10", "name": "East Uttar Pradesh", "region": "Northwest", "lat": 26.50, "lon": 82.50, "terrain": "plains", "box": [80.5, 84.6, 24.0, 28.5]},
    {"id": "SUB_11", "name": "West Uttar Pradesh", "region": "Northwest", "lat": 27.80, "lon": 78.50, "terrain": "plains", "box": [77.0, 80.5, 25.5, 30.5]},
    {"id": "SUB_12", "name": "Uttarakhand", "region": "Northwest", "lat": 30.06, "lon": 79.01, "terrain": "himalayan", "box": [77.6, 81.1, 28.7, 31.4]},
    {"id": "SUB_13", "name": "Haryana, Chandigarh & Delhi", "region": "Northwest", "lat": 29.05, "lon": 76.08, "terrain": "plains", "box": [74.5, 77.6, 27.6, 30.9]},
    {"id": "SUB_14", "name": "Punjab", "region": "Northwest", "lat": 31.14, "lon": 75.34, "terrain": "plains", "box": [73.8, 76.9, 29.5, 32.5]},
    {"id": "SUB_15", "name": "Himachal Pradesh", "region": "Northwest", "lat": 31.90, "lon": 77.20, "terrain": "himalayan", "box": [75.6, 79.0, 30.4, 33.2]},
    {"id": "SUB_16", "name": "Jammu & Kashmir and Ladakh", "region": "Northwest", "lat": 34.08, "lon": 76.50, "terrain": "himalayan", "box": [73.5, 80.5, 32.2, 36.5]},
    {"id": "SUB_17", "name": "West Rajasthan", "region": "Northwest", "lat": 26.80, "lon": 72.00, "terrain": "arid_desert", "box": [69.5, 74.0, 24.5, 30.0]},
    {"id": "SUB_18", "name": "East Rajasthan", "region": "Northwest", "lat": 26.20, "lon": 75.80, "terrain": "semi_arid", "box": [74.0, 78.2, 23.5, 28.5]},
    {"id": "SUB_19", "name": "West Madhya Pradesh", "region": "Central", "lat": 23.30, "lon": 76.80, "terrain": "plateau", "box": [74.0, 78.5, 21.0, 26.8]},
    {"id": "SUB_20", "name": "East Madhya Pradesh", "region": "Central", "lat": 23.50, "lon": 80.50, "terrain": "plateau", "box": [78.5, 82.8, 21.5, 25.2]},
    {"id": "SUB_21", "name": "Gujarat Region", "region": "Northwest", "lat": 22.80, "lon": 73.00, "terrain": "plains_hills", "box": [71.8, 74.5, 20.0, 24.5]},
    {"id": "SUB_22", "name": "Saurashtra & Kutch", "region": "Northwest", "lat": 22.30, "lon": 70.30, "terrain": "coastal_arid", "box": [68.1, 72.2, 20.5, 24.8]},
    {"id": "SUB_23", "name": "Konkan & Goa", "region": "South Peninsula", "lat": 16.50, "lon": 73.50, "terrain": "coastal_ghats", "box": [72.5, 74.2, 14.8, 20.2]},
    {"id": "SUB_24", "name": "Madhya Maharashtra", "region": "Central", "lat": 18.50, "lon": 74.80, "terrain": "ghats_plateau", "box": [73.5, 76.5, 15.6, 21.5]},
    {"id": "SUB_25", "name": "Marathwada", "region": "Central", "lat": 19.10, "lon": 76.50, "terrain": "semi_arid_plateau", "box": [74.8, 77.9, 17.5, 20.8]},
    {"id": "SUB_26", "name": "Vidarbha", "region": "Central", "lat": 20.90, "lon": 79.20, "terrain": "plateau", "box": [76.5, 80.9, 19.5, 22.0]},
    {"id": "SUB_27", "name": "Chhattisgarh", "region": "Central", "lat": 21.27, "lon": 81.86, "terrain": "plateau_forests", "box": [80.2, 84.4, 17.8, 24.1]},
    {"id": "SUB_28", "name": "Coastal Andhra Pradesh & Yanam", "region": "South Peninsula", "lat": 16.20, "lon": 81.50, "terrain": "coastal", "box": [80.0, 84.5, 13.5, 19.2]},
    {"id": "SUB_29", "name": "Telangana", "region": "South Peninsula", "lat": 17.80, "lon": 79.10, "terrain": "plateau", "box": [77.2, 81.3, 15.8, 19.9]},
    {"id": "SUB_30", "name": "Rayalaseema", "region": "South Peninsula", "lat": 14.70, "lon": 78.50, "terrain": "semi_arid_plateau", "box": [76.8, 80.2, 12.6, 16.2]},
    {"id": "SUB_31", "name": "Tamil Nadu, Puducherry & Karaikal", "region": "South Peninsula", "lat": 11.12, "lon": 78.65, "terrain": "coastal_plains", "box": [76.2, 80.3, 8.1, 13.5]},
    {"id": "SUB_32", "name": "Coastal Karnataka", "region": "South Peninsula", "lat": 13.80, "lon": 74.80, "terrain": "coastal_ghats", "box": [74.0, 75.4, 12.7, 15.1]},
    {"id": "SUB_33", "name": "North Interior Karnataka", "region": "South Peninsula", "lat": 15.80, "lon": 76.00, "terrain": "plateau", "box": [74.3, 77.6, 14.4, 18.5]},
    {"id": "SUB_34", "name": "South Interior Karnataka", "region": "South Peninsula", "lat": 13.00, "lon": 76.50, "terrain": "plateau_ghats", "box": [75.0, 78.3, 11.6, 14.5]},
    {"id": "SUB_35", "name": "Kerala & Mahe", "region": "South Peninsula", "lat": 10.85, "lon": 76.27, "terrain": "coastal_ghats", "box": [74.8, 77.4, 8.3, 12.8]},
    {"id": "SUB_36", "name": "Lakshadweep", "region": "South Peninsula", "lat": 10.56, "lon": 72.64, "terrain": "island", "box": [71.5, 73.8, 8.2, 12.3]}
]

def make_polygon(box):
    min_lon, max_lon, min_lat, max_lat = box
    return [
        [
            [min_lon, min_lat],
            [max_lon, min_lat],
            [max_lon, max_lat],
            [min_lon, max_lat],
            [min_lon, min_lat]
        ]
    ]

def generate_geojson():
    features = []
    for sub in SUBDIVISIONS:
        feature = {
            "type": "Feature",
            "id": sub["id"],
            "properties": {
                "subdivision_id": sub["id"],
                "name": sub["name"],
                "macro_region": sub["region"],
                "center_lat": sub["lat"],
                "center_lon": sub["lon"],
                "terrain_type": sub["terrain"]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": make_polygon(sub["box"])
            }
        }
        features.append(feature)
        
    fc = {
        "type": "FeatureCollection",
        "name": "IMD_36_Meteorological_Subdivisions",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
        },
        "features": features
    }
    
    out_path = Path("/Users/divyatewari/Downloads/new sih product/backend/data/geojson/india_subdivisions.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(fc, f, indent=2)
    print(f"Generated {len(features)} subdivisions GeoJSON at {out_path}")

if __name__ == "__main__":
    generate_geojson()
