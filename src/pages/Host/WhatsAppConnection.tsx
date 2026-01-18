import { useEffect, useState, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import { whatsappService, WhatsAppStatus } from "../../services/whatsapp.service";
import { useSocket } from "../../context/SocketContext";
import { WhatsAppStatusValue } from "../../constants/whatsapp";
import { SESSION_EVENTS } from "../../config/socketEvent";
import {
  getStatusColor,
  getStatusText,
  getButtonText
} from "../../utils/whatsapp";

export default function WhatsAppConnection() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [base64QR, setBase64QR] = useState<string | null>(null);
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const socket = useSocket();

  // The session ID is the phone number
  const phoneNumber = user?.whatsappNumber;

  const fetchStatus = useCallback(async () => {
    if (!phoneNumber) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await whatsappService.getSessionStatus(phoneNumber);
      setStatus(data);
    } catch (err) {
      setStatus(null); // No session exists
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber]);

  const fetchQRBlob = useCallback(async () => {
    if (!phoneNumber) return;
    try {
      const blob = await whatsappService.getQRImageBlob(phoneNumber);
      const url = URL.createObjectURL(blob);
      setQrBlobUrl(url);
    } catch (err) {
      console.error('Failed to fetch QR blob:', err);
    }
  }, [phoneNumber]);

  // 1. Initial Status Fetch (Runs only on mount or if phoneNumber changes)
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // 2. Socket Event Listeners (Independent and stable)
  useEffect(() => {
    if (!socket || !phoneNumber) return;

    const onStatusUpdate = (data: { sessionId: string, status: WhatsAppStatusValue, error?: string }) => {
      if (data.sessionId === phoneNumber) {
        setStatus(prev => ({
          sessionId: phoneNumber,
          status: data.status,
          error: data.error || null,
          hasQR: data.status === 'qr' || (prev?.hasQR ?? false)
        }));

        if (['ready', 'authenticated', 'connected', 'authorized'].includes(data.status)) {
          toast.success('WhatsApp connected successfully!');
          setBase64QR(null);
          setQrBlobUrl(null);
        } else if (['auth_failure', 'failed', 'error'].includes(data.status)) {
          toast.error(data.error || 'Authentication failed');
        }
      }
    };

    const onQRUpdate = (data: { sessionId: string, qr: string }) => {
      if (data.sessionId === phoneNumber) {
        // If it's a data URI or looks like base64 image data, use it directly
        const isBase64Image = data.qr.startsWith('data:image/') || (!data.qr.includes('@') && data.qr.length > 100);

        if (isBase64Image) {
          setBase64QR(data.qr);
          setQrBlobUrl(null);
        } else {
          // It's raw QR data, resetting base64 triggers the blob fetch effect
          setBase64QR(null);
        }

        setStatus({
          sessionId: phoneNumber,
          status: 'qr',
          error: null,
          hasQR: true
        });
      }
    };

    socket.on(SESSION_EVENTS.STATUS, onStatusUpdate);
    socket.on(SESSION_EVENTS.QR, onQRUpdate);

    return () => {
      socket.off(SESSION_EVENTS.STATUS, onStatusUpdate);
      socket.off(SESSION_EVENTS.QR, onQRUpdate);
    };
  }, [socket, phoneNumber]);

  // 3. QR Blob Fetcher (On-Demand - only runs when needed)
  useEffect(() => {
    const isQRStatus = status?.status === 'qr' || (status?.status === 'pending' && status?.hasQR);
    const needsFetch = isQRStatus && !base64QR && !qrBlobUrl;

    if (needsFetch) {
      fetchQRBlob();
    }
  }, [status?.status, status?.hasQR, base64QR, qrBlobUrl, fetchQRBlob]);

  // 4. Memory Cleanup
  useEffect(() => {
    return () => {
      if (qrBlobUrl) URL.revokeObjectURL(qrBlobUrl);
    };
  }, [qrBlobUrl]);

  const handleCreateSession = async () => {
    if (!phoneNumber) {
      toast.error('WhatsApp number not configured');
      return;
    }
    setIsInitializing(true);
    setBase64QR(null);
    setQrBlobUrl(null);
    try {
      const data = await whatsappService.createSession(phoneNumber);
      setStatus(data);
      toast.success('Session initializing...');
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Failed to create session';
      toast.error(message);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!phoneNumber) return;
    const currentStatus = status?.status;
    const isConnected = ['ready', 'authenticated', 'connected', 'authorized'].includes(currentStatus || '');

    if (isConnected && !window.confirm('Are you sure you want to disconnect?')) return;

    try {
      await whatsappService.disconnectSession(phoneNumber);
      setStatus(null);
      setBase64QR(null);
      setQrBlobUrl(null);
      toast.success('Disconnected successfully');
    } catch (err: any) {
      toast.error('Failed to disconnect');
    }
  };

  const handleButtonClick = () => {
    const currentStatus = status?.status;
    const isCancelable = currentStatus === 'pending' || currentStatus === 'qr' || currentStatus === 'initializing' || currentStatus === 'loading';
    const isConnected = ['ready', 'authenticated', 'connected', 'authorized'].includes(currentStatus || '');

    if (isConnected || isCancelable) {
      handleDisconnect();
    } else {
      handleCreateSession();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  const currentStatus = status?.status;
  const showQR = currentStatus === 'qr' || (currentStatus === 'pending' && (base64QR || qrBlobUrl || status?.hasQR));
  const isInitializingState = currentStatus === 'initializing' || currentStatus === 'loading' || isInitializing;
  const isConnected = ['ready', 'authenticated', 'connected', 'authorized'].includes(currentStatus || '');
  const isError = ['auth_failure', 'failed', 'error', 'disconnected'].includes(currentStatus || '');

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

          {/* Phone Number Display */}
          {phoneNumber && (
            <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp Number</p>
              <p className="font-mono text-gray-800 dark:text-white">{phoneNumber}</p>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`h-3 w-3 rounded-full ${getStatusColor(currentStatus)} ${isInitializingState || currentStatus === 'pending' || currentStatus === 'qr' ? 'animate-pulse' : ''}`}></div>
            <span className="text-lg font-medium text-gray-800 dark:text-white">
              {getStatusText(currentStatus)}
            </span>
          </div>

          {/* QR Code Section */}
          {showQR && (
            <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-[#25D366] rounded-xl mb-6 bg-[#e7f9f1] dark:bg-[#e7f9f1]/10">
              <p className="text-[#128C7E] text-center font-medium">
                Scan this QR code with your WhatsApp app to connect
              </p>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                {(base64QR || qrBlobUrl) ? (
                  <img
                    src={base64QR ? (base64QR.startsWith('data:') ? base64QR : `data:image/png;base64,${base64QR}`) : qrBlobUrl!}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 object-contain"
                  />
                ) : (
                  <div className="w-64 h-64 flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#25D366]"></div>
                    <p className="text-sm text-gray-500">Loading QR code...</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-[#128C7E] text-center">
                Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
              </p>
            </div>
          )}

          {/* Initializing */}
          {isInitializingState && !showQR && (
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-[#25D366] rounded-xl mb-6 bg-[#e7f9f1] dark:bg-[#e7f9f1]/10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#25D366]"></div>
              <p className="text-[#128C7E]">Initializing WhatsApp session... please wait.</p>
            </div>
          )}

          {/* Connected Status */}
          {isConnected && (
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-[#25D366] bg-[#e7f9f1] dark:bg-[#e7f9f1]/10 rounded-xl mb-6">
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
          {isError && (
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-[#EF4444] bg-[#fef2f2] dark:bg-[#fef2f2]/10 rounded-xl mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EF4444]/20">
                <svg className="h-8 w-8 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#EF4444]">
                {currentStatus === 'disconnected' ? 'Disconnected' : 'Connection Failed'}
              </h3>
              <p className="text-[#EF4444] text-center">
                {status?.error || (currentStatus === 'disconnected' ? 'Your WhatsApp session has been disconnected.' : 'Please try again with a new session.')}
              </p>
            </div>
          )}

          {/* Not Connected */}
          {!status && !isInitializingState && (
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-[#25D366] rounded-xl mb-6 bg-[#e7f9f1] dark:bg-[#e7f9f1]/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/10">
                <svg className="h-8 w-8 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
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
              onClick={handleButtonClick}
              disabled={isInitializingState}
              className={`rounded-lg font-medium transition-all shadow-md text-white
                ${isConnected || (currentStatus === 'pending' || currentStatus === 'qr' || currentStatus === 'initializing' || currentStatus === 'loading')
                  ? 'bg-red-500 hover:bg-red-600 px-6 py-2 text-sm'
                  : isInitializingState
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed px-8 py-3 text-lg'
                    : 'bg-[#25D366] hover:bg-[#128C7E] px-8 py-3 text-lg'}
              `}
            >
              {getButtonText(currentStatus, isInitializing)}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-[#e7f9f1] dark:bg-[#e7f9f1]/10 border border-[#25D366] rounded-xl">
            <h4 className="font-medium text-[#128C7E] mb-2">How to connect:</h4>
            <ol className="text-sm text-[#128C7E] space-y-1 list-decimal list-inside">
              <li>Click "Connect WhatsApp" button</li>
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
