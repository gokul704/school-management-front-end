import apiClient from './client';
import {
  Gradebook,
  Assignment,
  Exam,
  Timetable,
  TimetableSlot,
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
    const response = await apiClient.get<{ success: boolean; data: Assignment[]; pagination?: any }>('/academics/assignments', { params });
    // Handle both response formats
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  createAssignment: async (data: Partial<Assignment>) => {
    const response = await apiClient.post<{ success: boolean; data: Assignment }>('/academics/assignments', data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
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
    const response = await apiClient.get<{ success: boolean; data: Exam[]; pagination?: any }>('/academics/exams', { params });
    // Handle both response formats
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  createExam: async (data: Partial<Exam>) => {
    const response = await apiClient.post<{ success: boolean; data: Exam }>('/academics/exams', data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
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
    try {
      const response = await apiClient.get<{ success: boolean; data: Timetable }>('/academics/timetable', {
        params: { classId, academicYear },
      });
      // Handle both response formats
      if (response.data.success) {
        const timetable = response.data.data;
        // Ensure schedule is an array (it might be a JSON string from the database)
        if (timetable.schedule && typeof timetable.schedule === 'string') {
          timetable.schedule = JSON.parse(timetable.schedule);
        }
        return timetable;
      }
      const timetable = (response.data as any).data || response.data;
      // Ensure schedule is an array
      if (timetable && timetable.schedule && typeof timetable.schedule === 'string') {
        timetable.schedule = JSON.parse(timetable.schedule);
      }
      return timetable;
    } catch (error: any) {
      // If 404, return null instead of throwing
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  createTimetable: async (data: Partial<Timetable>) => {
    const response = await apiClient.post<{ success: boolean; data: Timetable }>('/academics/timetable', data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  updateTimetable: async (id: string, data: Partial<Timetable>) => {
    const response = await apiClient.put<{ data: Timetable }>(`/academics/timetable/${id}`, data);
    return response.data.data;
  },

  generateTimetable: async (data: {
    classId: string;
    academicYear: string;
    sections?: string[];
    slotDuration?: number;
    workingHours?: { start: string; end: string };
  }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        schedule: TimetableSlot[];
        summary: {
          totalSlots: number;
          courses: number;
          sections: number;
          duration: number;
        };
      };
    }>('/academics/timetable/generate', data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },
};

