import { IWalletUser } from './finance';
import {IBookingFilters} from "./filters";

export interface IBooking {
  id: string;
  bookingId: number;
  hostId: number;
  userId: string;
  user: IWalletUser;
  guestId: number;
  guestName: string;
  guestPhone: string;
  amount: string;
  paidAmount: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  commission: any | null;
  createdAt: string;
  updatedAt: string;
}


export interface IBookingResponse {
  success: boolean;
  message: string;
  data: IBooking[];
  meta?: Record<string, any>;
  filters: IBookingFilters;
  pagination:IPagination;
}

