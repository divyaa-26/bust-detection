import {
  PredictionDetail,
  PriorityQueueItem,
  HistoricalReplayEvent,
  ForecasterFeedbackRecord,
  SystemMonitoringStatus
} from '../types';

const BASE_URL = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  async getConfig() {
    const res = await fetch(`${BASE_URL}/config`);
    return res.json();
  },

  async getRegions() {
    const res = await fetch(`${BASE_URL}/regions`);
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
    const res = await fetch(`${BASE_URL}/risk-map?lead_time_days=${leadTimeDays}&variable=${variable}&forecast_run=${forecastRun}`);
    if (!res.ok) throw new Error('Failed to fetch risk map');
    return res.json();
  },

  async getPriorityQueue(leadTimeDays: number = 5, variable: string = 'precipitation_mm_day'): Promise<PriorityQueueItem[]> {
    const res = await fetch(`${BASE_URL}/priority?lead_time_days=${leadTimeDays}&variable=${variable}`);
    if (!res.ok) throw new Error('Failed to fetch priority queue');
    return res.json();
  },

  async getPredictionDetail(predictionId: string, leadTimeDays: number = 5): Promise<{
    prediction: PredictionDetail;
    governance: any;
    baselines: any;
  }> {
    const res = await fetch(`${BASE_URL}/predictions/${predictionId}?lead_time_days=${leadTimeDays}`);
    if (!res.ok) throw new Error('Failed to fetch prediction detail');
    return res.json();
  },

  async getHistoricalEvents(): Promise<HistoricalReplayEvent[]> {
    const res = await fetch(`${BASE_URL}/events`);
    if (!res.ok) throw new Error('Failed to fetch historical events');
    return res.json();
  },

  async getHistoricalEventDetail(eventId: string): Promise<HistoricalReplayEvent> {
    const res = await fetch(`${BASE_URL}/events/${eventId}`);
    if (!res.ok) throw new Error('Failed to fetch event detail');
    return res.json();
  },

  async getModelMetrics(): Promise<any> {
    const res = await fetch(`${BASE_URL}/model/metrics`);
    if (!res.ok) throw new Error('Failed to fetch model metrics');
    return res.json();
  },

  async getRealtimeDisagreement(leadTimeDays: number = 5, variable: string = 'precipitation_mm_day'): Promise<any> {
    const res = await fetch(`${BASE_URL}/realtime/disagreement?lead_time_days=${leadTimeDays}&variable=${variable}`);
    if (!res.ok) throw new Error('Failed to fetch realtime disagreement');
    return res.json();
  },

  async getMonitoringStatus(): Promise<SystemMonitoringStatus> {
    const res = await fetch(`${BASE_URL}/monitoring`);
    if (!res.ok) throw new Error('Failed to fetch monitoring status');
    return res.json();
  },

  async submitFeedback(data: any): Promise<ForecasterFeedbackRecord> {
    const res = await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return res.json();
  },

  async getFeedbackList(): Promise<ForecasterFeedbackRecord[]> {
    const res = await fetch(`${BASE_URL}/feedback`);
    if (!res.ok) throw new Error('Failed to fetch feedback');
    return res.json();
  },

  async getRegionLeadMatrix(variable: string = 'precipitation_mm_day', forecastRun: string = '2024-07-15T00:00:00Z') {
    const res = await fetch(`${BASE_URL}/matrix/region-lead?variable=${variable}&forecast_run=${forecastRun}`);
    if (!res.ok) throw new Error('Failed to fetch region lead matrix');
    return res.json();
  }
};
