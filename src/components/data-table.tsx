"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown, Columns3Cog, Loader2 } from "lucide-react" // Loader icon

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean // ✅ Added loading prop
  showGlobalFilter?: boolean
  showPagination?: boolean
  showColumnToggle?: boolean
  initialSorting?: SortingState
  getRowKey?: (row: TData, index: number) => string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  showGlobalFilter = true,
  showPagination = true,
  showColumnToggle = true,
  initialSorting,
  getRowKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting ?? [])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})
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
        
        // Try accessorFn first
        if ("accessorFn" in col && typeof (col as any).accessorFn === "function") {
          try {
            value = String((col as any).accessorFn(row as TData, 0) ?? "")
          } catch {
            value = ""
          }
        } 
        // Try accessorKey
        else if ("accessorKey" in col && typeof (col as any).accessorKey === "string") {
          const key = (col as any).accessorKey as string
          
          // Handle nested keys like "user.phone"
          if (key.includes('.')) {
            const keys = key.split('.')
            let nestedValue: any = row
            for (const k of keys) {
              nestedValue = nestedValue?.[k]
            }
            value = String(nestedValue ?? "")
          } else {
            value = String((row as any)[key] ?? "")
          }
        }
        // Fallback: try to get value from cell render
        else if ("cell" in col) {
          try {
            // Get all values from row object
            const rowValues = Object.values(row as any).join(' ')
            value = rowValues
          } catch {
            value = ""
          }
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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Global Filter */}
          {showGlobalFilter && (
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
          )}

          {/* Toggle Columns */}
          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Columns3Cog className="h-4 w-4" /> Columns
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
          )}
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-md border">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        <Table className="min-w-[36rem]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortState = header.column.getIsSorted()

                  if (header.isPlaceholder) {
                    return <TableHead key={header.id} />
                  }

                  return (
                    <TableHead key={header.id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-start gap-2 text-sm font-medium",
                          canSort ? "cursor-pointer select-none" : "cursor-default",
                        )}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        disabled={isLoading}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-muted-foreground">
                            {sortState === "asc" ? (
                              <ArrowUpAZ className="h-3.5 w-3.5" />
                            ) : sortState === "desc" ? (
                              <ArrowDownAZ className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5" />
                            )}
                          </span>
                        )}
                      </button>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={getRowKey ? getRowKey(row.original, index) : row.id}
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
      {showPagination && (
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
      )}
    </div>
  )
}
