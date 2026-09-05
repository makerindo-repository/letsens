import { apiClient } from './client';
import { IotDevice } from '../types';

export const iotDeviceApi = {
  getAllDevices: (params?: { status?: string; building?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<IotDevice[]>(`/iot-devices${query ? `?${query}` : ''}`);
  },
  getDeviceById: (id: string) => apiClient.get<IotDevice>(`/iot-devices/${id}`),
  createDevice: (data: Partial<IotDevice>) => apiClient.post<IotDevice>('/iot-devices', data),
  updateDevice: (id: string, data: Partial<IotDevice>) => apiClient.put<IotDevice>(`/iot-devices/${id}`, data),
  deleteDevice: (id: string) => apiClient.delete<void>(`/iot-devices/${id}`),
  rebootDevice: (id: string) => apiClient.post<IotDevice>(`/iot-devices/${id}/reboot`),
  calibrateDevice: (id: string) => apiClient.post<IotDevice>(`/iot-devices/${id}/calibrate`),
  otaUpdateDevice: (id: string) => apiClient.post<IotDevice>(`/iot-devices/${id}/ota-update`),
};
