import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageMeta from "../../components/common/PageMeta";
import { useSocket } from "../../context/SocketContext";
import { whatsappService } from "../../services/whatsapp.service";
import type { WhatsAppStatus } from "../../services/whatsapp.service";
import { WhatsAppStatusValue } from "../../constants/whatsapp";
import { SESSION_EVENTS, BROADCAST_EVENTS } from "../../config/socketEvent";
import { getStatusColor, getStatusText, getButtonText } from "../../utils/whatsapp";
import type {
  IBroadcastCampaign,
  IBroadcastProgress,
} from "../../types/broadcast";

// Fixed, single global admin broadcast session id (matches backend constant).
const ADMIN_BROADCAST_SESSION_ID = "admin-broadcast";
const MAX_RECIPIENTS = 1000;

const CONNECTED_STATES = ["ready", "authenticated", "connected", "authorized"];
const CANCELABLE_STATES = ["pending", "qr", "initializing", "loading"];

function parseNumbers(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case "completed":
      return "bg-[#25D366]/15 text-[#128C7E]";
    case "processing":
    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "failed":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  }
}

export default function WhatsAppBroadcast() {
  const socket = useSocket();

  // ---- Connection state ----
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  // ---- Compose state ----
  const [numbersText, setNumbersText] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // ---- History state ----
  const [campaigns, setCampaigns] = useState<IBroadcastCampaign[]>([]);
  const [selected, setSelected] = useState<IBroadcastCampaign | null>(null);

  const currentStatus = status?.status;
  const isConnected = CONNECTED_STATES.includes(currentStatus || "");
  const isCancelable = CANCELABLE_STATES.includes(currentStatus || "");
  const isInitializingState =
    currentStatus === "initializing" || currentStatus === "loading" || isInitializing;

  const parsedNumbers = useMemo(() => parseNumbers(numbersText), [numbersText]);
  const uniqueCount = useMemo(() => new Set(parsedNumbers).size, [parsedNumbers]);
  const tooMany = uniqueCount > MAX_RECIPIENTS;

  // ---- Data loading ----
  const fetchStatus = useCallback(async () => {
    try {
      const data = await whatsappService.getAdminBroadcastStatus();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  const fetchQRBlob = useCallback(async () => {
    try {
      const blob = await whatsappService.getAdminBroadcastQRBlob();
      setQrBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Failed to fetch admin QR:", err);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await whatsappService.getBroadcasts({ page: 1, limit: 50 });
      setCampaigns(res.data || []);
    } catch (err) {
      console.error("Failed to load broadcasts:", err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    loadCampaigns();
  }, [fetchStatus, loadCampaigns]);

  // ---- Socket: connection status + QR ----
  useEffect(() => {
    if (!socket) return;

    const onStatus = (data: { sessionId: string; status: WhatsAppStatusValue; error?: string }) => {
      if (data.sessionId !== ADMIN_BROADCAST_SESSION_ID) return;
      setStatus({
        sessionId: ADMIN_BROADCAST_SESSION_ID,
        status: data.status,
        error: data.error || null,
        hasQR: data.status === "qr" || data.status === "pending",
      });
      if (CONNECTED_STATES.includes(data.status)) {
        toast.success("Admin WhatsApp connected!");
        setQrBlobUrl(null);
      } else if (["auth_failure", "failed", "error"].includes(data.status)) {
        toast.error(data.error || "Authentication failed");
      }
    };

    const onQR = (data: { sessionId: string; qr: string }) => {
      if (data.sessionId !== ADMIN_BROADCAST_SESSION_ID) return;
      setStatus({
        sessionId: ADMIN_BROADCAST_SESSION_ID,
        status: "qr",
        error: null,
        hasQR: true,
      });
      // Always (re)fetch the rendered PNG from the authenticated endpoint.
      fetchQRBlob();
    };

    socket.on(SESSION_EVENTS.STATUS, onStatus);
    socket.on(SESSION_EVENTS.QR, onQR);
    return () => {
      socket.off(SESSION_EVENTS.STATUS, onStatus);
      socket.off(SESSION_EVENTS.QR, onQR);
    };
  }, [socket, fetchQRBlob]);

  // ---- Socket: broadcast progress ----
  useEffect(() => {
    if (!socket) return;
    const onProgress = (p: IBroadcastProgress) => {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === p.campaignId
            ? { ...c, status: p.status as IBroadcastCampaign["status"], sentCount: p.sentCount, failedCount: p.failedCount, totalRecipients: p.totalRecipients }
            : c
        )
      );
      setSelected((prev) =>
        prev && prev.id === p.campaignId
          ? { ...prev, status: p.status as IBroadcastCampaign["status"], sentCount: p.sentCount, failedCount: p.failedCount }
          : prev
      );
    };
    socket.on(BROADCAST_EVENTS.PROGRESS, onProgress);
    return () => {
      socket.off(BROADCAST_EVENTS.PROGRESS, onProgress);
    };
  }, [socket]);

  // ---- QR blob fetch when status flips to qr and we don't have one yet ----
  useEffect(() => {
    if ((currentStatus === "qr" || (currentStatus === "pending" && status?.hasQR)) && !qrBlobUrl) {
      fetchQRBlob();
    }
  }, [currentStatus, status?.hasQR, qrBlobUrl, fetchQRBlob]);

  useEffect(() => {
    return () => {
      if (qrBlobUrl) URL.revokeObjectURL(qrBlobUrl);
    };
  }, [qrBlobUrl]);

  // Refresh a selected campaign's recipients when opened / after progress settles
  const refreshSelected = useCallback(async (id: string) => {
    try {
      const full = await whatsappService.getBroadcast(id);
      setSelected(full);
    } catch (err) {
      console.error("Failed to load campaign detail:", err);
    }
  }, []);

  // ---- Handlers ----
  const handleConnectToggle = async () => {
    if (isConnected || isCancelable) {
      if (isConnected && !window.confirm("Disconnect the admin WhatsApp account?")) return;
      try {
        await whatsappService.disconnectAdminBroadcast();
        setStatus(null);
        setQrBlobUrl(null);
        toast.success("Disconnected");
      } catch {
        toast.error("Failed to disconnect");
      }
      return;
    }
    setIsInitializing(true);
    setQrBlobUrl(null);
    try {
      const data = await whatsappService.createAdminBroadcastSession();
      setStatus(data);
      toast.success("Initializing... scan the QR when it appears");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to start session");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSend = async () => {
    if (!isConnected) {
      toast.error("Connect the admin WhatsApp account first");
      return;
    }
    if (uniqueCount === 0) {
      toast.error("Add at least one recipient number");
      return;
    }
    if (tooMany) {
      toast.error(`Maximum ${MAX_RECIPIENTS} numbers per broadcast`);
      return;
    }
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    setIsSending(true);
    try {
      await whatsappService.sendBroadcast(parsedNumbers, message.trim());
      toast.success(`Broadcast queued for ${uniqueCount} recipient(s)`);
      setNumbersText("");
      setMessage("");
      await loadCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to queue broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const handleView = async (campaign: IBroadcastCampaign) => {
    setSelected(campaign);
    await refreshSelected(campaign.id);
  };

  const handleRetryAll = async (id: string) => {
    try {
      await whatsappService.retryBroadcast(id);
      toast.success("Retrying failed recipients");
      await refreshSelected(id);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Retry failed");
    }
  };

  const handleRetryOne = async (campaignId: string, recipientId: string) => {
    try {
      await whatsappService.retryRecipient(campaignId, recipientId);
      toast.success("Retrying recipient");
      await refreshSelected(campaignId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Retry failed");
    }
  };

  return (
    <>
      <PageMeta title="WhatsApp Broadcast | Admin" description="Connect the admin WhatsApp account and send bulk messages" />
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">WhatsApp Broadcast</h1>

        {/* Connection panel */}
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${getStatusColor(currentStatus)} ${
                  isInitializingState || currentStatus === "pending" || currentStatus === "qr" ? "animate-pulse" : ""
                }`}
              />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Admin broadcast account</p>
                <p className="font-medium text-gray-800 dark:text-white">{getStatusText(currentStatus)}</p>
              </div>
            </div>
            <button
              onClick={handleConnectToggle}
              disabled={isInitializingState || isLoadingStatus}
              className={`rounded-lg px-6 py-2 text-sm font-medium text-white shadow-md transition-all ${
                isConnected || isCancelable
                  ? "bg-red-500 hover:bg-red-600"
                  : isInitializingState
                  ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-[#25D366] hover:bg-[#128C7E]"
              }`}
            >
              {getButtonText(currentStatus, isInitializing)}
            </button>
          </div>

          {(currentStatus === "qr" || (currentStatus === "pending" && status?.hasQR)) && (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#25D366] bg-[#e7f9f1] p-6 dark:bg-[#e7f9f1]/10">
              <p className="font-medium text-[#128C7E]">Scan with WhatsApp → Settings → Linked Devices → Link a Device</p>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                {qrBlobUrl ? (
                  <img src={qrBlobUrl} alt="Admin WhatsApp QR" className="h-64 w-64 object-contain" />
                ) : (
                  <div className="flex h-64 w-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-[#25D366]" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Compose */}
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">New Broadcast</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Recipient numbers
              </label>
              <textarea
                value={numbersText}
                onChange={(e) => setNumbersText(e.target.value)}
                rows={10}
                placeholder={"Paste numbers separated by comma or new line, e.g.\n8801712345678\n01712345678\n+1 202 555 0123"}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 focus:border-[#25D366] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className={`mt-1 text-sm ${tooMany ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
                {uniqueCount} unique number(s){tooMany ? ` — exceeds max of ${MAX_RECIPIENTS}` : ""}
              </p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
                placeholder="Type the message to send to everyone..."
                className="w-full flex-1 rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 focus:border-[#25D366] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Local numbers (01…) are treated as Bangladesh; international numbers are sent as-is. Sent slowly to avoid spam blocks.
            </p>
            <button
              onClick={handleSend}
              disabled={isSending || !isConnected || uniqueCount === 0 || tooMany || !message.trim()}
              className="rounded-lg bg-[#25D366] px-6 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-600"
            >
              {isSending ? "Queuing..." : "Send Broadcast"}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">History</h2>
            <button onClick={loadCampaigns} className="text-sm text-[#128C7E] hover:underline">
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 dark:text-gray-400">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Message</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Progress</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No broadcasts yet
                    </td>
                  </tr>
                )}
                {campaigns.map((c) => {
                  const done = c.sentCount + c.failedCount;
                  const pct = c.totalRecipients ? Math.round((done / c.totalRecipients) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="max-w-[220px] truncate py-3 pr-4 text-gray-800 dark:text-gray-200" title={c.message}>
                        {c.message}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                        {new Date(c.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClasses(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div className="h-full bg-[#25D366]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {c.sentCount}✓ / {c.failedCount}✗ / {c.totalRecipients}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <button onClick={() => handleView(c)} className="mr-3 text-[#128C7E] hover:underline">
                          View
                        </button>
                        {c.failedCount > 0 && (
                          <button onClick={() => handleRetryAll(c.id)} className="text-amber-600 hover:underline">
                            Retry failed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-[9998] flex justify-end bg-black/40" onClick={() => setSelected(null)}>
          <div
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Campaign detail</h3>
                <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{selected.message}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="mb-4 flex items-center gap-4 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClasses(selected.status)}`}>
                {selected.status}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {selected.sentCount} sent · {selected.failedCount} failed · {selected.totalRecipients} total
              </span>
              {selected.failedCount > 0 && (
                <button
                  onClick={() => handleRetryAll(selected.id)}
                  className="ml-auto rounded-lg bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600"
                >
                  Retry all failed
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-500 dark:text-gray-400">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">Number</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.recipients || []).map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 pr-4 font-mono text-gray-800 dark:text-gray-200">{r.phoneNumber}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.status === "sent"
                              ? "bg-[#25D366]/15 text-[#128C7E]"
                              : r.status === "failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-500 dark:text-gray-400">{r.error || "—"}</td>
                      <td className="py-2 pr-4 text-right">
                        {r.status === "failed" && (
                          <button
                            onClick={() => handleRetryOne(selected.id, r.id)}
                            className="text-xs text-amber-600 hover:underline"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!selected.recipients || selected.recipients.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        Loading recipients...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
