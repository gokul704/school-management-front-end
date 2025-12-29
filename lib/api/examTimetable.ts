import apiClient from './client';

export interface ExamHall {
  id: string;
  name: string;
  capacity: number;
  building?: string;
  floor?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamTimetable {
  id: string;
  examId: string;
  examTitle: string;
  courseId: string;
  courseName: string;
  examHallId: string;
  hallName: string;
  hallCapacity: number;
  building?: string;
  date: string;
  startTime: string;
  endTime: string;
  invigilatorId?: string;
  invigilatorName?: string;
  assignedStudents: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamStudentAssignment {
  id: string;
  examTimetableId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  email: string;
  seatNumber?: string;
  createdAt: string;
}

export const examTimetableApi = {
  // Exam Halls
  getExamHalls: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: ExamHall[]; pagination?: any }>('/exam-timetable/halls', { params });
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  createExamHall: async (data: Partial<ExamHall>) => {
    const response = await apiClient.post<{ success: boolean; data: ExamHall }>('/exam-timetable/halls', data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  updateExamHall: async (id: string, data: Partial<ExamHall>) => {
    const response = await apiClient.put<{ success: boolean; data: ExamHall }>(`/exam-timetable/halls/${id}`, data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  deleteExamHall: async (id: string) => {
    await apiClient.delete(`/exam-timetable/halls/${id}`);
  },

  // Exam Timetables
  getExamTimetables: async (params?: { examId?: string; date?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: ExamTimetable[] }>('/exam-timetable/timetables', { params });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || [];
  },

  createExamTimetable: async (data: Partial<ExamTimetable & { studentAssignments?: Array<{ studentId: string; seatNumber?: string }> }>) => {
    const response = await apiClient.post<{ success: boolean; data: { id: string } }>('/exam-timetable/timetables', data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  getExamTimetableStudents: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: ExamStudentAssignment[] }>(`/exam-timetable/timetables/${id}/students`);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || [];
  },

  assignStudentsToExam: async (examTimetableId: string, studentAssignments: Array<{ studentId: string; seatNumber?: string }>) => {
    const response = await apiClient.post<{ success: boolean }>(`/exam-timetable/timetables/${examTimetableId}/assign-students`, {
      studentAssignments,
    });
    return response.data;
  },

  generateSittingPlan: async (data: { classIds: string[]; classId?: string; date: string; startTime: string; endTime: string; examTitle?: string }) => {
    const response = await apiClient.post<{ success: boolean; data: any }>('/exam-timetable/timetables/generate-sitting-plan', data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },
};

