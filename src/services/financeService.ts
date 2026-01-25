import api from './api';
import {
    IWithdrawalRequest,
    IHostFinancialDetails,
    IWalletLedger,
    IWallet,
    IWalletHistoryResponse, IWithdrawalsResponse
} from '../types/finance';
import {ICommissionRule} from "../types/commission.ts";
import {IBookingResponse} from "../types/booking";

// --- HOST APIs ---

/** Get current logged-in host's wallet stats */
export const getHostWallet = async (): Promise<IWallet> => {
    const res = await api.get('/host/wallet');
    const data = res.data.data;
    // Transform to IWallet
    return {
        id: data.id,
        userId: data.userId,
        user: data.user,
        balance: data.balance,
        totalPaid: data.totalPaid,
        totalPending: data.totalPending,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
};

/** Get host transaction history (paginated) */
export const getHostWalletHistory = async (page = 1): Promise<IWalletHistoryResponse> => {
    const res = await api.get(`/host/wallet/history?page=${page}`);
    const response = res.data;
    return {
        success: response.success,
        message: response.message,
        data: response.data,
        pagination: response.pagination,
    };
};

/** Get host's bookings list (paginated, with filters) */
export const getHostBookings = async (
    page = 1,
    filters: Record<string, string | number | boolean> = {}
): Promise<IBookingResponse> => {
    const res = await api.get('/host/bookings', {
        params: { page, ...filters }
    });
    return res.data
};

/** Get global bookings list with admin filters */
export const getAdminBookings = async (
    page = 1,
    filters: Record<string, string | number | boolean> = {}
): Promise<IBookingResponse> => {
    const res = await api.get('/admin/bookings', {
        params: { page, ...filters }
    });
    return res.data
};

/** Request a new withdrawal */
export const requestWithdrawal = async (amount: number, note?: string): Promise<IWithdrawalRequest> => {
    const res = await api.post('/host/wallet/withdrawal', { amount, note });
    return res.data.data;
};

/** Get withdrawals (paginated) */
export const getWithdrawals = async (page = 1, limit = 20): Promise<IWithdrawalsResponse> => {
    const res = await api.get('/host/wallet/withdrawals', { params: { page, limit } });
    return res.data;
};

// --- ADMIN APIs ---

/** Create or update a commission rule */
export const createCommissionRule = async (rule: Partial<ICommissionRule>): Promise<ICommissionRule> => {
    const res = await api.post('/admin/commission-rules', rule);
    return res.data.data;
};

/** Get all commission rules */
export const getCommissionRules = async (): Promise<ICommissionRule[]> => {
    const res:{data: {data:ICommissionRule[]}} = await api.get('/admin/commission-rules');
    return res.data.data;
};
/** Get all withdrawal requests by status */
export const getAdminWithdrawals = async (status?: string, page = 1) => {
    const res = await api.get('/admin/wallet/withdrawals', { params: { status, page } });
    return res.data;
};

export const approveWithdrawal = async (id: string) => {
    const res = await api.patch(`/admin/withdrawals/${id}/approve`);
    return res.data.data;
};

export const rejectWithdrawal = async (id: string, reason: string) => {
    const res = await api.patch(`/admin/withdrawals/${id}/reject`, { reason });
    return res.data.data;
};

export const completeWithdrawal = async (id: string, transactionId: string) => {
    const res = await api.patch(`/admin/withdrawals/${id}/complete`, { transactionId });
    return res.data.data;
};

/** Get basic host info and wallet overview */
export const getAdminHostDetails = async (userId: string): Promise<IHostFinancialDetails> => {
    const res = await api.get(`/admin/hosts/${userId}/details`);
    return res.data.data;
};

/** Get paginated transactions for a specific host */
export const getAdminHostTransactions = async (userId: string, page = 1) => {
    const res = await api.get(`/admin/hosts/${userId}/transactions?page=${page}`);
    return res.data.data as { history: IWalletLedger[]; total: number };
};

/** Link or update a Travela Host ID for a specific user */
export const updateHostId = async (userId: string, hostId: number) => {
    const res = await api.patch(`/admin/hosts/${userId}/update-host-id`, { hostId });
    return res.data.data;
};

/** Update a commission rule */
export const updateCommissionRule = async (id: string, payload: Partial<ICommissionRule>) => {
    const res = await api.patch(`/admin/commission-rules/${id}`, payload);
    return res.data;
};

/** Update commission rule status */
export const updateCommissionRuleStatus = async (id: string, status: string) => {
    const res = await api.patch(`/admin/commission-rules/${id}/status`, { status });
    return res.data;
};

/** Assign users to a commission rule */
export const assignCommissionRuleUsers = async (id: string, userIds: string[]) => {
    const res = await api.post(`/admin/commission-rules/${id}/assign`, { userIds });
    return res.data;
};

export const financeService = {
    getHostWallet,
    getHostWalletHistory,
    getHostBookings,
    requestWithdrawal,
    createCommissionRule,
    getCommissionRules,
    getAdminBookings,
    getAdminWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    completeWithdrawal,
    getAdminHostDetails,
    getAdminHostTransactions,
    updateHostId,
    getWithdrawals,
    updateCommissionRule,
    updateCommissionRuleStatus,
    assignCommissionRuleUsers
};
