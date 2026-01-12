import api from './api';
import type { User, BlockedNumber, Session, Setting, Pagination, HostsResponse, HostDetailResponse, GuestsResponse, MessagesResponse, ConversationResponse, HostsQueryParams, GuestsQueryParams, MessagesQueryParams } from '../types';
import type {IAdminFeedbacksResponse } from '../types';


export const adminService = {
  // User Management
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userType?: string;
    search?: string;
  }): Promise<{ success: boolean; data: { users: User[]; pagination: Pagination } }> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getPendingUsers: async (): Promise<{ success: boolean; data: User[] }> => {
    const response = await api.get('/users/pending');
    return response.data;
  },

  createUser: async (data: {
    name: string;
    businessName?: string;
    email: string;
    whatsappNumber?: string;
    password: string;
    userType: 'host' | 'admin';
  }): Promise<{ success: boolean; data: User }> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  createAdmin: async (data: { name?: string; email: string; password: string }): Promise<{ success: boolean; data: User }> => {
    const response = await api.post('/users/admin', data);
    return response.data;
  },

  approveUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/users/${userId}/approve`);
    return response.data;
  },

  rejectUser: async (userId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/users/${userId}/reject`, { reason });
    return response.data;
  },

  deleteUser: async (userId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Block Requests Management
  getPendingBlockRequests: async (params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    data: { requests: BlockedNumber[]; pagination: Pagination };
  }> => {
    const response = await api.get('/blocked-numbers/admin/pending', { params });
    return response.data;
  },

  approveBlockRequest: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/blocked-numbers/admin/${id}/approve`);
    return response.data;
  },

  rejectBlockRequest: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/blocked-numbers/admin/${id}/reject`);
    return response.data;
  },

  // Session Management
  getActiveSessions: async (): Promise<{ success: boolean; data: { count: number; sessions: Session[] } }> => {
    const response = await api.get('/admin/sessions');
    return response.data;
  },

  getStoredSessions: async (): Promise<{ success: boolean; data: { count: number; sessions: Session[] } }> => {
    const response = await api.get('/admin/sessions/stored');
    return response.data;
  },

  getAllSessions: async (): Promise<{
    success: boolean;
    data: { totalActive: number; totalStored: number; sessions: Session[] };
  }> => {
    const response = await api.get('/admin/sessions/all');
    return response.data;
  },

  getSessionDetails: async (sessionId: string): Promise<{ success: boolean; data: Session & { user?: User } }> => {
    const response = await api.get(`/admin/sessions/${sessionId}`);
    return response.data;
  },

  destroySession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/sessions/${sessionId}`);
    return response.data;
  },

  removeStoredSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/sessions/${sessionId}/stored`);
    return response.data;
  },

  destroyAllSessions: async (storedOnly?: boolean): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/admin/sessions', { params: { storedOnly } });
    return response.data;
  },

  restartSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/admin/sessions/${sessionId}/restart`);
    return response.data;
  },

  logoutSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/admin/sessions/${sessionId}/logout`);
    return response.data;
  },

  // Settings
  getSettings: async (category?: string): Promise<{ success: boolean; data: Setting[] }> => {
    const response = await api.get('/settings', { params: { category } });
    return response.data;
  },

  getSetting: async (key: string): Promise<{ success: boolean; data: Setting }> => {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  },

  updateSetting: async (key: string, value: number | string | boolean): Promise<{ success: boolean; data: Setting }> => {
    const response = await api.put(`/settings/${key}`, { value });
    return response.data;
  },

  bulkUpdateSettings: async (settings: Array<{ key: string; value: number | string | boolean }>): Promise<{ success: boolean }> => {
    const response = await api.put('/settings', { settings });
    return response.data;
  },

  initializeSettings: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/settings/initialize');
    return response.data;
  },

  // Host Management
  getHosts: async (params?: HostsQueryParams): Promise<HostsResponse> => {
    const response = await api.get('/admin/hosts', { params });
    return response.data;
  },

  getHostDetails: async (hostId: string): Promise<HostDetailResponse> => {
    const response = await api.get(`/admin/hosts/${hostId}`);
    return response.data;
  },

  getHostGuests: async (hostId: string, params?: GuestsQueryParams): Promise<GuestsResponse> => {
    // Ensure page and limit are numbers
    const safeParams = {
      ...params,
      page: params?.page !== undefined ? Number(params.page) : undefined,
      limit: params?.limit !== undefined ? Number(params.limit) : undefined,
    };
    const response = await api.get(`/admin/hosts/${hostId}/guests`, { params: safeParams });
    return response.data;
  },

  getHostMessages: async (hostId: string, params?: MessagesQueryParams): Promise<MessagesResponse> => {
    const response = await api.get(`/admin/hosts/${hostId}/messages`, { params });
    return response.data;
  },

  getHostGuestMessages: async (hostId: string, guestId: string, params?: { page?: number; limit?: number }): Promise<ConversationResponse> => {
    const response = await api.get(`/admin/hosts/${hostId}/guests/${guestId}/messages`, { params });
    return response.data;
  },

  getAnalytics: async (): Promise<import('../types').IAnalyticsApiResponse> => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },
};

export const getAdminFeedbacks = async (): Promise<IAdminFeedbacksResponse> => {
  const response = await api.get('/admin/feedback');
  return response.data;
};

export const resolveAdminFeedback = async (id: string) => {
  return api.patch(`/admin/feedback/${id}/resolve`);
};

export default adminService;
