import { fetchClient } from './apiClient';

export interface PriorityQueueItem {
  rank: number;
  region_id: string;
  region_name: string;
  lead_time_days: number;
  bust_probability: number;
  risk_level: string;
  expected_error_str: string;
  top_driver: string;
  operational_priority: string;
  recommended_action: string;
}

export const getPriorityQueue = async (leadTimeDays: number = 5): Promise<PriorityQueueItem[]> => {
  return fetchClient<PriorityQueueItem[]>(`/api/priority?lead_time_days=${leadTimeDays}`);
};
