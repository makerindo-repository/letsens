import { apiClient } from './client';
import { SensorTelemetryRecord } from '../types';

export const telemetryApi = {
  getLatestLogs: (toiletCode?: string) => {
    return apiClient.get<SensorTelemetryRecord[]>(`/sensor-logs/latest${toiletCode ? `?toilet_code=${toiletCode}` : ''}`);
  },
  getHistoryLogs: (params?: { toilet_code?: string; status_condition?: string; per_page?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<any>(`/sensor-logs/history${query ? `?${query}` : ''}`);
  },
  injectTelemetry: (data: Partial<SensorTelemetryRecord>) => {
    return apiClient.post<SensorTelemetryRecord>('/sensor-logs', data);
  },
};
