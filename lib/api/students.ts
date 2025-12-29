import apiClient from './client';
import { Student, PaginatedResponse, AcademicRecord } from '@/types';

export const studentApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; classId?: string; section?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Student[]; pagination?: any }>('/students', { params });
    // Handle both response formats
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ data: Student }>(`/students/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Student>) => {
    const response = await apiClient.post<{ success: boolean; data: Student }>('/students', data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data;
  },

  update: async (id: string, data: Partial<Student>) => {
    const response = await apiClient.put<{ success: boolean; data: Student }>(`/students/${id}`, data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/students/${id}`);
  },

  getAcademicRecords: async (studentId: string) => {
    const response = await apiClient.get<{ success: boolean; data: AcademicRecord[] }>(`/students/${studentId}/academic-records`);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data || [];
  },
};

