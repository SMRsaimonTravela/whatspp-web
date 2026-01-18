// User Types
export interface IUser {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  whatsappNumber?: string;
  userType: 'host' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  aiAutoReplyEnabled: boolean;
  whatsappSessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: IUser;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
}

// Message Types
export interface Message {
  _id: string;
  hostId: string;
  guestId: string;
  guestNumber: string;
  prompt: string;
  reply?: string;
  messageType: string;
  audioTranscription?: string;
  feedback?: 'positive' | 'negative' | 'neutral' | 'resolve';
  feedbackNote?: string;
  feedbackResolvedAt?: string | null;
  whatsappMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageStats {
  totalMessages: number;
  totalGuests: number;
  feedback: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

// Guest Types
export interface Guest {
  _id: string;
  hostId: string;
  name?: string;
  whatsappNumber: string;
  originalNumber?: string;
  notifyName?: string;
  aiAutoReplyEnabled: boolean;
  totalMessages: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Blocked Number Types
export interface BlockedNumber {
  id: string;
  hostId?: string;
  phoneNumber: string;
  name?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestSource?: string;
  createdAt: string;
}

// Session Types
export interface Session {
  sessionId: string;
  status: 'initializing' | 'pending' | 'ready' | 'disconnected' | 'stored' | 'authenticated' | 'auth_failure';
  connected?: boolean;
  hasQR?: boolean;
  isActive?: boolean;
  webhookUrl?: string;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionQR {
  status: 'qr_ready' | 'waiting_for_qr' | 'already_connected';
  qr?: string | null;
}

// Settings Types
export interface Setting {
  id: string;
  key: string;
  value: number | string | boolean;
  description: string;
  category: 'ai' | 'rate_limiting' | 'general' | 'custom';
}

// Pagination Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[];
  } & {
    pagination: Pagination;
  };
}

// Host Types
export interface Host {
  id: string;
  name: string;
  businessName: string;
  email: string;
  whatsappNumber: string;
  userType: 'host';
  status: 'pending' | 'approved' | 'rejected';
  aiAutoReplyEnabled: boolean;
  whatsappSessionId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HostsResponse {
  success: boolean;
  data: {
    users: Host[];
    pagination: Pagination;
  };
}

export interface HostDetailResponse {
  success: boolean;
  data: Host;
}

// Updated GuestsResponse to match spec
export interface GuestsResponse {
  success: boolean;
  data: {
    guests: Guest[];
    pagination: Pagination;
  };
}

// Updated MessagesResponse to match spec
export interface MessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
    pagination: Pagination;
  };
}

export interface ConversationResponse {
  success: boolean;
  data: {
    guest: Guest;
    messages: Message[];
    pagination: Pagination;
  };
}

// API Query Parameters
export interface HostsQueryParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected';
  search?: string;
}

export interface GuestsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface MessagesQueryParams {
  page?: number;
  limit?: number;
  guestNumber?: string;
  startDate?: string;
  endDate?: string;
}

// Analytics Types
export interface IAnalyticsData {
  adminUsers: number;
  hostUsers: number;
  pendingUsers: number;
  pendingBlockRequests: number;
  bookingRequests: number;
  todayMessages: number;
  totalMessages: number;
}

export interface IAnalyticsApiResponse {
  success: boolean;
  data: IAnalyticsData;
  error?: string;
}

export interface IAdminFeedbacksResponse {
  success: boolean;
  data: {
    messages: IMessage[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface IMessage {
  _id: string;
  hostId: string;
  guestId: string;
  guestNumber: string;
  prompt: string;
  reply?: string;
  messageType: string;
  audioTranscription?: string | null;
  feedback?: 'positive' | 'negative' | 'neutral' | 'resolve';
  feedbackNote?: string;
  feedbackResolvedAt?: string | null;
  whatsappMessageId?: string;
  createdAt: string;
  updatedAt: string;
}
