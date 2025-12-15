import apiClient from './client';
import { Attendance, AttendanceReport, PaginatedResponse } from '@/types';

export const attendanceApi = {
  markAttendance: async (data: Partial<Attendance>) => {
    const response = await apiClient.post<{ data: Attendance }>('/attendance', data);
    return response.data.data;
  },

  getByDate: async (date: string, courseId?: string) => {
    const response = await apiClient.get<{ data: Attendance[] }>('/attendance', {
      params: { date, courseId },
    });
    return response.data.data;
  },

  getByStudent: async (studentId: string, params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get<{ data: Attendance[] }>(`/attendance/student/${studentId}`, { params });
    return response.data.data;
  },

  getReport: async (studentId: string, params: { startDate: string; endDate: string }) => {
    const response = await apiClient.get<{ data: AttendanceReport }>(`/attendance/report/${studentId}`, { params });
    return response.data.data;
  },

  update: async (id: string, data: Partial<Attendance>) => {
    const response = await apiClient.put<{ data: Attendance }>(`/attendance/${id}`, data);
    return response.data.data;
  },
};

