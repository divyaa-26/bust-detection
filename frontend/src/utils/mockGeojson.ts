import type { RiskLevel } from '../types';

export const generateMockSubdivisions = () => {
  const features = [];
  const minLng = 68;
  const maxLng = 97;
  const minLat = 8;
  const maxLat = 36;
  
  const cols = 6;
  const rows = 6;
  
  const lngStep = (maxLng - minLng) / cols;
  const latStep = (maxLat - minLat) / rows;
  
  let id = 1;
  
  const riskLevels: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'SEVERE'];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lng1 = minLng + c * lngStep;
      const lat1 = minLat + r * latStep;
      const lng2 = lng1 + lngStep;
      const lat2 = lat1 + latStep;
      
      // Assign random risk score
      const riskScore = Math.floor(Math.random() * 100);
      let riskLevel: RiskLevel = 'LOW';
      if (riskScore >= 75) riskLevel = 'SEVERE';
      else if (riskScore >= 50) riskLevel = 'HIGH';
      else if (riskScore >= 28) riskLevel = 'MODERATE';
      
      features.push({
        type: 'Feature',
        id: id,
        properties: {
          subdivisionCode: `IMD-SUB-${id}`,
          name: `Mock Subdivision ${id}`,
          riskScore,
          riskLevel,
          forecastValue: (Math.random() * 100).toFixed(2),
          ensembleSpread: (Math.random() * 10).toFixed(2)
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng1, lat1],
            [lng2, lat1],
            [lng2, lat2],
            [lng1, lat2],
            [lng1, lat1]
          ]]
        }
      });
      id++;
    }
  }
  
  return {
    type: 'FeatureCollection',
    features
  };
};
