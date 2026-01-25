import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { getAdminFeedbacks, resolveAdminFeedback } from "../../services/adminService";
import { IMessage } from "../../types";
import { useSocket } from "../../context/SocketContext";
import FeedbackBadge from "../../components/ui/badge/FeedbackBadge";
import CommonPagination from '../../components/common/CommonPagination';
import {IPagination} from "../../types/common.ts";

const FeedbackList: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(50);
  const [resolving, setResolving] = useState<{ [id: string]: boolean }>({});
  const socket = useSocket();

  const fetchFeedbacks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAdminFeedbacks({ page, limit });
      setMessages(res.data);
      setPagination(res.pagination);
    } catch {
      toast.error("Failed to fetch feedbacks");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFeedbacks(1);
  }, [fetchFeedbacks]);

  useEffect(() => {
    if (!socket) return
    socket.on("connect", () => {
    });
    socket.on("feedback:update", fetchFeedbacks);
    return () => {
      socket.off("feedback:update", fetchFeedbacks);
    };
  }, [socket, fetchFeedbacks]);

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleString() : "-";
  };

  const handlePageChange = (page: number) => {
    fetchFeedbacks(page);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Admin Feedback</h2>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No feedback found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Guest Number</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Message</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Feedback</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Note</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Resolved At</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((fb) => (
                <tr key={fb.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">{fb.guestNumber}</td>
                  <td className="py-3 px-4">{fb.prompt}</td>
                  <td className="py-3 px-4"><FeedbackBadge feedback={fb.feedback} /></td>
                  <td className="py-3 px-4">{fb.feedbackNote || '-'}</td>
                  <td className="py-3 px-4">{fb.feedbackResolvedAt && formatDate(fb.feedbackResolvedAt)}</td>
                  <td className="py-3 px-4">
                    {fb.feedback === "negative" && !fb.feedbackResolvedAt && (
                      <button
                        onClick={async () => {
                          setResolving((r) => ({ ...r, [fb.id]: true }));
                          try {
                            await resolveAdminFeedback(fb.id);
                            toast.success("Feedback resolved");
                            fetchFeedbacks();
                          } catch {
                            toast.error("Failed to resolve feedback");
                          } finally {
                            setResolving((r) => ({ ...r, [fb.id]: false }));
                          }
                        }}
                        className="bg-brand-500 text-white px-3 py-1 rounded hover:bg-brand-600 disabled:opacity-50"
                        disabled={!!resolving[fb.id]}
                      >
                        {resolving[fb.id] ? 'Resolving...' : 'Resolve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination */}
      {pagination && (
        <CommonPagination
          pagination={pagination}
          onPageChange={handlePageChange}
          className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
        />
      )}
    </div>
  );
};

export default FeedbackList;
