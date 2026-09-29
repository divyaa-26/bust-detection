import { fetchClient } from './apiClient';

export interface SystemStatusResponse {
  timestamp: string;
  data_mode: string;
  system_health: string;
  active_providers: any;
  latency_ms: number;
}

export const getSystemMonitoring = async (): Promise<SystemStatusResponse> => {
  return fetchClient<SystemStatusResponse>('/api/monitoring');
};
