import { IWalletUser } from './finance';

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

export interface IBookingFilterValue {
  label: string;
  value: string;
}

export type IBookingFilterField =
  | {
      label: string;
      placeholder: string;
      type: 'string';
    }
  | {
      label: string;
      placeholder: string;
      type: 'select';
      values: IBookingFilterValue[];
    }
  | {
      label: string;
      placeholder: string;
      type: 'daterange';
    };

export type IBookingFilters = {
  [query: string]: IBookingFilterField;
};

export interface IBookingResponse {
  success: boolean;
  message: string;
  data: IBooking[];
  meta?: Record<string, any>;
  filters: IBookingFilters;
  pagination: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

