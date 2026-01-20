 export interface ISessionStatus {
     sessionId: string;
     status: 'initializing' | 'pending' | 'ready' | 'disconnected' | 'stored' | 'authenticated' | 'auth_failure';
     connected?: boolean;
     hasQR?: boolean;
     isActive?: boolean;
     webhookUrl?: string;
     error?: string | null;
     createdAt?: string;
     updatedAt?: string;
}
export interface ISessionsResponse {
    message: string;
    success: string;
    data: ISessionStatus[];
}