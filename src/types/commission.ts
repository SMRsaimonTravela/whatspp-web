import type {  IAssignedUser } from "./users.type.ts";

export type CommissionScope = 'global' | 'host';
export type CommissionType = 'percentage' | 'fixed';
export type CommissionStatus = 'active' | 'inactive';

export interface ICommissionRule {
  id: string;
  name: string;
  scope: CommissionScope;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    userType: string;
  };
  type: CommissionType;
  value: number;
  maxAmount: number;
  priority: number;
  status: CommissionStatus;
  assignedUsers: IAssignedUser[];
  createdAt: string;
  updatedAt: string;
}
