import { apiClient } from './client';
import { PerlengkapanItem } from '../types';

export const supplyApi = {
  getAllSupplies: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<PerlengkapanItem[]>(`/supplies${query ? `?${query}` : ''}`);
  },
  getSupplyById: (id: string) => apiClient.get<PerlengkapanItem>(`/supplies/${id}`),
  createSupply: (data: Partial<PerlengkapanItem>) => apiClient.post<PerlengkapanItem>('/supplies', data),
  updateSupply: (id: string, data: Partial<PerlengkapanItem>) => apiClient.put<PerlengkapanItem>(`/supplies/${id}`, data),
  adjustStock: (id: string, stock: number) => apiClient.patch<PerlengkapanItem>(`/supplies/${id}/stock`, { stock }),
  deleteSupply: (id: string) => apiClient.delete<void>(`/supplies/${id}`),
};
