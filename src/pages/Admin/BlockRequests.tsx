import {useCallback, useEffect, useState} from "react";
import PageMeta from "../../components/common/PageMeta";
import {adminService} from "../../services/adminService";
import type {IBlockNumbersAdmin, Pagination} from "../../types";
import toast from "react-hot-toast";
import {useModal} from "../../hooks/useModal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

export default function BlockRequests() {
    const [requests, setRequests] = useState<IBlockNumbersAdmin[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state for force actions
    const [modalState, setModalState] = useState<{ id: string; action: "approve" | "reject" | null } | null>(null);
    const { isOpen, openModal, closeModal } = useModal();

    const [isActionLoading, setIsActionLoading] = useState(false);

    const loadRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await adminService.getPendingBlockRequests({page: currentPage, limit: 20});
            if (response.success) {
                setRequests(response.data);
                setPagination(response.pagination);
            }
        } catch {
        } finally {
            setIsLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleApprove = async (id: string) => {
        try {
            const response = await adminService.approveBlockRequest(id);
            if (response.success) {
                toast.success("Block request approved");
                loadRequests();
            }
        } catch (error) {
            console.error("Failed to approve block request:", error);
        }
    };

    const handleReject = async (id: string) => {
        try {
            const response = await adminService.rejectBlockRequest(id);
            if (response.success) {
                toast.success("Block request rejected");
                loadRequests();
            }
        } catch (error) {
            console.error("Failed to reject block request:", error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    // Show all requests, do not filter out 'rejected'
    const visibleRequests = requests;

    const handleForceAction = (id: string, action: "approve" | "reject") => {
        setModalState({ id, action });
        openModal();
    };

    const handleModalConfirm = async () => {
        if (!modalState) return;
        setIsActionLoading(true);
        try {
            if (modalState.action === "approve") {
                await handleApprove(modalState.id);
            } else if (modalState.action === "reject") {
                await handleReject(modalState.id);
            }
        } finally {
            setIsActionLoading(false);
            closeModal();
            setModalState(null);
        }
    };

    const handleModalCancel = () => {
        if (isActionLoading) return;
        closeModal();
        setModalState(null);
    };

    return (
        <>
            <PageMeta
                title="Block Requests | WhatsApp AI Bot"
                description="Manage block requests from hosts"
            />
            <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-sm">
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                        Pending Block Requests
                    </h1>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div
                                className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
                        </div>
                    ) : visibleRequests.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none"
                                 stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400">No pending block requests</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Phone
                                        Number
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Host Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Reason</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Source</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {visibleRequests.map((request) => (
                                    <tr key={request.id}
                                        className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-3 px-4">
                                            <p className="text-sm font-mono text-gray-800 dark:text-white">
                                                {request.phoneNumber}
                                            </p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {request.name || "-"}
                                            </p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {request.user?.businessName || "-"}
                                            </p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate"
                                               title={request.reason}>
                                                {request.reason || "-"}
                                            </p>
                                        </td>
                                        <td className="py-3 px-4">
                                        <span
                                            className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                          {request.requestSource || "host"}
                                        </span>

                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(request.createdAt)}
                                            </p>
                                        </td>
                                        <td className="py-3 px-4">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : request.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                          {request.status}
                                        </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1">
                                                {request.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(request.id)}
                                                            className="px-2 py-1 text-xs bg-success-500 text-white rounded hover:bg-success-600"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request.id)}
                                                            className="px-2 py-1 text-xs bg-error-500 text-white rounded hover:bg-error-600"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {request.status === "rejected" && (
                                                    <button
                                                        onClick={() => handleForceAction(request.id, "approve")}
                                                        className="px-2 py-1 text-xs bg-success-500 text-white rounded hover:bg-success-600"
                                                    >
                                                        Force Approve
                                                    </button>
                                                )}
                                                {request.status === "approved" && (
                                                    <button
                                                        onClick={() => handleForceAction(request.id, "reject")}
                                                        className="px-2 py-1 text-xs bg-error-500 text-white rounded hover:bg-error-600"
                                                    >
                                                        Force Reject
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div
                            className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Page {currentPage} of {pagination.totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === pagination.totalPages}
                                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={isOpen && !!modalState}
                action={modalState?.action || null}
                loading={isActionLoading}
                onCancel={handleModalCancel}
                onConfirm={handleModalConfirm}
            />
        </>
    );
}
