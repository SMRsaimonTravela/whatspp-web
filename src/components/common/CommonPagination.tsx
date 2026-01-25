import React from "react";
import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "../ui/pagination";
import { IPagination } from "../../types/common";

interface CommonPaginationProps {
  pagination: IPagination;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(current: number, last: number) {
  const delta = 2;
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) {
    range.push(i);
  }
  if (current - delta > 2) range.unshift('...');
  if (current + delta < last - 1) range.push('...');
  range.unshift(1);
  if (last > 1) range.push(last);
  return range;
}

const CommonPagination: React.FC<CommonPaginationProps> = ({ pagination, onPageChange, className }) => {
  if (!pagination || pagination.total <= pagination.per_page) return null;
  return (
    <div className={className || "flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"}>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
      </p>
      <ShadcnPagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              size="default"
              onClick={e => {
                e.preventDefault();
                if (pagination.current_page > 1) onPageChange(pagination.current_page - 1);
              }}
              aria-disabled={pagination.current_page === 1}
            />
          </PaginationItem>
          {getPageNumbers(pagination.current_page, pagination.last_page).map((page, idx) =>
            typeof page === 'number' ? (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  size="default"
                  isActive={page === pagination.current_page}
                  onClick={e => {
                    e.preventDefault();
                    onPageChange(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={"ellipsis-" + idx}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              size="default"
              onClick={e => {
                e.preventDefault();
                if (pagination.current_page < pagination.last_page) onPageChange(pagination.current_page + 1);
              }}
              aria-disabled={pagination.current_page === pagination.last_page}
            />
          </PaginationItem>
        </PaginationContent>
      </ShadcnPagination>
    </div>
  );
};

export default CommonPagination;

