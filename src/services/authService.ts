import api from './api';
import type { AuthResponse, RegisterResponse, User } from '../types';

interface LoginPayload {
  emailOrPhone: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  businessName: string;
  email: string;
  whatsappNumber: string;
  password: string;
}

interface UpdateProfilePayload {
  name?: string;
  businessName?: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', payload);
    return response.data;
  },

  getMe: async (): Promise<{ success: boolean; data: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<{ success: boolean; data: User }> => {
    const response = await api.patch('/auth/profile', payload);
    return response.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/change-password', payload);
    return response.data;
  },
};

