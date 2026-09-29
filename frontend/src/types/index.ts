export type DataMode = 'REAL' | 'REPLAY' | 'DEMO';
export type Mode = DataMode;

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export type OperationalPriority = 
  | 'LOW' 
  | 'MONITOR' 
  | 'HIGH — REVIEW' 
  | 'CRITICAL — INSPECTION REQUIRED';

export interface DriverDetail {
  driver_name: string;
  severity: 'HIGH' | 'MODERATE' | 'LOW';
  metric_value: number;
  benchmark_value: number;
  description: string;
}

export interface HistoricalAnalogue {
  analogue_id: string;
  event_name: string;
  historical_date: string;
  region_id: string;
  region_name: string;
  lead_time_days: number;
  similarity_score: number;
  forecast_synoptic_setup: string;
  actual_outcome: string;
  was_bust: boolean;
  observed_error_mm: number;
  bias_direction?: 'UNDERFORECAST' | 'OVERFORECAST' | 'NEUTRAL';
}

export interface AnalogueErrorSummary {
  analogue_count: number;
  historical_bust_rate: number;
  mean_observed_error_mm: number;
  dominant_bias_direction: string;
  summary_text: string;
}

export interface ShapAttribution {
  feature_name: string;
  display_name: string;
  attribution_value: number;
  abs_magnitude: number;
  direction: 'INCREASES_BUST_RISK' | 'REDUCES_BUST_RISK';
  feature_input_value: number;
}

export type Prediction = PredictionDetail;

export interface PredictionDetail {
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
  prototype_badge: string;
  demo_bust_probability: number;
  calibrated_probability_estimate: number;
  confidence?: number;
  confidence_score_pct?: number;
  risk_level: RiskLevel;
  expected_error_range: [number, number];
  prototype_uncertainty_interval: [number, number];
  conformal_interval_90: [number, number];
  confidence_tier: string;
  ensemble_spread: number;
  inter_model_disagreement: number;
  historical_skill_at_lead: number;
  spatial_gradient_instability: number;
  why_distrust_drivers: DriverDetail[];
  shap_attributions?: ShapAttribution[];
  historical_analogues: HistoricalAnalogue[];
  analogue_error_summary?: AnalogueErrorSummary;
  operational_priority: OperationalPriority;
  recommended_action: string;
  model_name: string;
  data_mode: DataMode;
  provenance_hash: string;
}

export interface RegionLeadCell {
  region_id: string;
  region_name: string;
  lead_time_days: number;
  bust_probability: number;
  confidence: number;
  confidence_score_pct: number;
  risk_level: string;
  forecast_value: number;
  ensemble_spread: number;
  inter_model_difference: number;
}

export interface RegionLeadMatrixResponse {
  initialization_time: string;
  variable: string;
  lead_days: number[];
  regions_count: number;
  lead_summary: {
    lead_time_days: number;
    mean_bust_probability: number;
    mean_confidence: number;
  }[];
  matrix: RegionLeadCell[];
}

export interface PriorityQueueItem {
  rank: number;
  region_id: string;
  region_name: string;
  lead_time_days: number;
  bust_probability: number;
  risk_level: RiskLevel;
  expected_error_str: string;
  top_driver: string;
  operational_priority: OperationalPriority;
  recommended_action: string;
}

export interface ReplayEventStep {
  step_lead: string;
  lead_time_days: number;
  valid_date: string;
  as_of_cutoff_utc?: string;
  forecast_source?: string;
  observation_source?: string;
  units?: string;
  forecast_rainfall_mm: number;
  bust_risk_percent: number;
  risk_level: RiskLevel;
  ensemble_spread_mm: number;
  multi_model_disagreement: number;
  historical_similarity: number;
  priority: OperationalPriority;
  why_distrust_summary: string;
  prototype_badge?: string;
  prototype_uncertainty_interval?: [number, number];
  leakage_guard_verified: boolean;
  actual_outcome_revealed: boolean;
  observed_rainfall_mm: number | null;
  bust_occurred: boolean | null;
  error_calculation_trace?: string | null;
}

export interface HistoricalReplayEvent {
  event_id: string;
  event_name: string;
  event_category: string;
  start_date: string;
  event_date: string;
  target_region_id: string;
  target_region_name: string;
  coordinates_lat_lon?: [number, number];
  forecast_source?: string;
  observation_source?: string;
  units?: string;
  synoptic_description: string;
  post_event_analysis: string;
  error_derivation_formula?: string;
  steps: ReplayEventStep[];
}

export interface ForecasterFeedbackRecord {
  feedback_id?: string;
  prediction_id: string;
  forecast_id: string;
  region_id: string;
  lead_time_days: number;
  user_name: string;
  user_role: string;
  decision: 'CONFIRM' | 'REJECT' | 'NEEDS_REVIEW';
  decision_reason: string;
  observed_actual_value?: number | null;
  notes?: string | null;
  timestamp?: string;
}

export interface ProviderInfo {
  name?: string;
  status: 'active' | 'connected' | 'partial' | 'not_connected';
  type: string;
  agency: string;
  resolution: string;
  update_cycle?: string;
  is_connected: boolean;
  access_note?: string;
  message?: string;
}

export interface SystemMonitoringStatus {
  overall_status: string;
  data_mode: DataMode;
  last_cycle_timestamp: string;
  active_providers_count: number;
  total_predictions_evaluated: number;
  observed_drift_index: number;
  drift_status_note: string;
  active_providers: Record<string, ProviderInfo>;
}

export interface RealtimeDisagreementItem {
  region_id: string;
  region_name: string;
  lead_time_days: number;
  gfs_forecast_mm: number;
  aifs_forecast_mm: number;
  discrepancy_mm: number;
  agreement_level: string;
  recommendation: string;
}

export interface RealtimeDisagreementResponse {
  feature_name: string;
  reference_run_utc: string;
  lead_time_days: number;
  variable: string;
  active_models: Array<{ model: string; agency: string; resolution: string; status: string }>;
  excluded_models: Array<{ model: string; agency: string; status: string; reason: string }>;
  max_discrepancy_region: string;
  max_discrepancy_mm: number;
  disagreements: RealtimeDisagreementItem[];
}
