import { useEffect, useState } from "react";
import { financeService } from "../../services/financeService";
import { IWithdrawalRequest, IWithdrawalsResponse } from "../../types/finance";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<IWithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadWithdrawals();
  }, [currentPage]);

  const loadWithdrawals = async () => {
    setIsLoading(true);
    try {
      const res: IWithdrawalsResponse = await financeService.getWithdrawals(currentPage, PAGE_SIZE);
      setWithdrawals(res.data);
      setTotalPages(res.pagination.last_page);
    } catch {
      toast.error("Failed to load withdrawals");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Withdrawals</h1>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">
            No withdrawals found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <TableRow>
                  <TableCell isHeader className="px-6 text-left py-4">Date</TableCell>
                  <TableCell isHeader className="px-6 text-left py-4">Amount</TableCell>
                  <TableCell isHeader className="px-6 text-left py-4">Status</TableCell>
                  <TableCell isHeader className="px-6 text-left py-4">Note</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((item) => (
                  <TableRow key={item._id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <TableCell className="px-6  py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                      ৳{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm capitalize">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'approved' ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400' :
                        item.status === 'pending' ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400' :
                        item.status === 'rejected' ? 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400' :
                        'bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400'
                      }`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {item.note || '-'}
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
  );
}
