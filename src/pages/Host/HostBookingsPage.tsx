import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { financeService } from "../../services/financeService";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { useQuery } from '@tanstack/react-query';
import DynamicFilter from "../../components/common/DynamicFilter";
import { IBookingResponse, IBooking } from '../../types/booking.d';
import { IPagination } from '../../types/finance';
import { IBookingFilters } from '../../types/filters.d';
import CommonPagination from "../../components/common/CommonPagination";

export default function HostBookingsPage() {
    const [queryState, setQueryState] = useState<{
        page: number;
        filters: Record<string, string | number | boolean>;
    }>({
        page: 1,
        filters: {}
    });

    const {
        data,
        isLoading
    } = useQuery<IBookingResponse>({
        queryKey: ['host-bookings', queryState.page, queryState.filters],
        queryFn: () => financeService.getHostBookings(queryState.page, queryState.filters),
    });

    const filters: IBookingFilters = data?.filters ?? ({} as IBookingFilters);
    const pagination: IPagination | undefined = data?.pagination;
    const bookings: IBooking[] = data?.data || [];

    // Handle filter and pagination changes
    const handleFilterChange = (newFilters: Record<string, string | number | boolean>) => {
        setQueryState({ page: 1, filters: newFilters });
    };
    const handlePageChange = (newPage: number) => {
        setQueryState((prev) => ({ ...prev, page: newPage }));
    };

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(num);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400">Paid</span>;
            case 'unpaid':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">Unpaid</span>;
            case 'refunded':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400">Refunded</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 capitalize">{status}</span>;
        }
    };

    return (
        <>
            <PageMeta title="Bookings | Host Dashboard" description="View and manage your bookings" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Booking Management</h1>
                </div>
                {/* Dynamic Filters */}
                {filters && Object.keys(filters).length > 0 && (
                    <DynamicFilter
                        filters={filters}
                        values={queryState.filters}
                        onChange={handleFilterChange}
                    />
                )}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {isLoading ? (
                        <div className="py-20 flex justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="py-20 text-center text-gray-500 dark:text-gray-400">
                            No bookings found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <TableRow>
                                        <TableCell isHeader className="px-6 py-4">Booking ID</TableCell>
                                        <TableCell isHeader className="px-6 py-4">Guest Info</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-right">Amount</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-center">Status</TableCell>
                                        <TableCell isHeader className="px-6 py-4 text-right">Commission</TableCell>
                                        <TableCell isHeader className="px-6 py-4">Date</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookings.map((booking: IBooking) => (
                                        <TableRow key={booking.bookingId} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                            <TableCell className="px-6 py-4 text-sm text-center font-medium text-gray-800 dark:text-gray-200">
                                                #{booking.bookingId}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="text-sm  text-center font-medium text-gray-900 dark:text-white">{booking.guestName}</div>
                                                <div className="text-xs  text-center text-gray-500 dark:text-gray-400">{booking.guestPhone}</div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4  text-center text-sm font-semibold text-right text-gray-900 dark:text-white">
                                                {formatCurrency(booking.amount)}
                                            </TableCell>
                                            <TableCell className="px-6  text-center py-4 text-center">
                                                {getStatusBadge(booking.paymentStatus)}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-right">
                                                {booking.commission ? (
                                                    <div className="text-sm font-medium text-success-600">{formatCurrency(booking.commission.amount)}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(booking.createdAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {/* Pagination */}
                    {pagination && pagination.total > pagination.per_page && (
                        <CommonPagination
                            pagination={pagination}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
