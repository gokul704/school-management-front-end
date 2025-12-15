import apiClient from './client';
import { FeeStructure, Payment, FinancialReport, PaginatedResponse } from '@/types';

export const financialApi = {
  // Fee Structure
  getFeeStructures: async (params?: { page?: number; limit?: number; academicYear?: string }) => {
    const response = await apiClient.get<PaginatedResponse<FeeStructure>>('/financial/fees', { params });
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
    const response = await apiClient.get<PaginatedResponse<Payment>>('/financial/payments', { params });
    return response.data;
  },

  createPayment: async (data: Partial<Payment>) => {
    const response = await apiClient.post<{ data: Payment }>('/financial/payments', data);
    return response.data.data;
  },

  getPaymentById: async (id: string) => {
    const response = await apiClient.get<{ data: Payment }>(`/financial/payments/${id}`);
    return response.data.data;
  },

  // Reports
  getFinancialReport: async (params: { startDate: string; endDate: string }) => {
    const response = await apiClient.get<{ data: FinancialReport }>('/financial/reports', { params });
    return response.data.data;
  },
};

