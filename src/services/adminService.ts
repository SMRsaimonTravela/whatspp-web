import api from './api';
import {
  IUser,
  Setting,
  HostsResponse,
  MessagesResponse,
  HostsQueryParams,
  GuestsQueryParams,
  MessagesQueryParams,
  IBlockNumbersAdmin,
  IGuestsResponse, IConversationResponse
} from '../types';
import type { IAdminFeedbacksResponse } from '../types';
import { IHostUser, IUserDetailResponse } from "../types/users.type";
import { IPagination } from "../types/common.ts"; // Import IHostUser type


export const adminService = {
  // User Management
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userType?: string;
    search?: string;
  }): Promise<{ success: boolean; data: IUser[]; pagination: IPagination }> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getAdminUsers: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userType?: string;
    search?: string;
  }): Promise<{ success: boolean; data: IUser[]; pagination: IPagination }> => {
    const response = await api.get('/admin/users/admins', { params });
    return response.data;
  },


  getPendingUsers: async (): Promise<{ success: boolean; data: IUser[] }> => {
    const response = await api.get('/admin/users/pending');
    return response.data;
  },

  createUser: async (data: {
    name: string;
    businessName?: string;
    email: string;
    whatsappNumber?: string;
    password: string;
    userType: 'host' | 'admin';
  }): Promise<{ success: boolean; data: IUser }> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  createAdmin: async (data: { name?: string; email: string; password: string }): Promise<{ success: boolean; data: IUser }> => {
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
    data: IBlockNumbersAdmin[]; pagination: IPagination
  }> => {
    const response = await api.get('/admin/blocked-numbers', { params });
    return response.data;
  },

  approveBlockRequest: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/admin/blocked-numbers/${id}/approve`);
    return response.data;
  },

  rejectBlockRequest: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/admin/blocked-numbers/${id}/reject`);
    return response.data;
  },

  // Session Management (Moved to whatsappService)

  // Settings
  getSettings: async (category?: string): Promise<{ success: boolean; data: Setting[] }> => {
    const response = await api.get('/admin/settings', { params: { category } });
    return response.data;
  },

  getSetting: async (key: string): Promise<{ success: boolean; data: Setting }> => {
    const response = await api.get(`/admin/settings/${key}`);
    return response.data;
  },

  updateSetting: async (key: string, value: number | string | boolean): Promise<{ success: boolean; data: Setting }> => {
    const response = await api.put(`/admin/settings/${key}`, { value });
    return response.data;
  },

  bulkUpdateSettings: async (settings: Array<{ key: string; value: number | string | boolean }>): Promise<{ success: boolean }> => {
    const response = await api.put('/admin/settings', { settings });
    return response.data;
  },

  initializeSettings: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/admin/settings/initialize');
    return response.data;
  },

  // Host Management
  getHosts: async (params?: HostsQueryParams): Promise<HostsResponse> => {
    const response = await api.get('/admin/hosts', { params });
    return response.data;
  },

  getUserDetails: async (hostId: string): Promise<IUserDetailResponse> => {
    const response = await api.get(`/admin/users/${hostId}`);
    return response.data;
  },

  getHostGuests: async (hostId: string, params?: GuestsQueryParams): Promise<IGuestsResponse> => {
    const safeParams = {
      ...params,
      page: params?.page !== undefined ? Number(params.page) : 1,
      limit: params?.limit !== undefined ? Number(params.limit) : 100,
    };
    const response = await api.get(`/admin/host/${hostId}/guests`, { params: safeParams });
    return response.data
  },

  getHostMessages: async (hostId: string, params?: MessagesQueryParams): Promise<MessagesResponse> => {
    const response = await api.get(`/admin/hosts/${hostId}/messages`, { params });
    return response.data;
  },

  getHostGuestMessages: async (guestId: string, params?: { page?: number; limit?: number }): Promise<IConversationResponse> => {
    const response = await api.get(`/admin/${guestId}/messages`, { params });
    return response.data;
  },

  getAnalytics: async (): Promise<import('../types').IAnalyticsApiResponse> => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  getHostUsers: async (): Promise<{ success: boolean; data: IHostUser[] }> => {
    const response = await api.get('/admin/users/hosts');
    return response.data;
  },

  addFeedback: async (userId: string, messageId: string, feedback: 'positive' | 'negative' | 'neutral', feedbackNote?: string): Promise<{ success: boolean }> => {
    const response = await api.patch(`/admin/${userId}/messages/${messageId}/feedback`, { feedback, feedbackNote });
    return response.data;
  },
};

export const getAdminFeedbacks = async (): Promise<IAdminFeedbacksResponse> => {
  const response = await api.get('/admin/messages/feedbacks');
  return response.data;
};

export const resolveAdminFeedback = async (id: string) => {
  return api.patch(`/admin/feedback/${id}/resolve`);
};

export default adminService;
