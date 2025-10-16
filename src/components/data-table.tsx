"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Columns3Cog, Loader2 } from "lucide-react" // Loader icon

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean // ✅ Tambahkan props loading
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  // Local controlled input (typing) and applied search (applies on Enter or click)
  const [inputValue, setInputValue] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")

  // Global filter function: checks if any cell value contains the search string
  const filteredData = React.useMemo(() => {
    if (!appliedSearch) return data
    const lower = appliedSearch.toLowerCase()
    return data.filter((row) => {
      return columns.some((col) => {
        let value = ""
        // tanstack v8: accessorKey is a string, accessorFn is a function
        if (typeof (col as any).accessorFn === "function") {
          try {
            value = String((col as any).accessorFn(row, 0) ?? "")
          } catch {
            value = ""
          }
        } else if (typeof (col as any).accessorKey === "string") {
          value = String((row as any)[(col as any).accessorKey] ?? "")
        }
        return value.toLowerCase().includes(lower)
      })
    })
  }, [appliedSearch, data, columns])

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  })



  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-4">
        {/* Global Filter */}
        <div className="flex items-center gap-2">
          <InputGroup className="max-w-sm">
            <InputGroupInput
              placeholder="Search..."
              value={inputValue}
              onChange={(e) => {
                const v = e.target.value
                setInputValue(v)
                if (v.trim() === "") {
                  // if input cleared, immediately show all rows
                  setAppliedSearch("")
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(inputValue)
                }
              }}
            />
            <InputGroupButton
              size="sm"
              onClick={() => setAppliedSearch(inputValue)}
              disabled={isLoading}
            >
              Search
            </InputGroupButton>
          </InputGroup>
        </div>

        {/* Toggle Columns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Columns3Cog />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
          </div>
        )}

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? "Loading..." : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage() || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage() || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
