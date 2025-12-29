import apiClient from './client';
import { LoginCredentials, AuthResponse, User } from '@/types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await apiClient.post<{ success: boolean; data: { token: string } }>('/auth/refresh', {
      refreshToken,
    });
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data;
  },

  register: async (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data;
  },

  updateProfile: async (data: {
    name?: string;
    email?: string;
  }): Promise<User> => {
    const response = await apiClient.put<{ success: boolean; data: User }>('/auth/profile', data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await apiClient.put('/auth/password', data);
  },
};


