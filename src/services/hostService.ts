import api from './api';
import type { Message, MessageStats, Guest, BlockedNumber, Pagination } from '../types';

// Session APIs
export const hostService = {
  // AI Toggle
  getAIStatus: async (): Promise<{ success: boolean; data: { aiAutoReplyEnabled: boolean } }> => {
    const response = await api.get('/host/ai-status');
    return response.data;
  },

  toggleAI: async (enabled: boolean): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/host/ai-toggle', { enabled });
    return response.data;
  },

  // Messages
  getMessages: async (params?: {
    page?: number;
    limit?: number;
    guestNumber?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: { messages: Message[]; pagination: Pagination } }> => {
    const response = await api.get('/messages', { params });
    return response.data;
  },

  getConversation: async (guestId: string, params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    data: {
      guest: Guest;
      messages: Message[];
      pagination: Pagination;
    };
  }> => {
    const response = await api.get(`/messages/conversation/${guestId}`, { params });
    return response.data;
  },

  addFeedback: async (messageId: string, feedback: 'positive' | 'negative' | 'neutral', feedbackNote?: string): Promise<{ success: boolean }> => {
    const response = await api.put(`/messages/${messageId}/feedback`, { feedback, feedbackNote });
    return response.data;
  },

  getMessageStats: async (): Promise<{ success: boolean; data: MessageStats }> => {
    const response = await api.get('/messages/stats');
    return response.data;
  },

  // Guests
  getGuests: async (params?: { page?: number; limit?: number; search?: string }): Promise<{
    success: boolean;
    data: { guests: Guest[]; pagination: Pagination };
  }> => {
    const response = await api.get('/guests', { params });
    return response.data;
  },

  updateGuest: async (guestId: string, data: { name?: string; originalNumber?: string }): Promise<{ success: boolean; data: Guest }> => {
    const response = await api.put(`/guests/${guestId}`, data);
    return response.data;
  },

  toggleGuestAI: async (guestId: string, enabled: boolean): Promise<{ success: boolean; message: string; data: { aiAutoReplyEnabled: boolean } }> => {
    const response = await api.put(`/guests/${guestId}/ai-toggle`, { enabled });
    return response.data;
  },

  getGuestMessages: async (guestId: string, params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    data: { messages: Message[]; pagination: Pagination };
  }> => {
    const response = await api.get(`/guests/${guestId}/messages`, { params });
    return response.data;
  },

  // Blocked Numbers
  getBlockedNumbers: async (params?: { page?: number; limit?: number; status?: string }): Promise<{
    success: boolean;
    data: { blockedNumbers: BlockedNumber[]; pagination: Pagination };
  }> => {
    const response = await api.get('/blocked-numbers', { params });
    return response.data;
  },

  requestBlock: async (data: { phoneNumber: string; name?: string; reason?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/blocked-numbers', data);
    return response.data;
  },

  bulkBlockRequest: async (numbers: Array<{ phoneNumber: string; name?: string; reason?: string }>): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/blocked-numbers/bulk', { numbers });
    return response.data;
  },

  removeBlockedNumber: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/blocked-numbers/${id}`);
    return response.data;
  },

  checkIfBlocked: async (phoneNumber: string): Promise<{ success: boolean; data: { isBlocked: boolean } }> => {
    const response = await api.get(`/blocked-numbers/check/${phoneNumber}`);
    return response.data;
  },
};
