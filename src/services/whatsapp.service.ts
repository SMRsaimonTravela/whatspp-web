import api from './api';
import { WhatsAppStatus, WhatsAppStatusValue } from '../constants/whatsapp';
import {ISessionsResponse, ISessionStatus} from "../types/session";
import { IBroadcastCampaign } from "../types/broadcast";

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
    getAllSessions: async (): Promise<ISessionsResponse> => {
        const response:{data:ISessionsResponse} = await api.get('/admin/whatsapp/sessions');
        return response.data;
    },
    // Admin: Get active  sessions
    getActiveSessions: async (): Promise<ISessionStatus[]> => {
        const response:{data:ISessionsResponse} = await api.get('/admin/whatsapp/sessions');
        return response.data.data.filter(x=>x.status === WhatsAppStatus.READY);
    },

    // Admin: Restart session
    restartSession: async (sessionId: string): Promise<void> => {
        await api.post(`/admin/whatsapp/sessions/${sessionId}/restart`);
    },

    // ===== Admin broadcast account (single global session, id fixed server-side) =====

    createAdminBroadcastSession: async (): Promise<WhatsAppStatus> => {
        const response = await api.post('/admin/whatsapp/broadcast-session');
        return response.data.data as WhatsAppStatus;
    },

    getAdminBroadcastStatus: async (): Promise<WhatsAppStatus> => {
        const response = await api.get('/admin/whatsapp/broadcast-session');
        return response.data.data as WhatsAppStatus;
    },

    getAdminBroadcastQRBlob: async (): Promise<Blob> => {
        const response = await api.get('/admin/whatsapp/broadcast-session/qr-image', { responseType: 'blob' });
        return response.data;
    },

    disconnectAdminBroadcast: async (): Promise<void> => {
        await api.delete('/admin/whatsapp/broadcast-session');
    },

    // ===== Bulk broadcast messages =====

    sendBroadcast: async (
        numbers: string[],
        message: string,
        imageUrl?: string
    ): Promise<{ id: string; status: string; totalRecipients: number }> => {
        const payload: { numbers: string[]; message: string; imageUrl?: string } = { numbers, message };
        if (imageUrl && imageUrl.trim()) payload.imageUrl = imageUrl.trim();
        const response = await api.post('/admin/whatsapp/broadcast', payload);
        return response.data.data;
    },

    getBroadcasts: async (params?: { page?: number; limit?: number }): Promise<{
        data: IBroadcastCampaign[];
        pagination?: { total: number; page: number; limit: number };
    }> => {
        const response = await api.get('/admin/whatsapp/broadcasts', { params });
        return response.data;
    },

    getBroadcast: async (id: string): Promise<IBroadcastCampaign> => {
        const response = await api.get(`/admin/whatsapp/broadcast/${id}`);
        return response.data.data as IBroadcastCampaign;
    },

    retryBroadcast: async (id: string): Promise<void> => {
        await api.post(`/admin/whatsapp/broadcast/${id}/retry`);
    },

    retryRecipient: async (id: string, recipientId: string): Promise<void> => {
        await api.post(`/admin/whatsapp/broadcast/${id}/recipients/${recipientId}/retry`);
    },
};

export default whatsappService;
