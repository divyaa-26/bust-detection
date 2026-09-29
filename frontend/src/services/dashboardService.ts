import { fetchClient } from './apiClient';
import type { Prediction } from '../types';

export interface RiskMapResponse {
  initialization_time: string;
  valid_date: string;
  lead_time_days: number;
  variable: string;
  data_mode: string;
  predictions: Prediction[];
}

export const getRiskMap = async (leadTimeDays: number = 5): Promise<RiskMapResponse> => {
  return fetchClient<RiskMapResponse>(`/api/risk-map?lead_time_days=${leadTimeDays}`);
};
