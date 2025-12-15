import apiClient from './client';
import {
  Gradebook,
  Assignment,
  Exam,
  Timetable,
  PaginatedResponse,
} from '@/types';

export const academicsApi = {
  // Gradebook
  getGradebook: async (studentId: string, courseId?: string) => {
    const response = await apiClient.get<{ data: Gradebook[] }>('/academics/gradebook', {
      params: { studentId, courseId },
    });
    return response.data.data;
  },

  // Assignments
  getAssignments: async (params?: { page?: number; limit?: number; courseId?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Assignment>>('/academics/assignments', { params });
    return response.data;
  },

  createAssignment: async (data: Partial<Assignment>) => {
    const response = await apiClient.post<{ data: Assignment }>('/academics/assignments', data);
    return response.data.data;
  },

  updateAssignment: async (id: string, data: Partial<Assignment>) => {
    const response = await apiClient.put<{ data: Assignment }>(`/academics/assignments/${id}`, data);
    return response.data.data;
  },

  submitAssignment: async (assignmentId: string, file?: File) => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    const response = await apiClient.post<{ data: any }>(`/academics/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  gradeAssignment: async (submissionId: string, score: number, feedback?: string) => {
    const response = await apiClient.post<{ data: any }>(`/academics/assignments/submissions/${submissionId}/grade`, {
      score,
      feedback,
    });
    return response.data.data;
  },

  // Exams
  getExams: async (params?: { page?: number; limit?: number; courseId?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Exam>>('/academics/exams', { params });
    return response.data;
  },

  createExam: async (data: Partial<Exam>) => {
    const response = await apiClient.post<{ data: Exam }>('/academics/exams', data);
    return response.data.data;
  },

  updateExam: async (id: string, data: Partial<Exam>) => {
    const response = await apiClient.put<{ data: Exam }>(`/academics/exams/${id}`, data);
    return response.data.data;
  },

  publishExamResults: async (examId: string, results: Array<{ studentId: string; score: number }>) => {
    const response = await apiClient.post<{ data: Exam }>(`/academics/exams/${examId}/results`, { results });
    return response.data.data;
  },

  // Timetable
  getTimetable: async (classId?: string, academicYear?: string) => {
    const response = await apiClient.get<{ data: Timetable }>('/academics/timetable', {
      params: { classId, academicYear },
    });
    return response.data.data;
  },

  createTimetable: async (data: Partial<Timetable>) => {
    const response = await apiClient.post<{ data: Timetable }>('/academics/timetable', data);
    return response.data.data;
  },

  updateTimetable: async (id: string, data: Partial<Timetable>) => {
    const response = await apiClient.put<{ data: Timetable }>(`/academics/timetable/${id}`, data);
    return response.data.data;
  },
};

