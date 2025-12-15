import apiClient from './client';
import { Course, PaginatedResponse } from '@/types';

export const courseApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Course>>('/courses', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ data: Course }>(`/courses/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Course>) => {
    const response = await apiClient.post<{ data: Course }>('/courses', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Course>) => {
    const response = await apiClient.put<{ data: Course }>(`/courses/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/courses/${id}`);
  },
};

