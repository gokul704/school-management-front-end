import apiClient from './client';
import { Student, PaginatedResponse, AcademicRecord } from '@/types';

export const studentApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Student>>('/students', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ data: Student }>(`/students/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Student>) => {
    const response = await apiClient.post<{ data: Student }>('/students', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Student>) => {
    const response = await apiClient.put<{ data: Student }>(`/students/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/students/${id}`);
  },

  getAcademicRecords: async (studentId: string) => {
    const response = await apiClient.get<{ data: AcademicRecord[] }>(`/students/${studentId}/academic-records`);
    return response.data.data;
  },
};

