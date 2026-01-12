import { useEffect, useState, useCallback, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import api from "../../services/api";

type SessionStatus = 'pending' | 'ready' | 'auth_failure' | 'disconnected' | 'initializing' | null;

export default function WhatsAppConnection() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<SessionStatus>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // Remove API_BASE_URL, use api instance
  // const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Use sessionId from backend if available, fallback to whatsappNumber
  const sessionId = user?.whatsappNumber ? `session-${user.whatsappNumber}` : null;

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const checkSessionStatus = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Use api instance
      const response = await api.get(`/host/session/status`);
      const data = response.data?.data || {};
      setStatus(data.status || null);
      setError(data.error || null);
      if (data.status === 'ready') {
        clearPolling();
        setQrImageUrl(null);
        toast.success('WhatsApp connected successfully!');
      } else if (data.status === 'auth_failure' || data.status === 'disconnected') {
        clearPolling();
        setQrImageUrl(null);
      } else if (data.status === 'pending') {
        // Try to fetch QR image
        try {
          const qrRes = await api.get(`/host/session/qr-image`, { responseType: 'blob' });
          if (qrRes.status === 200 && qrRes.data) {
            const url = URL.createObjectURL(qrRes.data);
            setQrImageUrl(url);
          }
        } catch {
          // QR not ready yet
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: any) {
      setError('Failed to check session status');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, clearPolling]);

  const startPolling = useCallback(() => {
    clearPolling();
    pollIntervalRef.current = setInterval(() => {
      checkSessionStatus();
    }, 2000);
  }, [checkSessionStatus, clearPolling]);

  useEffect(() => {
    if (sessionId) {
      checkSessionStatus();
    } else {
      setIsLoading(false);
    }
    return () => {
      clearPolling();
    };
  }, [sessionId, checkSessionStatus, clearPolling]);

  const handleCreateSession = async () => {
    if (!user?.whatsappNumber) {
      toast.error('WhatsApp number not configured');
      return;
    }
    setIsInitializing(true);
    setError(null);
    setQrImageUrl(null);
    try {
      // Use api instance
      const response = await api.post(`/host/session`, {
        phoneNumber: user.whatsappNumber
      });
      const data = response.data?.data || {};
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create session');
      }
      setStatus('initializing'); // Set to initializing immediately after creation
      toast.success('Session initializing...');
      startPolling();
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Failed to create session';
      setError(message);
      toast.error(message);
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ready':
        return 'bg-[#25D366]'; // WhatsApp green
      case 'pending':
      case 'initializing':
        return 'bg-[#F59E0B]'; // yellow
      case 'auth_failure':
      case 'disconnected':
        return 'bg-[#EF4444]'; // red
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ready':
        return 'Connected';
      case 'pending':
        return 'Waiting for QR Scan';
      case 'initializing':
        return 'Initializing...';
      case 'auth_failure':
        return 'Authentication Failed';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Not Connected';
    }
  };

  const getButtonText = () => {
    if (isInitializing) return 'Starting...';
    if (status === 'ready') return 'Connected';
    if (status === 'pending') return 'Waiting...';
    if (status === 'initializing') return 'Initializing...';
    if (status === 'auth_failure') return 'Retry Session';
    if (status === 'disconnected') return 'Restart Session';
    return 'Create Session & Get QR';
  };

  const isButtonDisabled = () => {
    return isInitializing || status === 'ready' || status === 'pending' || status === 'initializing';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="WhatsApp Connection | Travela Host AI"
        description="Connect your WhatsApp account"
      />
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            WhatsApp Connection
          </h1>

          {/* Session ID Display */}
          {sessionId && (
            <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Session ID</p>
              <p className="font-mono text-gray-800 dark:text-white">{sessionId}</p>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`h-3 w-3 rounded-full ${getStatusColor()} ${status === 'pending' ? 'animate-pulse' : ''}`}></div>
            <span className="text-lg font-medium text-gray-800 dark:text-white">
              {getStatusText()}
            </span>
          </div>

          {/* QR Code Section */}
          {status === 'pending' && qrImageUrl && (
            <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-[#25D366] rounded-xl mb-6 bg-[#e7f9f1]">
              <p className="text-[#128C7E] text-center">
                Scan this QR code with your WhatsApp app to connect
              </p>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <img
                  src={qrImageUrl}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 object-contain"
                />
              </div>
              <p className="text-sm text-[#128C7E]">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
              </p>
            </div>
          )}

          {/* Waiting for QR */}
          {status === 'pending' && !qrImageUrl && (
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-[#25D366] rounded-xl mb-6 bg-[#e7f9f1]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#25D366]"></div>
              <p className="text-[#128C7E]">Waiting for QR code...</p>
            </div>
          )}

          {/* Connected Status */}
          {status === 'ready' && (
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-[#25D366] bg-[#e7f9f1] rounded-xl mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/20">
                <svg className="h-8 w-8 text-[#25D366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#128C7E]">
                WhatsApp Connected ✅
              </h3>
              <p className="text-[#128C7E] text-center">
                Your WhatsApp is connected and AI auto-reply is active.
              </p>
            </div>
          )}

          {/* Error/Disconnected Status */}
          {(status === 'auth_failure' || status === 'disconnected') && (
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-[#EF4444] bg-[#fef2f2] rounded-xl mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EF4444]/20">
                <svg className="h-8 w-8 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#EF4444]">
                {status === 'auth_failure' ? 'Authentication Failed' : 'Disconnected'}
              </h3>
              <p className="text-[#EF4444] text-center">
                {error || (status === 'auth_failure' ? 'Please try again with a new session.' : 'Your WhatsApp session has been disconnected.')}
              </p>
            </div>
          )}

          {/* Not Connected / Initialize */}
          {!status && (
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-[#25D366] rounded-xl mb-6 bg-[#e7f9f1]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/10">
                <svg className="h-8 w-8 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#128C7E]">
                Connect Your WhatsApp
              </h3>
              <p className="text-[#128C7E] text-center max-w-md">
                Create a session to get a QR code. Then scan the code with your WhatsApp app to connect.
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={handleCreateSession}
              disabled={isButtonDisabled()}
              className={`px-8 py-3 rounded-lg font-medium transition-colors shadow-md text-white text-lg
                ${status === 'ready'
                  ? 'bg-[#25D366] cursor-default'
                  : isButtonDisabled()
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-[#25D366] hover:bg-[#128C7E]'}
              `}
            >
              {getButtonText()}
            </button>
          </div>

          {/* Error Display */}
          {error && status !== 'auth_failure' && status !== 'disconnected' && (
            <div className="mt-4 p-4 bg-[#fef2f2] border border-[#EF4444] rounded-xl">
              <p className="text-[#EF4444]">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-[#e7f9f1] border border-[#25D366] rounded-xl">
            <h4 className="font-medium text-[#128C7E] mb-2">How to connect:</h4>
            <ol className="text-sm text-[#128C7E] space-y-1 list-decimal list-inside">
              <li>Click "Create Session & Get QR" button</li>
              <li>Wait for the QR code to appear</li>
              <li>Open WhatsApp on your phone</li>
              <li>Go to Settings → Linked Devices → Link a Device</li>
              <li>Scan the QR code with your phone</li>
              <li>Wait for the connection to be established</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
//353865559555221