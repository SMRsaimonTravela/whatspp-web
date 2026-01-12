import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { getAdminFeedbacks, resolveAdminFeedback } from "../../services/adminService";
import {IMessage } from "../../types";
import { useSocket } from "../../context/SocketContext";
import FeedbackBadge from "../../components/ui/badge/FeedbackBadge";

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const FeedbackList: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const socket = useSocket();

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminFeedbacks();
      setMessages(res.data.messages);
      setPagination({
        page: res.data.page,
        limit: res.data.limit,
        total: res.data.total,
      });
    } catch {
      toast.error("Failed to fetch feedbacks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  useEffect(() => {
    if(!socket) return
    socket.on("connect", () => {
      console.log("✅ connected", socket.id);
    });
    socket.on("feedback:update", fetchFeedbacks);
    return () => {
      socket.off("feedback:update", fetchFeedbacks);
    };
  }, [socket, fetchFeedbacks]);

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleString() : "-";
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
                <tr key={fb._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">{fb.guestNumber}</td>
                  <td className="py-3 px-4">{fb.prompt}</td>
                  <td className="py-3 px-4"><FeedbackBadge feedback={fb.feedback} /></td>
                  <td className="py-3 px-4">{fb.feedbackNote || '-'}</td>
                  <td className="py-3 px-4">{fb.feedbackResolvedAt && formatDate(fb.feedbackResolvedAt)}</td>
                  <td className="py-3 px-4">
                    {fb.feedback === "negative" && !fb.feedbackResolvedAt && (
                      <button onClick={() => resolveAdminFeedback(fb._id).then(fetchFeedbacks)} className="bg-brand-500 text-white px-3 py-1 rounded hover:bg-brand-600">Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} feedbacks
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={pagination.page === Math.ceil(pagination.total / pagination.limit)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
