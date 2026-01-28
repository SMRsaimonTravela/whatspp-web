import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { financeService } from "../../services/financeService";
import { useQuery } from '@tanstack/react-query';
import { IBookingResponse, IBooking } from '../../types/booking.d';
import { IPagination } from '../../types/finance';
import BookingTable from '../../components/common/BookingTable';

export default function AdminBookings() {
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
        queryKey: ['admin-bookings', queryState.page, queryState.filters],
        queryFn: () => financeService.getAdminBookings(queryState.page, queryState.filters),
    });

    const filters = data?.filters;
    const pagination: IPagination | undefined = data?.pagination;
    const bookings: IBooking[] = data?.data || [];

    const handleFilterChange = (newFilters: Record<string, unknown>) => {
        setQueryState({ page: 1, filters: newFilters as Record<string, string | number | boolean> });
    };
    const handlePageChange = (newPage: number) => {
        setQueryState((prev) => ({ ...prev, page: newPage }));
    };

    return (
        <>
            <PageMeta title="Bookings | Admin Dashboard" description="View and manage all bookings" />
            <BookingTable
                bookings={bookings}
                isLoading={isLoading}
                pagination={pagination}
                onPageChange={handlePageChange}
                filters={filters}
                filterValues={queryState.filters}
                onFilterChange={handleFilterChange}
                title="All Bookings"
            />
        </>
    );
}
