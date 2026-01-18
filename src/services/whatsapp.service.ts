import api from './api';
import { WhatsAppStatusValue } from '../constants/whatsapp';

export interface WhatsAppStatus {
    sessionId: string;
    status: WhatsAppStatusValue;
    error: string | null;
    hasQR: boolean;
}

export const whatsappService = {
    // Host: Create a new session
    createSession: async (phoneNumber: string): Promise<WhatsAppStatus> => {
        const response = await api.post('/host/whatsapp/session', { sessionId: phoneNumber });
        return response.data.data as WhatsAppStatus;
    },

    // Host/Admin: Get session status
    getSessionStatus: async (sessionId: string, isAdmin = false): Promise<WhatsAppStatus> => {
        const prefix = isAdmin ? '/admin/whatsapp/sessions' : '/host/whatsapp/session';
        const response = await api.get(`${prefix}/${sessionId}`);
        return response.data.data as WhatsAppStatus;
    },

    // Host: Get QR Image as Blob (Secure/Authenticated)
    getQRImageBlob: async (sessionId: string): Promise<Blob> => {
        const response = await api.get(`/host/whatsapp/session/${sessionId}/qr-image`, { responseType: 'blob' });
        return response.data;
    },

    // Host/Admin: Disconnect
    disconnectSession: async (sessionId: string, isAdmin = false): Promise<void> => {
        const prefix = isAdmin ? '/admin/whatsapp/sessions' : '/host/whatsapp/session';
        await api.delete(`${prefix}/${sessionId}`);
    },

    // Admin: Get all sessions
    getAllSessions: async (): Promise<{ totalActive: number; totalStored: number; sessions: any[] }> => {
        const response = await api.get('/admin/whatsapp/sessions');
        return response.data.data;
    },

    // Admin: Restart session
    restartSession: async (sessionId: string): Promise<void> => {
        await api.post(`/admin/whatsapp/sessions/${sessionId}/restart`);
    }
};

export default whatsappService;
