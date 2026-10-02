import {
  PredictionDetail,
  PriorityQueueItem,
  HistoricalReplayEvent,
  ForecasterFeedbackRecord,
  SystemMonitoringStatus
} from '../types';

const getBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://127.0.0.1:8000/api';
  }
  return '/api';
};

const BASE_URL = getBaseUrl();

async function fetchWithFallback(endpoint: string, options?: RequestInit): Promise<Response> {
  const primaryUrl = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(primaryUrl, options);
    if (res.ok) return res;
    if (!primaryUrl.startsWith('http://127.0.0.1:8000') && !primaryUrl.startsWith('http://localhost:8000')) {
      const fallbackUrl = `http://127.0.0.1:8000/api${endpoint}`;
      const fallbackRes = await fetch(fallbackUrl, options);
      if (fallbackRes.ok) return fallbackRes;
    }
    return res;
  } catch (err) {
    if (!primaryUrl.startsWith('http://127.0.0.1:8000') && !primaryUrl.startsWith('http://localhost:8000')) {
      const fallbackUrl = `http://127.0.0.1:8000/api${endpoint}`;
      return await fetch(fallbackUrl, options);
    }
    throw err;
  }
}

export const api = {
  async getHealth() {
    const res = await fetchWithFallback('/health');
    return res.json();
  },

  async getConfig() {
    const res = await fetchWithFallback('/config');
    return res.json();
  },

  async getRegions() {
    const res = await fetchWithFallback('/regions');
    return res.json();
  },

  async getRiskMap(leadTimeDays: number = 5, variable: string = 'precipitation_mm_day', forecastRun: string = '2024-07-15T00:00:00Z'): Promise<{
    initialization_time: string;
    valid_date: string;
    lead_time_days: number;
    variable: string;
    data_mode: string;
    active_models: string[];
    disconnected_models: string[];
    predictions: PredictionDetail[];
  }> {
    const res = await fetchWithFallback(`/risk-map?lead_time_days=${leadTimeDays}&variable=${variable}&forecast_run=${forecastRun}`);
    if (!res.ok) throw new Error(`Failed to fetch risk map: HTTP ${res.status}`);
    return res.json();
  },

  async getPriorityQueue(leadTimeDays: number = 5, variable: string = 'precipitation_mm_day'): Promise<PriorityQueueItem[]> {
    const res = await fetchWithFallback(`/priority?lead_time_days=${leadTimeDays}&variable=${variable}`);
    if (!res.ok) throw new Error(`Failed to fetch priority queue: HTTP ${res.status}`);
    return res.json();
  },

  async getPredictionDetail(predictionId: string, leadTimeDays: number = 5): Promise<{
    prediction: PredictionDetail;
    governance: any;
    baselines: any;
  }> {
    const res = await fetchWithFallback(`/predictions/${predictionId}?lead_time_days=${leadTimeDays}`);
    if (!res.ok) throw new Error(`Failed to fetch prediction detail: HTTP ${res.status}`);
    return res.json();
  },

  async getHistoricalEvents(): Promise<HistoricalReplayEvent[]> {
    const res = await fetchWithFallback('/events');
    if (!res.ok) throw new Error(`Failed to fetch historical events: HTTP ${res.status}`);
    return res.json();
  },

  async getHistoricalEventDetail(eventId: string): Promise<HistoricalReplayEvent> {
    const res = await fetchWithFallback(`/events/${eventId}`);
    if (!res.ok) throw new Error(`Failed to fetch event detail: HTTP ${res.status}`);
    return res.json();
  },

  async getModelMetrics(): Promise<any> {
    const res = await fetchWithFallback('/model/metrics');
    if (!res.ok) throw new Error(`Failed to fetch model metrics: HTTP ${res.status}`);
    return res.json();
  },

  async getRealtimeDisagreement(leadTimeDays: number = 5, variable: string = 'precipitation_mm_day'): Promise<any> {
    const res = await fetchWithFallback(`/realtime/disagreement?lead_time_days=${leadTimeDays}&variable=${variable}`);
    if (!res.ok) throw new Error(`Failed to fetch realtime disagreement: HTTP ${res.status}`);
    return res.json();
  },

  async getMonitoringStatus(): Promise<SystemMonitoringStatus> {
    const res = await fetchWithFallback('/monitoring');
    if (!res.ok) throw new Error(`Failed to fetch monitoring status: HTTP ${res.status}`);
    return res.json();
  },

  async submitFeedback(data: any): Promise<ForecasterFeedbackRecord> {
    const res = await fetchWithFallback('/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to submit feedback: HTTP ${res.status}`);
    return res.json();
  },

  async getFeedbackList(): Promise<ForecasterFeedbackRecord[]> {
    const res = await fetchWithFallback('/feedback');
    if (!res.ok) throw new Error(`Failed to fetch feedback: HTTP ${res.status}`);
    return res.json();
  },

  async getRegionLeadMatrix(variable: string = 'precipitation_mm_day', forecastRun: string = '2024-07-15T00:00:00Z') {
    const cacheKey = `${variable}_${forecastRun}`;
    if (!regionLeadMatrixCache.has(cacheKey)) {
      const promise = fetchWithFallback(`/matrix/region-lead?variable=${variable}&forecast_run=${forecastRun}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`Failed to fetch region lead matrix: HTTP ${res.status}`);
          return res.json();
        })
        .catch((err) => {
          regionLeadMatrixCache.delete(cacheKey);
          throw err;
        });
      regionLeadMatrixCache.set(cacheKey, promise);
    }
    return regionLeadMatrixCache.get(cacheKey)!;
  }
};

const regionLeadMatrixCache = new Map<string, Promise<any>>();
