import type {  IAssignedUser } from "../types/users.type";

// Commission rule and assigned user interfaces for admin commission rules

export interface ICommissionRule {
  id: string;
  name: string;
  scope: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    userType: string;
  };
  type: string;
  value: number;
  maxAmount: number;
  priority: number;
  status: string;
  assignedUsers: IAssignedUser[];
  createdAt: string;
  updatedAt: string;
}
