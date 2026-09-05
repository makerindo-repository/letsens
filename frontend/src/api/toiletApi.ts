import { apiClient } from './client';
import { ToiletBilik } from '../types';

export const toiletApi = {
  getAllToilets: (params?: { building?: string; gender?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<ToiletBilik[]>(`/toilets${query ? `?${query}` : ''}`);
  },
  getToiletById: (id: string) => apiClient.get<ToiletBilik>(`/toilets/${id}`),
  createToilet: (data: Partial<ToiletBilik>) => apiClient.post<ToiletBilik>('/toilets', data),
  updateToilet: (id: string, data: Partial<ToiletBilik>) => apiClient.put<ToiletBilik>(`/toilets/${id}`, data),
  deleteToilet: (id: string) => apiClient.delete<void>(`/toilets/${id}`),
};
