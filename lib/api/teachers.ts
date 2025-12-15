import apiClient from './client';
import { Teacher, PaginatedResponse, Schedule } from '@/types';

export const teacherApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Teacher>>('/teachers', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ data: Teacher }>(`/teachers/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Teacher>) => {
    const response = await apiClient.post<{ data: Teacher }>('/teachers', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Teacher>) => {
    const response = await apiClient.put<{ data: Teacher }>(`/teachers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/teachers/${id}`);
  },

  getSchedule: async (teacherId: string) => {
    const response = await apiClient.get<{ data: Schedule[] }>(`/teachers/${teacherId}/schedule`);
    return response.data.data;
  },
};

