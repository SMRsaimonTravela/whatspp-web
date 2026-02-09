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
  IGuestsResponse, IConversationResponse, IAnalyticsApiResponse
} from '../types';
import type { IAdminFeedbacksResponse } from '../types';
import { IHostUser, IUserDetailResponse } from "../types/users.type";
import { IPagination } from "../types/common.ts";


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
    const response = await api.get('/admin/pending-users');
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
    const response = await api.post('/admin/users/host', data);
    return response.data;
  },

  createAdmin: async (data: { name?: string; email: string; password: string; whatsappNumber: string }): Promise<{ success: boolean; data: IUser }> => {
    const response = await api.post('/admin/users/admin', data);
    return response.data;
  },

  approveUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/admin/users/${userId}/approve`);
    return response.data;
  },

  rejectUser: async (userId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/users/${userId}/reject`, { reason });
    return response.data;
  },

  deleteUser: async (userId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Update host ID for a user
   * @param id user id
   * @param hostId new host id
   */
  updateUserHostId: async (id: string, hostId: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.patch(`/admin/users/${id}/host-id`, { hostId });
    return response.data;
  },

  /**
   * Reset a user's password
   */
  resetUserPassword: async (userId: string, password: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/admin/users/${userId}/password`, { password });
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
    const response = await api.patch(`/admin/settings/${key}`, { value });
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

  getAnalytics: async (): Promise<IAnalyticsApiResponse> => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  getHostUsers: async (params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: IHostUser[]; pagination: IPagination }> => {
    const response = await api.get('/admin/users/hosts', { params });
    return response.data;
  },

  addFeedback: async (userId: string, messageId: string, feedback: 'positive' | 'negative' | 'neutral', feedbackNote?: string): Promise<{ success: boolean }> => {
    const response = await api.patch(`/admin/${userId}/messages/${messageId}/feedback`, { feedback, feedbackNote });
    return response.data;
  },

  // Question Bank - Categories
  getQuestionBankCategories: async (params?: {
    search?: string;
    isActive?: 'true' | 'false';
    userId?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/admin/question-bank/categories', { params });
    return response.data;
  },

  createQuestionBankCategory: async (data: { name: string; userId: string }) => {
    const response = await api.post('/admin/question-bank/categories', data);
    return response.data;
  },

  updateQuestionBankCategory: async (id: string, data: { name: string }) => {
    const response = await api.patch(`/admin/question-bank/categories/${id}`, data);
    return response.data;
  },

  deleteQuestionBankCategory: async (id: string) => {
    const response = await api.delete(`/admin/question-bank/categories/${id}`);
    return response.data;
  },

  toggleQuestionBankCategoryActive: async (id: string) => {
    const response = await api.patch(`/admin/question-bank/categories/${id}/active`);
    return response.data;
  },

  // Question Bank - Questions
  getQuestionBankQuestions: async (params?: {
    search?: string;
    status?: string;
    isActive?: 'true' | 'false';
    userId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/admin/question-bank/questions', { params });
    return response.data;
  },

  createQuestionBankQuestion: async (data: {
    question: string;
    answer: string;
    categoryIds: string[];
    userId: string;
  }) => {
    const response = await api.post('/admin/question-bank/questions', data);
    return response.data;
  },

  updateQuestionBankQuestion: async (
    id: string,
    data: {
      question?: string;
      answer?: string;
      categoryIds?: string[];
    }
  ) => {
    const response = await api.patch(`/admin/question-bank/questions/${id}`, data);
    return response.data;
  },

  deleteQuestionBankQuestion: async (id: string) => {
    const response = await api.delete(`/admin/question-bank/questions/${id}`);
    return response.data;
  },

  toggleQuestionBankQuestionActive: async (id: string) => {
    const response = await api.patch(`/admin/question-bank/questions/${id}/active`);
    return response.data;
  },

  approveQuestionBankQuestion: async (id: string) => {
    const response = await api.patch(`/admin/question-bank/questions/${id}/approve`);
    return response.data;
  },

  createManualBooking: async (data: {
    phone: string;
    first_name: string;
    last_name: string;
    listing_id: number;
    from: string;
    to: string;
    guests: number;
    guest_id?: number | null;
    birthdate?: string | null;
    quantity?: number;
  }): Promise<{ success: boolean; message: string; data: { paymentLink: string; originalUrl: string } }> => {
    const response = await api.post('/admin/bookings/manual', data);
    return response.data;
  },
};

export const getAdminFeedbacks = async (params?: { page?: number; limit?: number }): Promise<IAdminFeedbacksResponse> => {
  const response = await api.get('/admin/messages/feedbacks', { params });
  return response.data;
};

export const resolveAdminFeedback = async (id: string) => {
  return api.patch(`/admin/messages/feedbacks/${id}/resolve`);
};



export default adminService;
