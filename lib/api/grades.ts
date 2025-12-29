import apiClient from './client';
import { Grade, ProgressCard } from '@/types';

export const gradesApi = {
  // Get grades for a student
  getStudentGrades: async (studentId: string, params?: { classId?: string; academicYear?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Grade[] }>(`/grades/students/${studentId}`, { params });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || [];
  },

  // Get progress card for a student
  getProgressCard: async (studentId: string, params: { classId: string; academicYear: string }) => {
    const response = await apiClient.get<{ success: boolean; data: ProgressCard }>(`/grades/students/${studentId}/progress-card`, { params });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data;
  },

  // Get grades for a class
  getClassGrades: async (classId: string, params?: { academicYear: string; courseId?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Grade[] }>(`/grades/classes/${classId}`, { params });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || [];
  },

  // Create or update a grade
  createOrUpdateGrade: async (data: {
    studentId: string;
    courseId: string;
    classId: string;
    academicYear: string;
    grade: string;
    marksObtained?: number;
    maxMarks?: number;
    examType?: 'unit_test' | 'mid_term' | 'final' | 'assignment' | 'project' | 'practical' | 'other';
    examName?: string;
    remarks?: string;
  }) => {
    const response = await apiClient.post<{ success: boolean; data: Grade }>('/grades/grades', data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data;
  },

  // Update a grade
  updateGrade: async (id: string, data: Partial<Grade>) => {
    const response = await apiClient.put<{ success: boolean; data: Grade }>(`/grades/grades/${id}`, data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data;
  },

  // Delete a grade
  deleteGrade: async (id: string) => {
    await apiClient.delete(`/grades/grades/${id}`);
  },
};

