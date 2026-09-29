import React, { useEffect, useState, useMemo } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RISK_THRESHOLDS } from '../constants';
import { useAppContext } from '../store';
import { getRiskMap } from '../services/dashboardService';
import type { Prediction } from '../types';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const MapComponent: React.FC = () => {
  const { mode, activeSubdivision, setActiveSubdivision, setActiveRegionData, leadTimeDays } = useAppContext();
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  
  const [geoJson, setGeoJson] = useState<any>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load geojson and risk map
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load basemap GeoJSON
        const res = await fetch('/india_subdivisions.json');
        const baseGeoJson = await res.json();
        
        // Fetch API risk map data
        const riskData = await getRiskMap(leadTimeDays);
        setPredictions(riskData.predictions);

        // Merge properties
        const mergedFeatures = baseGeoJson.features.map((feature: any) => {
          const regionId = feature.properties.subdivision_id || feature.properties.region_id || feature.properties.subdivisionCode;
          const pred = riskData.predictions.find(p => p.region_id === regionId);
          
          if (pred) {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                ...pred
              }
            };
          }
          return feature;
        });

        setGeoJson({ type: 'FeatureCollection', features: mergedFeatures });
      } catch (err) {
        console.error("Failed to load map data", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [mode, leadTimeDays]);

  const onHover = (event: any) => {
    const { features, lngLat } = event;
    const hoveredFeature = features && features[0];
    if (hoveredFeature && hoveredFeature.properties.prediction_id) {
      setHoverInfo({
        longitude: lngLat.lng,
        latitude: lngLat.lat,
        feature: hoveredFeature
      });
    } else {
      setHoverInfo(null);
    }
  };

  const onClick = (event: any) => {
    const { features } = event;
    const clickedFeature = features && features[0];
    if (clickedFeature && clickedFeature.properties.region_id) {
      setActiveSubdivision(clickedFeature.properties.region_id);
      setActiveRegionData(clickedFeature.properties);
    } else {
      setActiveSubdivision(null);
      setActiveRegionData(null);
    }
  };

  if (loading || !geoJson) {
    return <div className="w-full h-full flex items-center justify-center text-outline">Loading Intelligence Grid...</div>;
  }

  return (
    <div className="w-full h-full relative">
      <Map
        initialViewState={{
          longitude: 80,
          latitude: 22,
          zoom: 3.5
        }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={['subdivisions-fill']}
        onMouseMove={onHover}
        onClick={onClick}
        cursor={hoverInfo ? 'pointer' : 'grab'}
      >
        <Source id="subdivisions" type="geojson" data={geoJson}>
          <Layer
            id="subdivisions-fill"
            type="fill"
            paint={{
              'fill-color': [
                'match',
                ['get', 'risk_level'],
                'LOW', RISK_THRESHOLDS.LOW.color,
                'MODERATE', RISK_THRESHOLDS.MODERATE.color,
                'HIGH', RISK_THRESHOLDS.HIGH.color,
                'SEVERE', RISK_THRESHOLDS.SEVERE.color,
                '#333333' // fallback
              ],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.8,
                0.5
              ]
            }}
          />
          <Layer
            id="subdivisions-line"
            type="line"
            paint={{
              'line-color': '#1a1d24',
              'line-width': 1
            }}
          />
        </Source>

        {hoverInfo && (
          <Popup
            longitude={hoverInfo.longitude}
            latitude={hoverInfo.latitude}
            closeButton={false}
            className="z-50"
            anchor="bottom"
          >
            <div className="bg-surface-container-high border border-outline-variant p-space-sm rounded shadow-lg text-on-surface font-body-sm min-w-[220px]">
              <div className="font-label-caps uppercase text-outline mb-1 border-b border-outline-variant pb-1 flex justify-between">
                <span>{hoverInfo.feature.properties.region_name}</span>
                <span className="text-secondary">{hoverInfo.feature.properties.region_id}</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 mt-2 items-center">
                <span className="text-outline">Risk Prob:</span>
                <span className="font-mono-data font-bold text-right" style={{
                  color: RISK_THRESHOLDS[hoverInfo.feature.properties.risk_level as keyof typeof RISK_THRESHOLDS]?.color
                }}>
                  {(hoverInfo.feature.properties.calibrated_probability_estimate * 100).toFixed(1)}%
                </span>
                
                <span className="text-outline">Forecast:</span>
                <span className="font-mono-data text-primary-fixed text-right">
                  {hoverInfo.feature.properties.forecast_value.toFixed(1)} {hoverInfo.feature.properties.units}
                </span>
                
                <span className="text-outline">Ensemble Spread:</span>
                <span className="font-mono-data text-secondary text-right">
                  ±{hoverInfo.feature.properties.ensemble_spread.toFixed(1)}
                </span>

                <span className="text-outline">Disagreement:</span>
                <span className="font-mono-data text-error text-right">
                  Δ {hoverInfo.feature.properties.inter_model_disagreement.toFixed(1)}
                </span>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default MapComponent;
