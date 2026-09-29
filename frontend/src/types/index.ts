export type Mode = 'REAL' | 'REPLAY' | 'DEMO';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export interface Prediction {
  prediction_id: string;
  region_id: string;
  region_name: string;
  center_lat: number;
  center_lon: number;
  lead_time_days: number;
  forecast_date: string;
  valid_date: string;
  variable: string;
  forecast_value: number;
  units: string;
  prototype_risk_score: number;
  calibrated_probability_estimate: number;
  risk_level: RiskLevel;
  ensemble_spread: number;
  inter_model_disagreement: number;
  operational_priority: string;
}

export interface RiskMapNode {
  subdivisionCode: string;
  polygonGeoJson: any; // GeoJSON feature
  currentRiskLevel: RiskLevel;
}

export interface ReplayEvent {
  id: string;
  name: string;
  date: string;
  description: string;
}

export interface DisagreementMetrics {
  timestamp: string;
  models: {
    name: string;
    value: number;
  }[];
  variance: number;
}
