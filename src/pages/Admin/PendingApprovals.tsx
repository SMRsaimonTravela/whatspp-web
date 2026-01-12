import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { adminService } from "../../services/adminService";
import type { User } from "../../types";
import toast from "react-hot-toast";

export default function PendingApprovals() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const response = await adminService.getPendingUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to load pending users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await adminService.approveUser(userId);
      if (response.success) {
        toast.success("User approved successfully");
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error("Failed to approve user:", error);
    }
  };

  const handleReject = async () => {
    if (!rejectingUser) return;
    try {
      const response = await adminService.rejectUser(rejectingUser.id, rejectReason);
      if (response.success) {
        toast.success("User rejected");
        setUsers(users.filter(u => u.id !== rejectingUser.id));
        setRejectingUser(null);
        setRejectReason("");
      }
    } catch (error) {
      console.error("Failed to reject user:", error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

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
        title="Pending Approvals | WhatsApp AI Bot"
        description="Approve or reject pending user registrations"
      />
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            Pending Approvals
          </h1>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No pending approvals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20">
                        <span className="text-lg font-semibold text-brand-500">
                          {user.name[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">{user.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.businessName}</p>
                      </div>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">
                      Pending
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-300">{user.whatsappNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-300">Registered: {formatDate(user.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="flex-1 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectingUser(user)}
                      className="flex-1 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setRejectingUser(null)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Reject User</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to reject <strong>{rejectingUser.name}</strong>'s registration?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 py-2 text-sm"
                rows={3}
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

