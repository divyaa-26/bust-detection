import { fetchClient } from './apiClient';

export interface DisagreementItem {
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
  max_discrepancy_region: string;
  max_discrepancy_mm: number;
  disagreements: DisagreementItem[];
}

export const getRealtimeDisagreement = async (leadTimeDays: number = 5): Promise<RealtimeDisagreementResponse> => {
  return fetchClient<RealtimeDisagreementResponse>(`/api/realtime/disagreement?lead_time_days=${leadTimeDays}`);
};
