import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { PredictionDetail } from '../types';

interface MapLibreMapProps {
  predictions: PredictionDetail[];
  selectedRegionId: string;
  onSelectRegion: (regionId: string) => void;
  activeLayer: string; // 'bust_probability' | 'ensemble_spread' | 'model_disagreement' | 'forecast_value'
  leadTimeDays: number;
}

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  predictions,
  selectedRegionId,
  onSelectRegion,
  activeLayer,
  leadTimeDays
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [geojsonData, setGeojsonData] = useState<any>(null);

  // 1. Fetch GeoJSON boundaries
  useEffect(() => {
    fetch('/data/india_subdivisions.json')
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error('Failed to load subdivisions GeoJSON:', err));
  }, []);

  // 2. Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Use Carto Dark Matter style for high-contrast meteorological visualization
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [79.2, 22.8],
      zoom: 4.1,
      minZoom: 3.5,
      maxZoom: 9
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 3. Update GeoJSON Source & Layer with Prediction Data
  useEffect(() => {
    if (!map.current || !mapLoaded || !geojsonData) return;

    // Map predictions to region IDs
    const predMap = new Map<string, PredictionDetail>();
    predictions.forEach((p) => predMap.set(p.region_id, p));

    // Augment GeoJSON feature properties with current run's metrics
    const augmentedFeatures = geojsonData.features.map((feature: any) => {
      const subId = feature.properties.subdivision_id;
      const pred = predMap.get(subId);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          bust_prob: pred ? pred.calibrated_probability_estimate : 0.05,
          ensemble_spread: pred ? pred.ensemble_spread : 5.0,
          model_disagree: pred ? pred.inter_model_disagreement : 2.0,
          forecast_val: pred ? pred.forecast_value : 10.0,
          risk_level: pred ? pred.risk_level : 'LOW',
          priority: pred ? pred.operational_priority : 'LOW',
          expected_err: pred ? `${pred.expected_error_range[0]}–${pred.expected_error_range[1]} mm` : '--'
        }
      };
    });

    const enrichedGeoJSON = {
      ...geojsonData,
      features: augmentedFeatures
    };

    const source = map.current.getSource('india-subdivisions') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(enrichedGeoJSON);
    } else {
      map.current.addSource('india-subdivisions', {
        type: 'geojson',
        data: enrichedGeoJSON
      });

      // Add Choropleth Fill Layer
      map.current.addLayer({
        id: 'subdivisions-fill',
        type: 'fill',
        source: 'india-subdivisions',
        paint: {
          'fill-color': getFillColorExpression(activeLayer),
          'fill-opacity': 0.68
        }
      });

      // Add Polygon Boundary Line Layer
      map.current.addLayer({
        id: 'subdivisions-outline',
        type: 'line',
        source: 'india-subdivisions',
        paint: {
          'line-color': '#475569',
          'line-width': 1.2
        }
      });

      // Add Selected Region Highlight Layer
      map.current.addLayer({
        id: 'subdivisions-selected-outline',
        type: 'line',
        source: 'india-subdivisions',
        filter: ['==', 'subdivision_id', selectedRegionId || ''],
        paint: {
          'line-color': '#38BDF8',
          'line-width': 3.5
        }
      });

      // Setup Click & Hover Events
      map.current.on('click', 'subdivisions-fill', (e) => {
        if (e.features && e.features[0]) {
          const subId = e.features[0].properties.subdivision_id;
          onSelectRegion(subId);
        }
      });

      map.current.on('mouseenter', 'subdivisions-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'subdivisions-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    }

    // Update fill color and selection filter when active layer or selected region changes
    if (map.current.getLayer('subdivisions-fill')) {
      map.current.setPaintProperty('subdivisions-fill', 'fill-color', getFillColorExpression(activeLayer));
    }
    if (map.current.getLayer('subdivisions-selected-outline')) {
      map.current.setFilter('subdivisions-selected-outline', ['==', 'subdivision_id', selectedRegionId || '']);
    }
  }, [mapLoaded, geojsonData, predictions, activeLayer, selectedRegionId]);

  function getFillColorExpression(layerType: string): any {
    if (layerType === 'ensemble_spread') {
      return [
        'step',
        ['get', 'ensemble_spread'],
        '#0284c7', // < 8mm (sky blue)
        8, '#3b82f6', // 8-15mm (blue)
        15, '#f59e0b', // 15-22mm (amber)
        22, '#ef4444', // 22-28mm (red)
        28, '#b91c1c'  // > 28mm (deep red)
      ];
    } else if (layerType === 'model_disagreement') {
      return [
        'step',
        ['get', 'model_disagree'],
        '#10b981', // < 5mm (green - agreement)
        5, '#38bdf8',  // 5-10mm (blue)
        10, '#f59e0b', // 10-18mm (yellow)
        18, '#dc2626'  // > 18mm (discord)
      ];
    } else if (layerType === 'forecast_value') {
      return [
        'step',
        ['get', 'forecast_val'],
        '#334155', // < 2.5mm
        2.5, '#0284c7', // 2.5 - 15.5mm (Light)
        15.6, '#2563eb', // 15.6 - 64.4mm (Moderate)
        64.5, '#ea580c', // 64.5 - 115.5mm (Heavy)
        115.6, '#dc2626' // > 115.6mm (Very Heavy)
      ];
    } else {
      // Default: Bust Probability
      return [
        'step',
        ['get', 'bust_prob'],
        '#10b981', // < 0.28 (Low Risk - green)
        0.28, '#f59e0b', // 0.28 - 0.50 (Moderate - amber)
        0.50, '#ea580c', // 0.50 - 0.75 (High - orange)
        0.75, '#dc2626'  // > 0.75 (Severe Bust Risk - crimson)
      ];
    }
  }

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-800 bg-[#0B1120] shadow-inner">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-lg p-3 text-[11px] shadow-xl z-10 font-mono">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
          <span>{activeLayer === 'bust_probability' ? 'CALIBRATED P(BUST) RISK' : activeLayer.replace('_', ' ').toUpperCase()}</span>
          <span className="text-sky-400">D+{leadTimeDays}</span>
        </div>
        {activeLayer === 'bust_probability' ? (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#10b981]"></span>
              <span className="text-slate-200">Low Risk (&lt; 25% | Conf &gt; 75%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#f59e0b]"></span>
              <span className="text-slate-200">Moderate Risk (25–45%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#ea580c]"></span>
              <span className="text-slate-200">High Review (45–70%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#dc2626]"></span>
              <span className="text-slate-200">Critical Inspection (&gt; 70%)</span>
            </div>
          </div>
        ) : activeLayer === 'ensemble_spread' ? (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#0284c7]"></span>
              <span className="text-slate-200">&lt; 8 mm (Coherent)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#f59e0b]"></span>
              <span className="text-slate-200">15–22 mm (Spread)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#b91c1c]"></span>
              <span className="text-slate-200">&gt; 28 mm (Divergent)</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#10b981]"></span>
              <span className="text-slate-200">Model Consensus (&lt; 5mm)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#dc2626]"></span>
              <span className="text-slate-200">Inter-Model Discord (&gt; 18mm)</span>
            </div>
          </div>
        )}
        <div className="pt-2 mt-2 border-t border-slate-800 text-[10px] space-y-1">
          <div className="text-amber-400 font-bold tracking-tight">
            PROTOTYPE ESTIMATE — NOT TRAINED / VALIDATED
          </div>
          <div className="text-slate-500">
            Source: IMD 36 Subdivisions • MapLibre GL
          </div>
        </div>
      </div>
    </div>
  );
};
