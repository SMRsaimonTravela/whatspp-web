// Enums

import { IHostUser } from "./users.type.ts";

export type WithdrawalStatus = 'pending' | 'approved' | 'complete' | 'rejected';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type LedgerType = 'commission' | 'withdrawal' | 'refund_reversal';
export type LedgerDirection = 'credit' | 'debit';
export type CommissionScope = 'global' | 'host';
export type CommissionType = 'percentage' | 'fixed';


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
    id: string;
    hostId: number;
    userId: string;
    user: IHostUser;
    amount: number;
    status: WithdrawalStatus;
    note?: string;
    adminId?: string;
    transactionId?: string;
    createdAt: string;
    updatedAt: string;
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
