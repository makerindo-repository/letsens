import { apiClient } from './client';
import { JadwalPemeliharaanItem, RekapKerusakanItem, RekapPerbaikanItem } from '../types';

export const maintenanceApi = {
  // Maintenance Schedules
  getSchedules: (params?: { status?: string; type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<JadwalPemeliharaanItem[]>(`/schedules${query ? `?${query}` : ''}`);
  },
  createSchedule: (data: Partial<JadwalPemeliharaanItem>) => apiClient.post<JadwalPemeliharaanItem>('/schedules', data),
  updateSchedule: (scheduleId: string, data: Partial<JadwalPemeliharaanItem>) => apiClient.put<JadwalPemeliharaanItem>(`/schedules/${scheduleId}`, data),
  deleteSchedule: (scheduleId: string) => apiClient.delete(`/schedules/${scheduleId}`),
  toggleChecklist: (scheduleId: string, taskIndex: number) => {
    return apiClient.patch<JadwalPemeliharaanItem>(`/schedules/${scheduleId}/checklist`, { task_index: taskIndex });
  },
  completeSchedule: (scheduleId: string) => apiClient.post<JadwalPemeliharaanItem>(`/schedules/${scheduleId}/complete`),

  // Damage Reports
  getDamages: (params?: { severity?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<RekapKerusakanItem[]>(`/damages${query ? `?${query}` : ''}`);
  },
  createDamage: (data: Partial<RekapKerusakanItem>) => apiClient.post<RekapKerusakanItem>('/damages', data),
  updateDamage: (damageId: string, data: Partial<RekapKerusakanItem>) => apiClient.put<RekapKerusakanItem>(`/damages/${damageId}`, data),
  deleteDamage: (damageId: string) => apiClient.delete(`/damages/${damageId}`),
  dispatchToRepair: (damageId: string, technicianName?: string) => {
    return apiClient.post<{ damage: RekapKerusakanItem; repair: RekapPerbaikanItem }>(`/damages/${damageId}/dispatch`, { technician_name: technicianName });
  },

  // Repair Tickets
  getRepairs: (params?: { status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<RekapPerbaikanItem[]>(`/repairs${query ? `?${query}` : ''}`);
  },
  createRepair: (data: Partial<RekapPerbaikanItem>) => apiClient.post<RekapPerbaikanItem>('/repairs', data),
  updateRepair: (repairId: string, data: Partial<RekapPerbaikanItem>) => apiClient.put<RekapPerbaikanItem>(`/repairs/${repairId}`, data),
  updateRepairStatus: (repairId: string, status: string) => apiClient.patch<RekapPerbaikanItem>(`/repairs/${repairId}/status`, { status }),
  deleteRepair: (repairId: string) => apiClient.delete(`/repairs/${repairId}`),
};

