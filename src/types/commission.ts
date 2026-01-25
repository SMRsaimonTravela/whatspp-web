import type {  IAssignedUser } from "./users.type.ts";

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
