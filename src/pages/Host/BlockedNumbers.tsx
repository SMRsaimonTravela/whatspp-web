import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import CommonPagination from "../../components/common/CommonPagination";
import { hostService } from "../../services/hostService";
import type { BlockedNumber, IPagination } from "../../types";
import { Modal } from "../../components/ui/modal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import toast from "react-hot-toast";

export default function BlockedNumbers() {
  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>([]);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ phoneNumber: "", name: "", reason: "" });
  const [bulkNumbers, setBulkNumbers] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ id: string | null; open: boolean; action: "approve" | "reject" | null }>({ id: null, open: false, action: null });
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    loadBlockedNumbers();
  }, [currentPage, statusFilter]);

  const loadBlockedNumbers = async () => {
    setIsLoading(true);
    try {
      const params: { page: number; limit: number; status?: string } = { page: currentPage, limit: 20 };
      if (statusFilter) params.status = statusFilter;

      const response = await hostService.getBlockedNumbers(params);
      if (response.success) {
        setBlockedNumbers(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Failed to load blocked numbers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBlock = async () => {
    if (!addForm.phoneNumber) {
      toast.error("Phone number is required");
      return;
    }
    try {
      const response = await hostService.requestBlock(addForm);
      if (response.success) {
        toast.success("Block request submitted. Waiting for admin approval.");
        setIsAddModalOpen(false);
        setAddForm({ phoneNumber: "", name: "", reason: "" });
        loadBlockedNumbers();
      }
    } catch (error) {
      console.error("Failed to submit block request:", error);
    }
  };

  const handleBulkBlock = async () => {
    const numbers = bulkNumbers
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(phoneNumber => ({ phoneNumber, reason: "Bulk block request" }));

    if (numbers.length === 0) {
      toast.error("Please enter at least one phone number");
      return;
    }

    try {
      const response = await hostService.bulkBlockRequest(numbers);
      if (response.success) {
        toast.success(`${numbers.length} block requests submitted. Waiting for admin approval.`);
        setIsBulkModalOpen(false);
        setBulkNumbers("");
        loadBlockedNumbers();
      }
    } catch (error) {
      console.error("Failed to submit bulk block request:", error);
    }
  };

  const handleRemoveBlock = async (id: string) => {
    setDeleteModal({ id, open: true, action: "reject" }); // Use 'reject' for delete action
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleteLoading(true);
    try {
      const response = await hostService.removeBlockedNumber(deleteModal.id);
      if (response.success) {
        toast.success("Block request removed");
        loadBlockedNumbers();
      }
    } catch (error) {
      console.error("Failed to remove block:", error);
    } finally {
      setIsDeleteLoading(false);
      setDeleteModal({ id: null, open: false, action: null });
    }
  };

  const cancelDelete = () => {
    if (isDeleteLoading) return;
    setDeleteModal({ id: null, open: false, action: null });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400">Approved</span>;
      case 'rejected':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400">Rejected</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">Pending</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <PageMeta
        title="Blocked Numbers | WhatsApp AI Bot"
        description="Manage blocked numbers"
      />
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Blocked Numbers
            </h1>
            <div className="flex gap-2">
              <button
                disabled={true}
                onClick={() => setIsBulkModalOpen(true)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
              >
                Bulk Import
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
              >
                Add Block Request
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Note:</strong> Block requests require admin approval. AI will stop replying to blocked numbers only after approval.
            </p>
          </div>

          {/* Filter */}
          <div className="flex gap-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
            </div>
          ) : blockedNumbers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No blocked numbers</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Reason</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedNumbers.map((blocked) => (
                    <tr key={blocked.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <p className="text-sm font-mono text-gray-800 dark:text-white">
                          {blocked.phoneNumber}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {blocked.name || "-"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {blocked.reason || "-"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(blocked.status)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(blocked.createdAt)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleRemoveBlock(blocked.id)}
                          className="text-error-500 hover:text-error-600 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && <CommonPagination pagination={pagination} onPageChange={setCurrentPage} />}
        </div>
      </div>

      {/* Add Block Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} className="max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Request Block
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={addForm.phoneNumber}
              onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value })}
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
              placeholder="01712345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name (Optional)
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
              placeholder="Contact name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason (Optional)
            </label>
            <textarea
              value={addForm.reason}
              onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 py-2 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
              rows={3}
              placeholder="Why should this number be blocked?"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBlock}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Submit Request
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} className="max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Bulk Import Numbers
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Numbers (one per line)
            </label>
            <textarea
              value={bulkNumbers}
              onChange={(e) => setBulkNumbers(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-4 py-2 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none font-mono"
              rows={8}
              placeholder="01712345678&#10;01712345679&#10;01712345680"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkBlock}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              Submit All
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.open}
        action={deleteModal.action}
        loading={isDeleteLoading}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </>
  );
}
