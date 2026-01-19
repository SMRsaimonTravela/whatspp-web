import { IHostUser } from './users.type';

export interface IWithdrawal {
    id: string;
    hostId: number | null;
    userId: string;
    user: IHostUser;
    amount: string;
    status: string;
    adminId: string | null;
    note: string;
    transactionId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface IWithdrawalResponse {
    success: boolean;
    message: string;
    data: IWithdrawal[];
    pagination: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
}
