import { IWalletUser } from './finance';
import { IBookingFilters } from './filters.d';

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
  commission: {
    ruleId?: string;
    amount?: number;
    calculatedAt?: Date;
  } | null;
  createdAt: string;
  updatedAt: string;
  checkIn:Date;
  checkOut:Date;
  bookingData:ITravelaBookingDataType
}


export interface IBookingResponse {
  success: boolean;
  message: string;
  data: IBooking[];
  meta?: Record<string, string | number | boolean | object>;
  filters: IBookingFilters;
  pagination:IPagination;
}




export interface ITravelaBookingDataType {
  id: number;
  formatted_id: string;
  guest: ITravelaUser;
  host: ITravelaUser;
  listing: ITravelaListing;
  images: ITravelaImage[];
  from: string;
  to: string;
  is_complete: boolean;
  total_guest: number;
  price: number;
  commission: number;
  guest_details: ITravelaGuestDetails;
  discount: number;
  more_nights_discount: number;
  total_payable: number;
  extra_guest_charge: number;
  service_fee: string;
  paid: number;
  status: "Confirmed" | "Pending" | "Cancelled" | string;
  created_at: string;
  status_updated_at: string | null;
  is_expire: boolean;
  os_platform: number;
  payment: ITravelaPayment;
  is_nid_view_enabled: boolean;
}

export interface ITravelaUser {
  id: number;
  first_name: string;
  last_name: string;
  refer_code: string;
  status: number;
  image: ITravelaImage | null;
  phone: string;
}

export interface ITravelaImage {
  id: number;
  url: string;
  priority: number | null;
}

export interface ITravelaListing {
  id: number;
  title: string;
  place_type: string;
  max_guest: number;
  max_child: number;
  max_infant: number;
  min_nights: number;
  free_guest: number | null;
  bedroom: number;
  beds: number;
  bathroom: number;
  price: number;
  weekend_price: number;
  per_guest_amount: number;
  check_in: string;
  check_out: string;
  created_at: string;
  average_rating: number;
  average_response: number;
  total_average: number;
  commission_rate: number;
  commission_expired_date: string;
  custom_min_commission: number | null;
  custom_commission: number | null;
  total_count: number;
  showable_price: number;
  type: string;
  advance: string;
  commission: number;
  before_discount: number | null;
  average_price: number | null;
  location: ITravelaLocation;
  property_type: ITravelaPropertyType;
  rank: number | null;
  status: string;
  reviews_count: number;
  reviews_avg: number;
  cancellation: ITravelaCancellation;
}

export interface ITravelaLocation {
  lat: number;
  lng: number;
}

export interface ITravelaPropertyType {
  id: number;
  name: string;
  description: string;
}

export interface ITravelaCancellation {
  body: string;
  title: string;
  for_host: string;
  day: number;
}

export interface ITravelaGuestDetails {
  adult: number;
  child: number;
  infant: number;
}

export interface ITravelaPayment {
  need_bkash_agreement: boolean;
}
