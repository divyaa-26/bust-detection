import { fetchClient } from './apiClient';

export interface ModelMetricsResponse {
  status: string;
  honesty_notice: string;
  calibration: any;
  active_model_info: {
    name: string;
    version: string;
    type: string;
    description: string;
  };
}

export const getModelMetrics = async (): Promise<ModelMetricsResponse> => {
  return fetchClient<ModelMetricsResponse>('/api/model/metrics');
};
