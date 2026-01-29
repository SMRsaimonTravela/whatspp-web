import { Table, TableHeader, TableBody, TableRow, TableCell } from "../ui/table";
import Badge from "../ui/badge/Badge";
import CommonPagination from "../common/CommonPagination";
import DynamicFilter from "../common/DynamicFilter";
import { formatDateWithDay, formatFDate, formatCurrency } from "../../utils/globalHelper";
import { IBooking } from "../../types/booking.d";
import { IBookingFilters } from "../../types/filters.d";
import { IPagination } from "../../types/finance";
import React from "react";

interface BookingTableProps {
  bookings: IBooking[];
  isLoading: boolean;
  pagination?: IPagination;
  onPageChange: (page: number) => void;
  filters?: IBookingFilters;
  filterValues?: Record<string, unknown>;
  onFilterChange?: (filters: Record<string, unknown>) => void;
  title?: string;
}

const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  isLoading,
  pagination,
  onPageChange,
  filters,
  filterValues,
  onFilterChange,
  title = "Booking Management",
}) => (
  <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">{title}</h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden p-4">
        {/* Dynamic Filters */}
        {filters && Object.keys(filters).length > 0 && onFilterChange && (
          <DynamicFilter
            filters={filters}
            values={filterValues || {}}
            onChange={onFilterChange}
          />
        )}
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
                  <TableCell isHeader className="px-6 py-4">Booking</TableCell>
                  <TableCell isHeader className="px-6 py-4">Guest Info</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-right">Amount</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-center">Status</TableCell>
                  <TableCell isHeader className="px-6 py-4 text-right">Commission</TableCell>
                  <TableCell isHeader className="px-6 py-4">Date</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.bookingId} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <TableCell className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      <div className="flex flex-col items-start gap-2 min-w-[180px]">
                        <div className="min-w-[180px] grid grid-cols-[110px_10px_1fr] items-center gap-1">
                          <span className="font-semibold">Booking</span>
                          <span className="text-right">:</span>
                          <span className="flex"><strong >#{booking.bookingId}</strong></span>
                        </div>
                        <div className="min-w-[180px] grid grid-cols-[110px_10px_1fr] items-center gap-1">
                          <span className="font-semibold">Check-in</span>
                          <span className="text-right">:</span>
                          <span className="flex"><Badge color="info" size="sm">{formatDateWithDay(booking.checkIn)}</Badge></span>
                        </div>
                        <div className="min-w-[180px] grid grid-cols-[110px_10px_1fr] items-center gap-1">
                          <span className="font-semibold">Check-out</span>
                          <span className="text-right">:</span>
                          <span className="flex"><Badge color="info" size="sm">{formatDateWithDay(booking.checkOut)}</Badge></span>
                        </div>
                        <div className="min-w-[180px] grid grid-cols-[110px_10px_1fr] items-center gap-1">
                          <span className="font-semibold">Total Guests</span>
                          <span className="text-right">:</span>
                          <span className="flex"><Badge color="primary" size="sm">{typeof booking.bookingData?.total_guest === 'number' ? booking.bookingData.total_guest : 'N/A'}</Badge></span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="text-sm text-center font-medium text-gray-900 dark:text-white">{booking.guestName}</div>
                      <div className="text-xs text-center text-gray-500 dark:text-gray-400">{booking.guestPhone}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4  text-center text-sm font-semibold text-right text-gray-900 dark:text-white">
                      {formatCurrency(booking.amount)}
                    </TableCell>
                    <TableCell className="px-6  text-center py-4 text-center">
                      <span className="flex items-center justify-start">
                        <Badge color={
                          booking.paymentStatus === 'paid' ? 'success' :
                          booking.paymentStatus === 'unpaid' ? 'warning' :
                          booking.paymentStatus === 'refunded' ? 'error' : 'info'
                        } size="sm">
                          {booking.paymentStatus === 'paid' ? 'Paid' :
                            booking.paymentStatus === 'unpaid' ? 'Unpaid' :
                            booking.paymentStatus === 'refunded' ? 'Refunded' : 'Pending'}</Badge>
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      {booking.commission && typeof booking.commission.amount === 'number' ? (
                        <div className="text-sm font-medium text-success-600">{formatCurrency(booking.commission.amount)}</div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatFDate(booking.createdAt)}
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
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  </>
);

export default BookingTable;
