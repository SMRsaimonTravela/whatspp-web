export const WhatsAppStatus = {
    LOADING: 'loading',
    INITIALIZING: 'initializing',
    PENDING: 'pending',
    QR: 'qr',
    AUTHENTICATED: 'authenticated',
    AUTHORIZED: 'authorized',
    CONNECTED: 'connected',
    READY: 'ready',
    DISCONNECTED: 'disconnected',
    AUTH_FAILURE: 'auth_failure',
    FAILED: 'failed',
    ERROR: 'error',
} as const;

export type WhatsAppStatusValue = typeof WhatsAppStatus[keyof typeof WhatsAppStatus];
