"use client"

import React from "react"
import { PaginationFooter } from "@/components/pagination-footer"
import {
  flexRender,
  Table as TanstackTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData> {
  table: TanstackTable<TData>
}

export function DataTable<TData>({ table }: DataTableProps<TData>) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No members in this group.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationFooter
        page={table.getState().pagination.pageIndex + 1}
        totalPages={Math.max(1, table.getPageCount())}
        onPageChange={(p) => table.setPageIndex(Math.max(0, p - 1))}
        isLoading={false}
        from={table.getFilteredRowModel().rows.length > 0 ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 : 0}
        to={Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}
        total={table.getFilteredRowModel().rows.length}
        pageSize={table.getState().pagination.pageSize}
        onPageSizeChange={(size) => { table.setPageSize(size); table.setPageIndex(0); }}
        pageSizeOptions={[10, 20, 30, 40, 50]}
      />
    </div>
  )
}
