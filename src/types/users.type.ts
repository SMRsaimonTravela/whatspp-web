// User-related types for admin/host users

export interface IHostUser {
  id: string;
  name: string;
  email: string;
  businessName?: string | null;
  userType: string;
  status: string;
  whatsappNumber?: string;
  whatsappSessionId?: string | null;
  aiAutoReplyEnabled?: boolean;
  aiDisabledAt?: string | null;
  hostId?: number;
  commissionRuleId?: string;
  commissionRule?: {
    id: string;
    name: string;
    scope: string;
    userId: string;
    type: string;
    value: string;
    maxAmount: string;
    priority: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IAssignedUser {
  id: string;
  name: string;
  email: string;
  businessName?: string | null;
  userType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
