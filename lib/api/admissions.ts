import apiClient from './client';
import { AdmissionApplication, PaginatedResponse } from '@/types';

export const admissionApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await apiClient.get<PaginatedResponse<AdmissionApplication>>('/admissions', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ data: AdmissionApplication }>(`/admissions/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<AdmissionApplication>) => {
    const response = await apiClient.post<{ data: AdmissionApplication }>('/admissions', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<AdmissionApplication>) => {
    const response = await apiClient.put<{ data: AdmissionApplication }>(`/admissions/${id}`, data);
    return response.data.data;
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    const response = await apiClient.patch<{ data: AdmissionApplication }>(`/admissions/${id}/status`, {
      status,
      notes,
    });
    return response.data.data;
  },

  uploadDocument: async (id: string, file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await apiClient.post<{ data: any }>(`/admissions/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
};

