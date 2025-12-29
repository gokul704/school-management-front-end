import apiClient from './client';
import { Attendance, AttendanceReport, PaginatedResponse } from '@/types';

export const attendanceApi = {
  markAttendance: async (data: Partial<Attendance>) => {
    const response = await apiClient.post<{ data: Attendance }>('/attendance', data);
    return response.data.data;
  },

  getByDate: async (date: string, courseId?: string) => {
    const response = await apiClient.get<{ success: boolean; data: Attendance[] }>('/attendance', {
      params: { date, courseId },
    });
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data || [];
  },

  getByStudent: async (studentId: string, params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Attendance[] }>(`/attendance/student/${studentId}`, { params });
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data || [];
  },

  getReport: async (studentId: string, params: { startDate: string; endDate: string }) => {
    const response = await apiClient.get<{ success: boolean; data: AttendanceReport }>(`/attendance/report/${studentId}`, { params });
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return response.data.data;
  },

  update: async (id: string, data: Partial<Attendance>) => {
    const response = await apiClient.put<{ success: boolean; data: Attendance }>(`/attendance/${id}`, data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  // New endpoints for class-driven attendance
  getStudentsForAttendance: async (params: { classId: string; section?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Array<{ id: string; studentId: string; firstName: string; lastName: string; fullName: string; email: string; className: string; section: string }> }>('/attendance/students', { params });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || [];
  },

  getCoursesForClass: async (classId: string, params?: { academicYear?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Array<{ id: string; courseCode: string; name: string; description?: string; teacherId?: string; teacherName?: string; department: string; academicYear: string }> }>(`/attendance/courses/class/${classId}`, { params });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || [];
  },

  getByClassAndDate: async (params: { classId: string; date: string; section?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: { date: string; classId: string; section: string | null; students: Array<{ studentId: string; studentNumber: string; firstName: string; lastName: string; fullName: string; courses: Array<{ courseId: string; courseName: string; courseCode: string; attendanceId: string | null; status: string | null; notes: string | null }> }>; courses: Array<{ id: string; name: string; courseCode: string }> } }>('/attendance/class', { params });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data;
  },

  getStudentCalendar: async (studentId: string, params: { startDate: string; endDate: string }) => {
    const response = await apiClient.get<{ success: boolean; data: { studentId: string; startDate: string; endDate: string; calendar: Record<string, Array<{ id: string; courseId: string; courseName: string; courseCode: string; status: string; notes: string | null; createdAt: string }>> } }>(`/attendance/student/${studentId}/calendar`, { params });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data;
  },

  markBulkAttendance: async (data: { studentId: string; date: string; attendances: Array<{ courseId: string; status: 'present' | 'absent' | 'late' | 'excused'; notes?: string }> }) => {
    const response = await apiClient.post<{ success: boolean; data: { studentId: string; date: string; count: number; attendances: Array<{ id: string; courseId: string; date: string; status: string; notes: string | null }> } }>('/attendance/bulk', data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data;
  },
};

