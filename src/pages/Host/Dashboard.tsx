import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { hostService } from "../../services/hostService";
import { useAuthStore } from "../../store/authStore";
import type { MessageStats } from "../../types";
import { Link } from "react-router";

export default function HostDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [aiEnabled, setAiEnabled] = useState(user?.aiAutoReplyEnabled ?? true);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, aiRes] = await Promise.all([
        hostService.getMessageStats(),
        hostService.getAIStatus(),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (aiRes.success) setAiEnabled(aiRes.data.aiAutoReplyEnabled);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAI = async () => {
    setIsToggling(true);
    try {
      const response = await hostService.toggleAI(!aiEnabled);
      if (response.success) {
        setAiEnabled(!aiEnabled);
      }
    } catch (error) {
      console.error("Failed to toggle AI:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const positiveRate = stats
    ? Math.round(
        (stats.feedback.positive /
          (stats.feedback.positive + stats.feedback.negative + stats.feedback.neutral || 1)) *
          100
      )
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Host Dashboard | WhatsApp AI Bot"
        description="Manage your WhatsApp AI auto-reply bot"
      />
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Welcome, {user?.name}!
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {user?.businessName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                AI Auto-Reply
              </span>
              <button
                onClick={handleToggleAI}
                disabled={isToggling}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aiEnabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                } ${isToggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {stats?.totalMessages ?? 0}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20">
                <svg className="h-6 w-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Guests</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {stats?.totalGuests ?? 0}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
                <svg className="h-6 w-6 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Positive Feedback</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {positiveRate}%
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
                <svg className="h-6 w-6 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Negative Feedback</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {stats?.feedback.negative ?? 0}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/20">
                <svg className="h-6 w-6 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/host/whatsapp"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
                <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white">WhatsApp</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connection Status</p>
              </div>
            </Link>

            <Link
              to="/host/messages"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20">
                <svg className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white">Messages</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View All Messages</p>
              </div>
            </Link>

            <Link
              to="/host/guests"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-500/20">
                <svg className="h-5 w-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white">Guests</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage Guests</p>
              </div>
            </Link>

            <Link
              to="/host/blocked-numbers"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-100 dark:bg-error-500/20">
                <svg className="h-5 w-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white">Blocked</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Blocked Numbers</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

