import { fetchClient } from './apiClient';

export interface HistoricalReplayEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  synoptic_description: string;
  event_category: string;
  target_region_name: string;
}

export const getEvents = async (): Promise<HistoricalReplayEvent[]> => {
  return fetchClient<HistoricalReplayEvent[]>('/api/events');
};
