import { apiClient, ApiResponse } from './client';

export interface SettingsGroup {
  [key: string]: string;
}

export interface AllSettings {
  system: SettingsGroup;
  app: SettingsGroup;
}

export const settingsApi = {
  // Get all settings grouped
  getAll: () => apiClient.get<AllSettings>('/settings'),

  // Get settings by group (system / app / mqtt)
  getByGroup: (group: string) => apiClient.get<SettingsGroup>(`/settings/${group}`),

  // Update settings for a group
  updateGroup: (group: string, data: SettingsGroup) =>
    apiClient.put<SettingsGroup>(`/settings/${group}`, data),

  // Test MQTT connection
  testMqtt: (host: string, port: number, topic: string) =>
    apiClient.post<{ connected: boolean }>('/settings/mqtt/test', { host, port, topic }),

  // Test Gemini API key validity against Google AI Studio
  testGeminiKey: (apiKey: string) =>
    apiClient.post<{ status: string; model?: string }>('/settings/gemini/test', { api_key: apiKey }),
};
