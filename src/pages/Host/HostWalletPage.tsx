import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { financeService } from "../../services/financeService";
import { IWallet, IWalletTransaction, IWalletHistoryResponse, INonWithdrawableSummary } from "../../types/finance";
import { IBooking } from "../../types/booking";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import toast from "react-hot-toast";

export default function HostWalletPage() {
    const [wallet, setWallet] = useState<IWallet | null>(null);
    const [history, setHistory] = useState<IWalletTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawNote, setWithdrawNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Non-withdrawable bookings state
    const [lockedSummary, setLockedSummary] = useState<INonWithdrawableSummary | null>(null);
    const [lockedBookings, setLockedBookings] = useState<IBooking[]>([]);
    const [isLoadingLocked, setIsLoadingLocked] = useState(false);

    // Fetch wallet only once on mount
    useEffect(() => {
        const fetchWallet = async () => {
            setIsLoading(true);
            try {
                const walletRes: IWallet = await financeService.getHostWallet();
                setWallet(walletRes);
                fetchHistory(1);
                fetchLockedBookings(); // Fetch locked bookings on page load
            } catch {
                setIsLoading(false);
            }
        };
        fetchWallet();
    }, []);

    const fetchLockedBookings = async () => {
        setIsLoadingLocked(true);
        try {
            const res = await financeService.getNonWithdrawableBookings();
            setLockedSummary(res.data.summary);
            setLockedBookings(res.data.bookings);
        } catch {
            // Silent fail
        } finally {
            setIsLoadingLocked(false);
        }
    };

    // Fetch history for a given page (no walletId)
    const fetchHistory = async (page: number) => {
        setIsLoading(true);
        try {
            const historyRes: IWalletHistoryResponse = await financeService.getHostWalletHistory(page);
            setHistory(historyRes.data);
            setTotalPages(historyRes.pagination.last_page);
        } catch {
            // No error toast or console for GET
        } finally {
            setIsLoading(false);
        }
    };

    // On pagination change, fetch history only
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchHistory(page);
    };

    // Calculate available withdrawal amount
    const availableWithdrawAmount = wallet
        ? Number(wallet.balance) - (lockedSummary?.total_locked_amount || 0)
        : 0;

    const handleWithdrawRequest = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (amount > availableWithdrawAmount) {
            toast.error("Amount exceeds available withdrawal balance");
            return;
        }

        setIsSubmitting(true);
        try {
            await financeService.requestWithdrawal(amount, withdrawNote);
            toast.success("Withdrawal request submitted successfully");
            setIsWithdrawModalOpen(false);
            setWithdrawAmount("");
            setWithdrawNote("");
            const walletRes: IWallet = await financeService.getHostWallet();
            setWallet(walletRes);
        } catch (error) {
            console.error("Withdrawal request failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <PageMeta title="Wallet | Host Dashboard" description="Manage your earnings and withdrawals" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Earnings & Wallet</h1>
                    <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                    >
                        Request Withdrawal
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Available Balance</p>
                        <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
                            {wallet ? formatCurrency(Number(wallet.balance)) : '৳0.00'}
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-success-500 font-medium px-2 py-0.5 rounded-full bg-success-50 dark:bg-success-500/10">Withdrawal Available</span>
                            <span className="text-sm font-semibold text-success-600 dark:text-success-400">
                                {formatCurrency(Math.max(0, availableWithdrawAmount))}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Withdrawal Pending</p>
                        <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
                            {wallet ? formatCurrency(Number(wallet.totalPending)) : '৳0.00'}
                        </h3>
                        <p className="mt-2 text-xs text-gray-400">Updating daily</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Paid Out</p>
                        <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
                            {wallet ? formatCurrency(Number(wallet.totalPaid)) : '৳0.00'}
                        </h3>
                        <p className="mt-2 text-xs text-gray-400">All-time earnings</p>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Transaction History</h2>
                    </div>

                    {isLoading ? (
                        <div className="py-20 flex justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
                            No transactions found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
                                    <TableRow>
                                        <TableCell isHeader className="px-6 py-4">Date & Time</TableCell>
                                        <TableCell isHeader className="px-6 py-4">Description</TableCell>
                                        <TableCell isHeader className="px-6 py-4">Type</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-right">Amount</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-right">Balance</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item) => (
                                        <TableRow key={item.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                            <TableCell className="px-6 py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {formatDate(item.createdAt)}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                                                {item.description}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${item.type === 'commission' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                                    item.type === 'withdrawal' ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                                                        'bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400'
                                                    }`}>
                                                    {item.type.replace('_', ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className={`px-6 py-4 text-sm font-semibold text-right whitespace-nowrap ${item.direction === 'credit' ? 'text-success-600' : 'text-error-600'
                                                }`}>
                                                {item.direction === 'credit' ? '+' : '-'} {formatCurrency(Number(item.amount))}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200 text-right whitespace-nowrap">
                                                {formatCurrency(Number(item.balanceAfter))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Withdrawal Modal */}
            <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} className="max-w-lg p-0">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Request Withdrawal</h2>
                </div>

                {/* Scrollable Content Area */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-4">
                        {/* Balance Summary */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total Balance</span>
                                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                                    {wallet ? formatCurrency(Number(wallet.balance)) : '৳0.00'}
                                </span>
                            </div>
                            {lockedSummary && lockedSummary.total_locked_amount > 0 && (
                                <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                                    <span className="text-sm">Locked Amount ({lockedSummary.booking_count} bookings)</span>
                                    <span className="text-lg font-semibold">
                                        - {formatCurrency(lockedSummary.total_locked_amount)}
                                    </span>
                                </div>
                            )}
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Available for Withdrawal</span>
                                <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
                                    {formatCurrency(Math.max(0, availableWithdrawAmount))}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount (BDT)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">৳</span>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.00"
                                    max={availableWithdrawAmount}
                                    className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent pl-8 pr-4 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes (Optional)</label>
                            <textarea
                                value={withdrawNote}
                                onChange={(e) => setWithdrawNote(e.target.value)}
                                placeholder="e.g. Bank Account details if not set"
                                rows={2}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Locked Bookings List */}
                        {lockedBookings.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Locked Bookings
                                </h3>
                                <div className="space-y-2">
                                    {lockedBookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg border border-orange-100 dark:border-orange-500/20"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                    #{booking.bookingId} · {booking.guestName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Withdrawable after <span className="font-semibold text-orange-600 dark:text-orange-400">{new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </p>
                                            </div>
                                            <div className="text-right ml-3">
                                                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                                    {formatCurrency(booking.commission?.amount || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoadingLocked && (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Bottom Buttons */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsWithdrawModalOpen(false)}
                            className="flex-1 h-11 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleWithdrawRequest}
                            disabled={isSubmitting || availableWithdrawAmount <= 0}
                            className="flex-1 h-11 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-500 disabled:active:scale-100"
                        >
                            {isSubmitting ? "Processing..." : "Submit Request"}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
