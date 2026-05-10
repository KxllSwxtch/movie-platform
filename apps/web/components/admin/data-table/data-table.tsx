"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTableCardView } from "./data-table-card-view";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPaginationChange?: (page: number, limit: number) => void;
  manualPagination?: boolean;
  manualFiltering?: boolean;
  onSearch?: (value: string) => void;
}

interface FilterOption {
  id: string;
  title: string;
  options: { label: string; value: string }[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  filterOptions = [],
  isLoading = false,
  pagination,
  onPaginationChange,
  manualPagination = false,
  manualFiltering = false,
  onSearch,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const tableInnerRef = React.useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = React.useState(0);
  const isSyncingScrollRef = React.useRef(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination,
    manualFiltering,
    pageCount: pagination?.totalPages ?? -1,
  });

  React.useEffect(() => {
    const tableScroll = tableScrollRef.current;
    const tableInner = tableInnerRef.current;
    if (!tableScroll || !tableInner) return;

    const updateScrollWidth = () => {
      setScrollWidth(tableInner.scrollWidth);
    };

    updateScrollWidth();

    const resizeObserver = new ResizeObserver(updateScrollWidth);
    resizeObserver.observe(tableScroll);
    resizeObserver.observe(tableInner);

    return () => resizeObserver.disconnect();
  }, [columns.length, data.length, isLoading]);

  const syncHorizontalScroll = React.useCallback(
    (source: "top" | "bottom") => (event: React.UIEvent<HTMLDivElement>) => {
      if (isSyncingScrollRef.current) return;

      const target =
        source === "top" ? tableScrollRef.current : topScrollRef.current;
      if (!target) return;

      isSyncingScrollRef.current = true;
      target.scrollLeft = event.currentTarget.scrollLeft;
      window.requestAnimationFrame(() => {
        isSyncingScrollRef.current = false;
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      {/* Toolbar with search and filters */}
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        filterOptions={filterOptions}
        onSearch={onSearch}
      />

      {/* Mobile card view */}
      <div className="md:hidden">
        <DataTableCardView
          rows={table.getRowModel().rows}
          isLoading={isLoading}
        />
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block rounded-lg border border-mp-border bg-mp-bg-secondary overflow-hidden">
        <div
          ref={topScrollRef}
          className="overflow-x-auto overflow-y-hidden border-b border-mp-border/60 custom-scrollbar"
          onScroll={syncHorizontalScroll("top")}
        >
          <div className="h-3" style={{ width: scrollWidth || "100%" }} />
        </div>
        <div
          ref={tableScrollRef}
          className="overflow-x-auto custom-scrollbar"
          onScroll={syncHorizontalScroll("bottom")}
        >
          <div ref={tableInnerRef} className="min-w-max">
            <table className="w-full caption-bottom text-sm">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-mp-surface/50 hover:bg-mp-surface/50"
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {columns.map((_, colIndex) => (
                        <TableCell key={colIndex}>
                          <div className="h-5 w-full animate-pulse bg-mp-surface rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-mp-text-secondary"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <DataTablePagination
        table={table}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
      />
    </div>
  );
}
