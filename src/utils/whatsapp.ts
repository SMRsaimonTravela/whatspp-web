import { WhatsAppStatusValue } from '../constants/whatsapp';

export const getStatusColor = (status: WhatsAppStatusValue | null | undefined) => {
    if (!status) return 'bg-gray-400';
    switch (status) {
        case 'ready':
        case 'authenticated':
        case 'authorized':
        case 'connected':
            return 'bg-[#25D366]'; // WhatsApp green
        case 'pending':
        case 'initializing':
        case 'loading':
        case 'qr':
            return 'bg-[#F59E0B]'; // yellow
        case 'auth_failure':
        case 'failed':
        case 'error':
        case 'disconnected':
            return 'bg-[#EF4444]'; // red
        default:
            return 'bg-gray-400';
    }
};

export const getStatusText = (status: WhatsAppStatusValue | null | undefined) => {
    if (!status) return 'Not Connected';
    switch (status) {
        case 'ready':
        case 'authenticated':
        case 'authorized':
        case 'connected':
            return 'Connected';
        case 'pending':
        case 'qr':
            return 'Waiting for QR Scan';
        case 'initializing':
        case 'loading':
            return 'Initializing...';
        case 'auth_failure':
            return 'Authentication Failed';
        case 'failed':
        case 'error':
            return 'Connection Failed';
        case 'disconnected':
            return 'Disconnected';
        default:
            return 'Not Connected';
    }
};

export const getButtonText = (status: WhatsAppStatusValue | null | undefined, isInitializing?: boolean) => {
    if (isInitializing) return 'Starting...';
    if (!status) return 'Connect WhatsApp';

    switch (status) {
        case 'ready':
        case 'authenticated':
        case 'authorized':
        case 'connected':
            return 'Disconnect';
        case 'pending':
        case 'qr':
            return 'Cancel Connection';
        case 'initializing':
        case 'loading':
            return 'Initializing...';
        case 'auth_failure':
        case 'failed':
        case 'error':
            return 'Retry Session';
        case 'disconnected':
            return 'Restart Session';
        default:
            return 'Connect WhatsApp';
    }
};
