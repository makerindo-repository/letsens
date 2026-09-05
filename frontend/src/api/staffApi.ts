import { apiClient } from './client';
import { PetugasKebersihan } from '../types';

export const staffApi = {
  getAllStaff: (params?: { status?: string; shift?: string; building?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<PetugasKebersihan[]>(`/staff${query ? `?${query}` : ''}`);
  },
  getStaffById: (id: string) => apiClient.get<PetugasKebersihan>(`/staff/${id}`),
  createStaff: (data: Partial<PetugasKebersihan>) => apiClient.post<PetugasKebersihan>('/staff', data),
  updateStaff: (id: string, data: Partial<PetugasKebersihan>) => apiClient.put<PetugasKebersihan>(`/staff/${id}`, data),
  deleteStaff: (id: string) => apiClient.delete<void>(`/staff/${id}`),
  dispatchWhatsapp: (payload: { staff_name: string; phone: string; toilet_code: string; issue?: string }) => {
    return apiClient.post<{ targetPhone: string; whatsappUrl: string; messageText: string }>('/dispatch/whatsapp', payload);
  },
};
