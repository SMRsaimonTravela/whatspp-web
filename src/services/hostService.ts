import api from './api';
import {MessageStats, BlockedNumber, IMessage, IGuest, IAnalyticsApiResponse} from '../types';
import { IPagination } from '../types/common';

// Session APIs
export const hostService = {
  // AI Toggle
  getAIStatus: async (): Promise<{ success: boolean; data: { aiAutoReplyEnabled: boolean } }> => {
    const response = await api.get('/host/ai-status');
    return response.data;
  },

  toggleAI: async (enabled: boolean): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch('/host/ai-toggle', { enabled });
    return response.data;
  },

  // Messages
  getMessages: async (params?: {
    page?: number;
    limit?: number;
    guestNumber?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: { messages: IMessage[]; pagination: IPagination } }> => {
    const response = await api.get('/host/messages', { params });
    return response.data;
  },

  getConversation: async (guestId: string, params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    data: IMessage;
    pagination: IPagination
  }> => {
    const response = await api.get(`/host/messages/conversation/${guestId}`, { params });
    return response.data;
  },

  addFeedback: async (messageId: string, feedback: 'positive' | 'negative' | 'neutral', feedbackNote?: string): Promise<{ success: boolean }> => {
    const response = await api.patch(`/host/messages/${messageId}/feedback`, { feedback, feedbackNote });
    return response.data;
  },

  getMessageStats: async (): Promise<{ success: boolean; data: MessageStats }> => {
    const response = await api.get('/host/messages/stats');
    return response.data;
  },
  getAnalytics: async (): Promise<IAnalyticsApiResponse> => {
    const response = await api.get('/host/analytics');
    return response.data;
  },

  // Guests
  getGuests: async (params?: { page?: number; limit?: number; search?: string, id?: string }): Promise<{
    success: boolean;
    data: IGuest[];
    pagination: IPagination;
    filters: {
      search: {
        label: string;
        placeholder: string;
        type: "string"
      },
      id: {
        label: string,
        placeholder: string,
        type: 'string',
      }
    }
  }> => {
    const response = await api.get('/host/guests', { params });
    return response.data;
  },

  updateGuest: async (guestId: string, data: { name?: string; originalNumber?: string }): Promise<{ success: boolean; data: IGuest }> => {
    const response = await api.patch(`/host/guests/${guestId}`, data);
    return response.data;
  },

  toggleGuestAI: async (guestId: string, enabled: boolean): Promise<{ success: boolean; message: string; data: { aiAutoReplyEnabled: boolean } }> => {
    const response = await api.patch(`/host/guests/${guestId}/ai-toggle`, { enabled });
    return response.data;
  },

  getGuestMessages: async (guestId: string, params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    data: IMessage;
    pagination: IPagination
  }> => {
    const response = await api.get(`/guests/${guestId}/messages`, { params });
    return response.data;
  },

  // Blocked Numbers
  getBlockedNumbers: async (params?: { page?: number; limit?: number; status?: string }): Promise<{
    success: boolean;
    data: BlockedNumber[];
    pagination: IPagination
  }> => {
    const response = await api.get('/host/blocked-numbers', { params });
    return response.data;
  },

  requestBlock: async (data: { phoneNumber: string; name?: string; reason?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/host/blocked-numbers', data);
    return response.data;
  },

  bulkBlockRequest: async (numbers: Array<{ phoneNumber: string; name?: string; reason?: string }>): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/host/blocked-numbers/bulk', { numbers });
    return response.data;
  },

  removeBlockedNumber: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/host/blocked-numbers/${id}`);
    return response.data;
  },

  checkIfBlocked: async (phoneNumber: string): Promise<{ success: boolean; data: { isBlocked: boolean } }> => {
    const response = await api.get(`/host/blocked-numbers/check/${phoneNumber}`);
    return response.data;
  },
};
