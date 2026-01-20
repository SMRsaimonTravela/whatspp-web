import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { whatsappService } from "../../services/whatsapp.service";
import type { Session } from "../../types";
import { Modal } from "../../components/ui/modal";
import toast from "react-hot-toast";
import {ISessionStatus} from "../../types/session";

export default function Sessions() {
  const [sessions, setSessions] = useState<ISessionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await whatsappService.getAllSessions();
      setSessions(data.data);

    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (sessionId: string) => {
    try {
      const data = await whatsappService.getSessionStatus(sessionId, true);
      setSelectedSession(data as any);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Failed to load session details:", error);
      toast.error("Failed to load session details");
    }
  };

  const handleRestart = async (sessionId: string) => {
    if (!confirm("Are you sure you want to restart this session?")) return;
    try {
      await whatsappService.restartSession(sessionId);
      toast.success("Session restart triggered");
      loadSessions();
    } catch (error) {
      console.error("Failed to restart session:", error);
    }
  };

  const handleDestroy = async (sessionId: string) => {
    if (!confirm("Are you sure you want to disconnect this session?")) return;
    try {
      await whatsappService.disconnectSession(sessionId, true);
      toast.success("Session disconnected");
      loadSessions();
    } catch (error) {
      console.error("Failed to disconnect session:", error);
    }
  };

  const handleDestroyAll = async () => {
    toast.error("Bulk destroy not implemented in new API yet.");
  };

  const getStatusBadge = (session: Session) => {
    // if (!session.isActive) {
    //   return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">Stored</span>;
    // }
    switch (session.status) {
      case 'ready':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400">Ready</span>;
      case 'pending':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">Pending</span>;
      case 'initializing':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">Initializing</span>;
      case 'disconnected':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400">Disconnected</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">{session.status}</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <PageMeta
        title="Session Management | WhatsApp AI Bot"
        description="Manage WhatsApp sessions"
      />
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Sessions</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{sessions.filter(x=>x.status === "ready").length}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
                <svg className="h-6 w-6 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stored Sessions</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{sessions.length}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20">
                <svg className="h-6 w-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Sessions
            </h1>
            <div className="flex gap-2">
              <button
                onClick={loadSessions}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Refresh
              </button>
              <button
                onClick={handleDestroyAll}
                className="px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600"
              >
                Destroy All
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No sessions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Session ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Active</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.sessionId} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <p className="text-sm font-mono text-gray-800 dark:text-white">
                          {session.sessionId}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(session)}
                      </td>
                      <td className="py-3 px-4">
                        {session.status === "ready" ? (
                          <span className="inline-flex h-2 w-2 rounded-full bg-success-500"></span>
                        ) : (
                          <span className="inline-flex h-2 w-2 rounded-full bg-gray-400"></span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(session.updatedAt)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(session.sessionId)}
                            className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                          >
                            Details
                          </button>
                          {session.isActive && (
                            <>
                              <button
                                onClick={() => handleRestart(session.sessionId)}
                                className="text-warning-500 hover:text-warning-600 text-sm"
                              >
                                Restart
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDestroy(session.sessionId)}
                            className="text-error-500 hover:text-error-600 text-sm"
                          >
                            Destroy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} className="max-w-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Session Details</h2>
        {selectedSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Session ID</p>
                <p className="font-mono text-gray-800 dark:text-white">{selectedSession.sessionId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <p>{getStatusBadge(selectedSession)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connected</p>
                <p className="text-gray-800 dark:text-white">{selectedSession.status === "ready" ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Has QR</p>
                <p className="text-gray-800 dark:text-white">{selectedSession.hasQR ? "Yes" : "No"}</p>
              </div>
              {selectedSession.webhookUrl && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Webhook URL</p>
                  <p className="font-mono text-sm text-gray-800 dark:text-white break-all">{selectedSession.webhookUrl}</p>
                </div>
              )}
              {selectedSession.error && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Error</p>
                  <p className="text-error-500">{selectedSession.error}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                <p className="text-gray-800 dark:text-white">{formatDate(selectedSession.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Updated At</p>
                <p className="text-gray-800 dark:text-white">{formatDate(selectedSession.updatedAt)}</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

