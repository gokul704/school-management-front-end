import apiClient from './client';
import { Message, Announcement, Event, PaginatedResponse } from '@/types';

export const communicationsApi = {
  // Messages
  getMessages: async (params?: { page?: number; limit?: number; unread?: boolean }) => {
    const response = await apiClient.get<{ success: boolean; data: Message[]; pagination?: any }>('/communications/messages', { params });
    // Handle both response formats
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  sendMessage: async (data: Partial<Message> & { 
    recipientId?: string; 
    recipientIds?: string[]; 
    classId?: string; 
    section?: string; 
  }) => {
    const response = await apiClient.post<{ success: boolean; data: { messages: Message[]; count: number } }>('/communications/messages', data);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  getStudentsForMessaging: async (params: { classId: string; section?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Array<{ id: string; userId: string; firstName: string; lastName: string; email: string; studentId: string; className: string; section: string; fullName: string }> }>('/communications/students-for-messaging', { params });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || [];
  },

  markMessageAsRead: async (messageId: string) => {
    await apiClient.patch(`/communications/messages/${messageId}/read`);
  },

  // Announcements
  getAnnouncements: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get<{ success: boolean; data: Announcement[]; pagination?: any }>('/communications/announcements', { params });
    // Handle both response formats
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  createAnnouncement: async (data: Partial<Announcement>) => {
    const response = await apiClient.post<{ success: boolean; data: Announcement }>('/communications/announcements', data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  // Events
  getEvents: async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: Event[]; pagination?: any }>('/communications/events', { params });
    // Handle both response formats
    if (response.data.success) {
      return { data: response.data.data, pagination: response.data.pagination };
    }
    return response.data;
  },

  createEvent: async (data: Partial<Event>) => {
    const response = await apiClient.post<{ success: boolean; data: Event }>('/communications/events', data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  updateEvent: async (id: string, data: Partial<Event>) => {
    const response = await apiClient.put<{ success: boolean; data: Event }>(`/communications/events/${id}`, data);
    // Handle both response formats
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  deleteEvent: async (id: string) => {
    await apiClient.delete(`/communications/events/${id}`);
  },
};

