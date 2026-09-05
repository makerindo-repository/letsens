import { apiClient, ApiResponse } from './client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  institution: string;
  profile_photo?: string | null;
}

export interface LoginResponseData {
  token: string;
  tokenType: string;
  user: AuthUser;
}

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponseData>> => {
    return apiClient.post<LoginResponseData>('/auth/login', { email, password });
  },
  me: async (): Promise<ApiResponse<AuthUser>> => {
    return apiClient.get<AuthUser>('/auth/me');
  },
  updateProfile: async (payload: { name: string; profile_photo?: string | null }): Promise<ApiResponse<{ status: string; user: AuthUser }>> => {
    return apiClient.put<{ status: string; user: AuthUser }>('/auth/profile', payload);
  },
  updatePassword: async (payload: { current_password: string; new_password: string; new_password_confirmation: string }): Promise<ApiResponse<{ status: string }>> => {
    return apiClient.put<{ status: string }>('/auth/password', payload);
  },
  logout: async (): Promise<ApiResponse<null>> => {
    return apiClient.post<null>('/auth/logout');
  },
};
