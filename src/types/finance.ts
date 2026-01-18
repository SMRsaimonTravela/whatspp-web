// Enums

import {IUser} from "./index.ts";

export type WithdrawalStatus = 'pending' | 'approved' | 'complete' | 'rejected';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type LedgerType = 'commission' | 'withdrawal' | 'refund_reversal';
export type LedgerDirection = 'credit' | 'debit';
export type CommissionScope = 'global' | 'host';
export type CommissionType = 'percentage' | 'fixed';

// Models
export interface IBooking {
    bookingId: string;
    hostId: number;
    userId: string | null;
    guestId: number;
    guestName: string;
    guestPhone: string;
    amount: number;
    paidAmount: number;
    paymentStatus: PaymentStatus;
    commission?: {
        amount: number;
        ruleId?: string;
        calculatedAt: string;
    };
    createdAt: string;
}

export interface IHostWallet {
    hostId: number;
    balance: number;
    totalPaid: number;
    totalPending: number;
    updatedAt: string;
}

export interface IWalletLedger {
    _id: string;
    hostId: number;
    bookingId?: string;
    withdrawalId?: string;
    type: LedgerType;
    direction: LedgerDirection;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
}

export interface IWithdrawalRequest {
    _id: string;
    hostId: number;
    userId:IUser;
    amount: number;
    status: WithdrawalStatus;
    note?: string;
    adminId?: string;
    transactionId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ICommissionRule {
    _id: string;
    name: string;
    scope: CommissionScope;
    hostId?: number;
    type: CommissionType;
    value: number;
    maxAmount?: number;
    priority: number;
    status: 'active' | 'inactive';
}
export interface IWalletUser {
    id: string;
    name: string;
    businessName: string;
    userType: string;
    email: string;
    whatsappNumber: string;
    whatsappSessionId: string | null;
    status: string;
    aiAutoReplyEnabled: boolean;
    aiDisabledAt: string | null;
    hostId: number;
    commissionRuleId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface IWallet {
    id: string;
    userId: string;
    user: IWalletUser;
    balance: string;
    totalPaid: string;
    totalPending: string;
    createdAt: string;
    updatedAt: string;
}

export interface IWalletTransaction {
    id: string;
    walletId: string;
    bookingId: string | null;
    withdrawalId: string | null;
    userId: string;
    type: string;
    direction: string;
    amount: string;
    balanceAfter: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface IPagination {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
}

export interface IWalletHistoryResponse {
    success: boolean;
    message: string;
    data: IWalletTransaction[];
    pagination: IPagination;
}

export interface IWithdrawalsResponse {
    success: boolean;
    message: string;
    data: IWithdrawalRequest[];
    pagination: IPagination;
}


// API Responses
export interface IHostFinancialDetails {
    host: {
        id: string;
        name: string;
        email: string;
        hostId: number;
        whatsappNumber: string;
    };
    wallet: {
        balance: number;
        totalPaid: number;
        totalPending: number;
    };
    bookings: {
        total: number;
    };
}
