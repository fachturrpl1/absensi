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
import { Columns3Cog, Loader2, Search, Filter } from "lucide-react"
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
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: parseInt(pageSize) })

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
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
    },
    initialState: {
      pagination: {
        pageSize: parseInt(pageSize),
      },
    },
  })
  
  // Sink select pageSize -> pagination state and reset to first page
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize: parseInt(pageSize), pageIndex: 0 }))
  }, [pageSize])

  // Clamp pageIndex when filtered data or pageSize changes
  React.useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredData.length / pagination.pageSize))
    if (pagination.pageIndex > totalPages - 1) {
      setPagination((prev) => ({ ...prev, pageIndex: totalPages - 1 }))
    }
  }, [filteredData.length, pagination.pageSize, pagination.pageIndex])

  // Generate pagination numbers with smart ellipsis
  const generatePaginationNumbers = () => {
    const currentPage = table.getState().pagination.pageIndex + 1
    const totalPages = table.getPageCount()
    const pages: (number | string)[] = []
    const maxVisible = 5
    const sidePages = 2

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than or equal to max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate range around current page
      const rangeStart = Math.max(2, currentPage - sidePages)
      const rangeEnd = Math.min(totalPages - 1, currentPage + sidePages)

      // Add ellipsis before range if needed
      if (rangeStart > 2) {
        pages.push('...')
      }

      // Add pages in range
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i)
      }

      // Add ellipsis after range if needed
      if (rangeEnd < totalPages - 1) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }



  return (
    <div className="space-y-4">
      {/* Search Bar - Full Width */}
      {showGlobalFilter && (
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 placeholder:text-ellipsis placeholder:overflow-hidden placeholder:whitespace-nowrap"
            title={searchPlaceholder}
          />
        </div>
      )}
      
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
                        case 'Members': return 'min-w-[150px]';
                        case 'Phone Number': return 'min-w-[120px]';
                        case 'Group': return 'min-w-[100px]';
                        case 'Role': return 'min-w-[100px]';
                        case 'Status': return 'min-w-[100px]';
                        case 'Actions': return 'min-w-[140px]';
                        default: return 'min-w-[80px]';
                      }
                    };

                    return (
                      <TableHead key={header.id} className={cn("px-3 py-3 whitespace-nowrap", getColumnWidth())}>
                        <button
                          type="button"
                          className={cn(
                            "flex items-center justify-center gap-2 text-sm font-medium truncate",
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
                    {row.getVisibleCells().map((cell) => {
                      const isMembersColumn = typeof cell.column.columnDef.header === 'string' && 
                                            cell.column.columnDef.header === 'Members';
                      
                      return (
                        <TableCell 
                          key={cell.id} 
                          className={cn(
                            "px-3 py-3 whitespace-nowrap",
                            isMembersColumn ? "text-left" : "text-center"
                          )}
                        >
                          <div className={cn(
                            "flex items-center gap-1",
                            isMembersColumn ? "justify-start" : "justify-center"
                          )}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </TableCell>
                      )
                    })}
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

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between py-4">
          {/* Page Info - Left */}
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({filteredData.length} total)
          </div>

          {/* Pagination Navigation - Right */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              Previous
            </Button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {generatePaginationNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 py-1 text-muted-foreground">
                      ...
                    </span>
                  )
                }
                
                const currentPage = table.getState().pagination.pageIndex + 1
                const pageNum = page as number
                
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? "default" : "outline"}
                    onClick={() => table.setPageIndex(pageNum - 1)}
                    className="w-8 h-8 p-0"
                    disabled={isLoading}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
