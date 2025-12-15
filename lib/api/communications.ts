import apiClient from './client';
import { Message, Announcement, Event, PaginatedResponse } from '@/types';

export const communicationsApi = {
  // Messages
  getMessages: async (params?: { page?: number; limit?: number; unread?: boolean }) => {
    const response = await apiClient.get<PaginatedResponse<Message>>('/communications/messages', { params });
    return response.data;
  },

  sendMessage: async (data: Partial<Message>) => {
    const response = await apiClient.post<{ data: Message }>('/communications/messages', data);
    return response.data.data;
  },

  markMessageAsRead: async (messageId: string) => {
    await apiClient.patch(`/communications/messages/${messageId}/read`);
  },

  // Announcements
  getAnnouncements: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get<PaginatedResponse<Announcement>>('/communications/announcements', { params });
    return response.data;
  },

  createAnnouncement: async (data: Partial<Announcement>) => {
    const response = await apiClient.post<{ data: Announcement }>('/communications/announcements', data);
    return response.data.data;
  },

  // Events
  getEvents: async (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Event>>('/communications/events', { params });
    return response.data;
  },

  createEvent: async (data: Partial<Event>) => {
    const response = await apiClient.post<{ data: Event }>('/communications/events', data);
    return response.data.data;
  },

  updateEvent: async (id: string, data: Partial<Event>) => {
    const response = await apiClient.put<{ data: Event }>(`/communications/events/${id}`, data);
    return response.data.data;
  },

  deleteEvent: async (id: string) => {
    await apiClient.delete(`/communications/events/${id}`);
  },
};

