import apiClient from './client';

export interface TeacherLeave {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  leaveType: 'sick' | 'casual' | 'personal' | 'emergency' | 'other';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const leavesApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string; teacherId?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: TeacherLeave[]; pagination?: any }>('/leaves', { params });
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: TeacherLeave }>(`/leaves/${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  create: async (data: { leaveType: string; startDate: string; endDate: string; reason: string }) => {
    const response = await apiClient.post<{ success: boolean; data: TeacherLeave }>('/leaves', data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  updateStatus: async (id: string, data: { status: string; reviewNotes?: string }) => {
    const response = await apiClient.patch<{ success: boolean; data: TeacherLeave }>(`/leaves/${id}/status`, data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },
};

