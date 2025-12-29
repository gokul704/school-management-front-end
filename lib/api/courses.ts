import apiClient from './client';
import { Course, PaginatedResponse } from '@/types';

export const courseApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Course[]; pagination?: any }>('/courses', { params });
    // Handle both response formats
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ data: Course }>(`/courses/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Course>) => {
    const response = await apiClient.post<{ success: boolean; data: Course }>('/courses', data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data;
  },

  update: async (id: string, data: Partial<Course>) => {
    const response = await apiClient.put<{ success: boolean; data: Course }>(`/courses/${id}`, data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/courses/${id}`);
  },
};

