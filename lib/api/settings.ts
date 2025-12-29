import apiClient from './client';

export interface SchoolSetting {
  key: string;
  value: string | null;
  updatedAt: string;
  updatedBy?: string;
}

export const settingsApi = {
  getAll: async () => {
    const response = await apiClient.get<{ success: boolean; data: Record<string, { value: string | null; updatedAt: string; updatedBy?: string }> }>('/settings');
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || {};
  },

  getSetting: async (key: string) => {
    const response = await apiClient.get<{ success: boolean; data: SchoolSetting }>(`/settings/${key}`);
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  updateSetting: async (key: string, value: string) => {
    const response = await apiClient.put<{ success: boolean; data: SchoolSetting }>(`/settings/${key}`, { value });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await apiClient.post<{ success: boolean; data: { logoUrl: string } }>('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data.success) {
      return response.data.data;
    }
    return (response.data as any).data || response.data;
  },
};

