import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { financeService } from "../../services/financeService";
import { IWithdrawalRequest, WithdrawalStatus } from "../../types/finance";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import toast from "react-hot-toast";
import { Dropdown } from '../../components/ui/dropdown/Dropdown';
import { DropdownItem } from '../../components/ui/dropdown/DropdownItem';

export default function WithdrawalsPage() {
    const [requests, setRequests] = useState<IWithdrawalRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<WithdrawalStatus>('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedRequest, setSelectedRequest] = useState<IWithdrawalRequest | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [transactionId, setTransactionId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, currentPage]);

    const loadRequests = async () => {
        setIsLoading(true);
        try {
            const res = await financeService.getAdminWithdrawals(activeTab, currentPage);
            setRequests(Array.isArray(res.data) ? res.data : []);
            setTotalPages(Math.ceil(res.pagination?.total / 10) || 1);
        } catch (error) {
            console.error("Failed to load withdrawal requests:", error);
            toast.error("Failed to load withdrawal requests");
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm("Are you sure you want to approve this withdrawal?")) return;
        try {
            await financeService.approveWithdrawal(id);
            toast.success("Withdrawal approved");
            loadRequests();
        } catch (error) {
            console.error("Failed to approve withdrawal:", error);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectReason) return;
        setIsSubmitting(true);
        try {
            await financeService.rejectWithdrawal(selectedRequest.id, rejectReason);
            toast.success("Withdrawal rejected");
            setIsRejectModalOpen(false);
            setRejectReason("");
            setSelectedRequest(null);
            loadRequests();
        } catch (error) {
            console.error("Failed to reject withdrawal:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = async () => {
        if (!selectedRequest || !transactionId) return;
        setIsSubmitting(true);
        try {
            await financeService.completeWithdrawal(selectedRequest.id, transactionId);
            toast.success("Withdrawal marked as complete");
            setIsCompleteModalOpen(false);
            setTransactionId("");
            setSelectedRequest(null);
            loadRequests();
        } catch (error) {
            console.error("Failed to complete withdrawal:", error);
        } finally {
        setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <>
            <PageMeta title="Withdrawals | Admin Dashboard" description="Manage host withdrawal requests" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Withdrawal Requests</h1>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl w-fit">
                    {(['pending', 'approved', 'complete', 'rejected'] as WithdrawalStatus[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-white dark:bg-gray-700 text-brand-500 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <span className="capitalize">{tab}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {isLoading ? (
                        <div className="py-20 flex justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
                            No {activeTab} requests found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
                                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                                        <TableCell isHeader className="px-6 py-4">Host</TableCell>
                                        <TableCell isHeader className="px-6 py-4">Amount</TableCell>
                                        <TableCell isHeader className="px-6 py-4">Date</TableCell>
                                        <TableCell isHeader className="px-6 py-4">Status</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-right">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                            <TableCell className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{req.user.name}</div>
                                                <div className="text-xs text-gray-500">Email: {req.user.email}</div>
                                                <div className="text-xs text-gray-500">Host ID: {req.user.hostId}</div>
                                                <div className="text-xs text-gray-500">Note: {req.note}</div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(Number(req.amount))}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {formatDate(req.createdAt)}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${req.status === 'complete' ? 'bg-success-50 text-success-700' :
                                                    req.status === 'pending' ? 'bg-warning-50 text-warning-700' :
                                                    req.status === 'approved' ? 'bg-indigo-50 text-indigo-700' :
                                                    'bg-error-50 text-error-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                <div className="inline-block text-left">
                                                    <button
                                                        className="dropdown-toggle text-brand-500 hover:text-brand-600 text-sm font-medium focus:outline-none"
                                                        onClick={() => setDropdownOpen(dropdownOpen === req.id ? null : req.id)}
                                                        type="button"
                                                    >
                                                        Actions ▾
                                                    </button>
                                                    <Dropdown
                                                        isOpen={dropdownOpen === req.id}
                                                        onClose={() => setDropdownOpen(null)}
                                                        dropUp={false}
                                                    >
                                                        {req.status === 'pending' && (
                                                            <DropdownItem onClick={async () => {
                                                                await handleApprove(req.id);
                                                                setDropdownOpen(null);
                                                            }}>
                                                                Approve
                                                            </DropdownItem>
                                                        )}
                                                        {req.status === 'pending' && (
                                                            <DropdownItem onClick={() => {
                                                                setSelectedRequest(req);
                                                                setIsRejectModalOpen(true);
                                                                setDropdownOpen(null);
                                                            }}>
                                                                Reject
                                                            </DropdownItem>
                                                        )}
                                                        {req.status === 'approved' && (
                                                            <DropdownItem onClick={() => {
                                                                setSelectedRequest(req);
                                                                setIsCompleteModalOpen(true);
                                                                setDropdownOpen(null);
                                                            }}>
                                                                Complete
                                                            </DropdownItem>
                                                        )}
                                                    </Dropdown>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30">
                            <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-30"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} className="max-w-md p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Reject Withdrawal</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reason</label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Why is this being rejected?"
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent px-4 py-2 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                            rows={3}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleReject}
                            disabled={isSubmitting || !rejectReason}
                            className="flex-1 h-11 bg-error-500 text-white rounded-xl font-bold hover:bg-error-600 disabled:opacity-50"
                        >
                            {isSubmitting ? "Rejecting..." : "Reject"}
                        </button>
                        <button
                            onClick={() => setIsRejectModalOpen(false)}
                            className="flex-1 h-11 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Complete Modal */}
            <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} className="max-w-md p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Complete Payout</h2>
                <div className="space-y-4">
                    <div className="bg-brand-50 dark:bg-brand-500/10 p-4 rounded-xl text-center">
                        <p className="text-sm font-medium text-brand-600">Payable Amount</p>
                        <div className="text-2xl font-bold text-brand-700 dark:text-brand-300 mt-1">
                            {selectedRequest && formatCurrency(selectedRequest.amount)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Transaction ID / Reference</label>
                        <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter bank reference"
                            className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent px-4 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleComplete}
                            disabled={isSubmitting || !transactionId}
                            className="flex-1 h-11 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 disabled:opacity-50"
                        >
                            {isSubmitting ? "Finishing..." : "Confirm Payment"}
                        </button>
                        <button
                            onClick={() => setIsCompleteModalOpen(false)}
                            className="flex-1 h-11 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
