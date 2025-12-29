import apiClient from './client';
import { FeeStructure, Payment, FinancialReport, PaginatedResponse } from '@/types';

export const financialApi = {
  // Fee Structure
  getFeeStructures: async (params?: { page?: number; limit?: number; academicYear?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: FeeStructure[]; pagination?: any }>('/financial/fees', { params });
    // Handle both response formats
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  createFeeStructure: async (data: Partial<FeeStructure>) => {
    const response = await apiClient.post<{ data: FeeStructure }>('/financial/fees', data);
    return response.data.data;
  },

  updateFeeStructure: async (id: string, data: Partial<FeeStructure>) => {
    const response = await apiClient.put<{ data: FeeStructure }>(`/financial/fees/${id}`, data);
    return response.data.data;
  },

  deleteFeeStructure: async (id: string) => {
    await apiClient.delete(`/financial/fees/${id}`);
  },

  // Payments
  getPayments: async (params?: { page?: number; limit?: number; studentId?: string; status?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Payment[]; pagination?: any }>('/financial/payments', { params });
    // Handle both response formats
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  createPayment: async (data: Partial<Payment>) => {
    const response = await apiClient.post<{ success: boolean; data: Payment }>('/financial/payments', data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  getPaymentById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Payment }>(`/financial/payments/${id}`);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  // Reports
  getFinancialReport: async (params: { startDate: string; endDate: string }) => {
    const response = await apiClient.get<{ success: boolean; data: FinancialReport }>('/financial/reports', { params });
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },
};

