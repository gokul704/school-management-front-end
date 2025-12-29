import apiClient from './client';
import { PaginatedResponse } from '@/types';

export interface Class {
  id: string;
  name: string;
  academicYear: string;
  gradeLevel: string;
  section?: string | null; // Deprecated: sections are now in availableSections
  availableSections?: string[]; // Available sections for this class (from students)
  capacity?: number;
  classroomName?: string;
  studentCount: number;
  courses?: Array<{ id: string; name: string; courseCode: string }>;
  createdAt: string;
  updatedAt: string;
}

export const classApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Class[]; pagination?: any }>('/classes', { params });
    // Handle both response formats
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Class }>(`/classes/${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  create: async (data: { name: string; academicYear: string; gradeLevel?: string; courseIds?: string[] }) => {
    const response = await apiClient.post<{ success: boolean; data: Class }>('/classes', data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  update: async (id: string, data: { name?: string; academicYear?: string; gradeLevel?: string; courseIds?: string[] }) => {
    const response = await apiClient.put<{ success: boolean; data: Class }>(`/classes/${id}`, data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean }>(`/classes/${id}`);
    return response.data;
  },

  getSections: async (classId: string) => {
    const response = await apiClient.get<{ success: boolean; data: any[] }>(`/classes/${classId}/sections`);
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data || [];
  },
};

