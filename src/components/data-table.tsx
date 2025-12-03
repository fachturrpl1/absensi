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
import { Columns3Cog, Loader2, Search, Filter, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  showPagination?: boolean
  showColumnToggle?: boolean
  showGlobalFilter?: boolean
  showFilters?: boolean
  initialSorting?: SortingState
  getRowKey?: (row: TData, index: number) => string
  searchPlaceholder?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  showPagination = true,
  showColumnToggle = true,
  showGlobalFilter = true,
  showFilters = true,
  initialSorting,
  getRowKey,
  searchPlaceholder = "Search members...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting ?? [])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortOrder, setSortOrder] = React.useState("newest")
  const [pageSize, setPageSize] = React.useState("10")
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  // Handler functions
  const handlePageSizeChange = (value: string) => {
    setPageSize(value)
  }

  const handlePageIndexChange = (pageIndex: number) => {
    setPagination((prev) => ({ ...prev, pageIndex }))
  }

  const pageIndex = pagination.pageIndex

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let filtered = [...data]
    
    // Apply global search filter
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase()
      filtered = filtered.filter((row) => {
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
            value = String((row as any)[key] ?? "")
          }
          
          return value.toLowerCase().includes(searchTerm)
        })
      })
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((row) => {
        const isActive = (row as any).is_active
        if (statusFilter === "active") return isActive
        if (statusFilter === "inactive") return !isActive
        return true
      })
    }
    
    // Apply sorting
    if (sortOrder === "newest") {
      filtered.sort((a, b) => {
        const dateA = new Date((a as any).created_at || 0).getTime()
        const dateB = new Date((b as any).created_at || 0).getTime()
        return dateB - dateA
      })
    } else if (sortOrder === "oldest") {
      filtered.sort((a, b) => {
        const dateA = new Date((a as any).created_at || 0).getTime()
        const dateB = new Date((b as any).created_at || 0).getTime()
        return dateA - dateB
      })
    } else if (sortOrder === "a-z") {
      filtered.sort((a, b) => {
        // Sort by name (first column with string data)
        const nameA = (a as any).user?.first_name || (a as any).user?.display_name || ""
        const nameB = (b as any).user?.first_name || (b as any).user?.display_name || ""
        return nameA.toLowerCase().localeCompare(nameB.toLowerCase())
      })
    } else if (sortOrder === "z-a") {
      filtered.sort((a, b) => {
        // Sort by name (first column with string data) in reverse
        const nameA = (a as any).user?.first_name || (a as any).user?.display_name || ""
        const nameB = (b as any).user?.first_name || (b as any).user?.display_name || ""
        return nameB.toLowerCase().localeCompare(nameA.toLowerCase())
      })
    }
    
    return filtered
  }, [globalFilter, statusFilter, sortOrder, data, columns])

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater({ pageIndex, pageSize: parseInt(pageSize) })
        handlePageIndexChange(newPagination.pageIndex)
        handlePageSizeChange(String(newPagination.pageSize))
      } else {
        handlePageIndexChange(updater.pageIndex)
        handlePageSizeChange(String(updater.pageSize))
      }
    },
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })
  
  // Sync pageSize -> pagination state and reset to first page
  React.useEffect(() => {
    const newPageSize = parseInt(pageSize, 10) || 10
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, pageIndex: 0 }))
  }, [pageSize])

  // Clamp pageIndex when filtered data or pageSize changes
  React.useEffect(() => {
    const newPageSize = parseInt(pageSize, 10) || 10
    const totalPages = Math.max(1, Math.ceil(filteredData.length / newPageSize))
    if (pageIndex > totalPages - 1) {
      handlePageIndexChange(Math.max(0, totalPages - 1))
    }
  }, [filteredData.length, pageSize, pageIndex])

  return (
    <div className="space-y-4">
      
      {/* Filters and Controls - Compact Grid */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="flex flex-wrap items-center gap-2 w-full">
          {/* Filters */}
          {showFilters && (
            <>
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="a-z">A-Z</SelectItem>
                  <SelectItem value="z-a">Z-A</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Show Items */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
                <Select value={pageSize} onValueChange={setPageSize}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Toggle Columns */}
        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
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
{(() => {
                      const columnLabels: Record<string, string> = {
                        'is_active': 'Active',
                        'user_full_name': 'Full Name',
                        'phone_number': 'Phone Number'
                      };
                      return columnLabels[column.id] || column.id;
                    })()}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table */}
      <div className="relative w-full rounded-md border overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()

                    if (header.isPlaceholder) {
                      return <TableHead key={header.id} />
                    }

                    // Get column width based on header content
                    const getColumnWidth = () => {
                      const headerText = typeof header.column.columnDef.header === 'string' 
                        ? header.column.columnDef.header 
                        : header.id;
                      
                      switch (headerText) {
                        case 'Device Name': return 'min-w-[150px]';
                        case 'Serial Number': return 'min-w-[140px]';
                        case 'Device Type': return 'min-w-[160px]';
                        case 'Status': return 'min-w-[120px]';
                        case 'Location': return 'min-w-[140px]';
                        case 'Created At': return 'min-w-[160px]';
                        case 'Members': return 'min-w-[150px]';
                        case 'Phone Number': return 'min-w-[120px]';
                        case 'Group': return 'min-w-[100px]';
                        case 'Role': return 'min-w-[100px]';
                        case 'Actions': return 'min-w-[100px]';
                        default: return 'min-w-[100px]';
                      }
                    }

                    return (
                      <TableHead key={header.id} className={cn("px-2 py-3", getColumnWidth())}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-start gap-2 text-sm font-medium truncate",
                            canSort ? "cursor-pointer select-none" : "cursor-default",
                          )}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          disabled={isLoading}
                          title={typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : ''}
                        >
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
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
                      <TableCell
                        key={cell.id}
                        className="px-2 py-3 text-left whitespace-nowrap"
                      >
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
      </div>

      {/* Pagination Footer */}
      {showPagination && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 px-4 bg-gray-50 rounded-md border">
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-nowrap justify-center w-full md:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageIndexChange(0)}
              disabled={pageIndex === 0 || isLoading}
              className="h-8 w-8 p-0"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageIndexChange(pageIndex - 1)}
              disabled={pageIndex === 0 || isLoading}
              className="h-8 w-8 p-0"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap ml-1 sm:ml-2">Page</span>
            
            <input
              type="number"
              min="1"
              max={table.getPageCount()}
              value={pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                handlePageIndexChange(page);
              }}
              className="w-10 sm:w-12 h-8 px-2 border border-gray-300 rounded text-xs sm:text-sm text-center mx-1 sm:mx-2"
              disabled={isLoading || table.getPageCount() === 0}
            />

            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">/ {table.getPageCount()}</span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageIndexChange(pageIndex + 1)}
              disabled={pageIndex >= table.getPageCount() - 1 || isLoading}
              className="h-8 w-8 p-0"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageIndexChange(table.getPageCount() - 1)}
              disabled={pageIndex >= table.getPageCount() - 1 || isLoading}
              className="h-8 w-8 p-0"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-row items-center justify-center md:justify-end gap-2 md:gap-4 w-full md:w-auto">
            <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {(() => {
                const ps = parseInt(pageSize, 10) || 10;
                return `Showing ${table.getRowModel().rows.length > 0 ? pageIndex * ps + 1 : 0} to ${Math.min((pageIndex + 1) * ps, table.getFilteredRowModel().rows.length)} of ${table.getFilteredRowModel().rows.length} total records`;
              })()}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  handlePageSizeChange(e.target.value);
                  handlePageIndexChange(0);
                }}
                className="px-2 py-1 border rounded text-xs sm:text-sm bg-white"
              >
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="10">10</option>
                <option value="24">24</option>
                <option value={filteredData.length}>All</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
