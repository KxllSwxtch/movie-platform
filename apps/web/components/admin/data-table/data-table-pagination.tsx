'use client';

import {
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
} from '@phosphor-icons/react';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPaginationChange?: (page: number, limit: number) => void;
}

export function DataTablePagination<TData>({
  table,
  pagination,
  onPaginationChange,
}: DataTablePaginationProps<TData>) {
  // Use external pagination if provided, otherwise use table state
  const currentPage = pagination?.page ?? table.getState().pagination.pageIndex + 1;
  const pageSize = pagination?.limit ?? table.getState().pagination.pageSize;
  const totalPages = pagination?.totalPages ?? table.getPageCount();
  const totalItems = pagination?.total ?? table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  const handlePageChange = (newPage: number) => {
    if (onPaginationChange) {
      onPaginationChange(newPage, pageSize);
    } else {
      table.setPageIndex(newPage - 1);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (onPaginationChange) {
      onPaginationChange(1, newPageSize);
    } else {
      table.setPageSize(newPageSize);
    }
  };

  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
      {/* Selection info */}
      <div className="flex-1 text-sm text-mp-text-secondary">
        {selectedCount > 0 ? (
          <>
            {selectedCount} of {totalItems} row(s) selected.
          </>
        ) : (
          <>{totalItems} row(s) total.</>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <p className="text-sm text-mp-text-secondary whitespace-nowrap">
            Rows per page
          </p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page indicator */}
        <div className="flex items-center justify-center text-sm text-mp-text-secondary whitespace-nowrap">
          Page {currentPage} of {totalPages}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="h-8 w-8 p-0 hidden lg:flex"
            onClick={() => handlePageChange(1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Go to first page</span>
            <CaretDoubleLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Go to previous page</span>
            <CaretLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <CaretRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0 hidden lg:flex"
            onClick={() => handlePageChange(totalPages)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Go to last page</span>
            <CaretDoubleRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
