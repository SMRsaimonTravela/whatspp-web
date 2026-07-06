export const SESSION_EVENTS = {
    STATUS: 'session:status',
    QR: 'session:qr',
} as const;

export const CHAT_EVENTS = {
    MESSAGE_NEW: 'message:new',
} as const;

export const GUEST_EVENTS = {
    UPDATED: 'guest:updated',
    AI_TOGGLE: 'guest:ai_toggle',
} as const;

export const FEEDBACK_EVENTS = {
    UPDATE: 'feedback:update',
} as const;

export const NOTIFICATION_EVENTS = {
    GENERAL: 'notification',
} as const;

export const BROADCAST_EVENTS = {
    PROGRESS: 'broadcast:progress',
} as const;
