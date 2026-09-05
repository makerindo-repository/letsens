import { apiClient, ApiResponse } from './client';

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  status: 'success' | 'warning' | 'error';
  ip: string;
  details?: string;
}

export const activityLogApi = {
  // Get all activity logs
  getAll: (params?: { search?: string; module?: string; status?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.module) query.append('module', params.module);
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<ActivityLogItem[]>(`/activity-logs${queryString}`);
  },

  // Record a new activity log
  record: (log: { action: string; module?: string; status?: 'success' | 'warning' | 'error'; user?: string; details?: string }) =>
    apiClient.post<ActivityLogItem>('/activity-logs', log),

  // Clear all logs
  clear: () =>
    apiClient.delete<null>('/activity-logs'),
};
