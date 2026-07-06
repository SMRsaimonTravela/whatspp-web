export type BroadcastCampaignStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled';

export type BroadcastRecipientStatus = 'pending' | 'sent' | 'failed';

export interface IBroadcastRecipient {
    id: string;
    campaignId: string;
    phoneNumber: string;
    status: BroadcastRecipientStatus;
    error?: string | null;
    sentAt?: string | null;
    createdAt: string;
}

export interface IBroadcastCampaign {
    id: string;
    message: string;
    status: BroadcastCampaignStatus;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    createdById?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    recipients?: IBroadcastRecipient[];
}

export interface IBroadcastProgress {
    campaignId: string;
    status: string;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
}
