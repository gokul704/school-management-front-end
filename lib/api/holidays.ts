import apiClient from './client';
import { Holiday } from '@/types';

export const holidaysApi = {
  getAll: async (params?: { startDate?: string; endDate?: string; type?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<{ success: boolean; data: Holiday[]; pagination?: any }>('/holidays', { params });
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return (response.data as any).data || { data: [], pagination: {} };
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Holiday }>(`/holidays/${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    holidayType?: 'holiday' | 'festival' | 'exam' | 'break' | 'other';
    isRecurring?: boolean;
    recurringPattern?: string;
  }) => {
    const response = await apiClient.post<{ success: boolean; data: Holiday }>('/holidays', data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  update: async (id: string, data: Partial<Holiday>) => {
    const response = await apiClient.put<{ success: boolean; data: Holiday }>(`/holidays/${id}`, data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean }>(`/holidays/${id}`);
    return response.data;
  },
};

