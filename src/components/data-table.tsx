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
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { Columns3Cog, Loader2, Filter, Search } from "lucide-react"
import { PaginationFooter } from "@/components/pagination-footer"
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
  layout?: "default" | "card"
  toolbarRight?: React.ReactNode
  globalFilterPlaceholder?: string
  emptyState?: React.ReactNode
  manualPagination?: boolean
  pageIndex?: number
  pageSize?: number
  pageCount?: number
  totalRecords?: number
  onPageIndexChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  showPagination = true,
  showColumnToggle = true,
  showGlobalFilter = false,
  showFilters = false,
  getRowKey,
  layout = "default",
  toolbarRight,
  globalFilterPlaceholder,
  emptyState,
  manualPagination = false,
  pageIndex: controlledPageIndex,
  pageSize: controlledPageSize,
  pageCount: controlledPageCount,
  totalRecords,
  onPageIndexChange: onPageIndexChangeProp,
  onPageSizeChange: onPageSizeChangeProp,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})
  const [sortOrder, setSortOrder] = React.useState("newest")
  const [pageSize, setPageSize] = React.useState(String(controlledPageSize ?? 10))
  const [pagination, setPagination] = React.useState({
    pageIndex: controlledPageIndex ?? 0,
    pageSize: controlledPageSize ?? 10,
  })
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Handler functions
  const handlePageSizeChange = (value: string) => {
    setPageSize(value)

    if (manualPagination) {
      const next = Math.max(1, parseInt(value, 10) || 10)
      onPageSizeChangeProp?.(next)
      onPageIndexChangeProp?.(0)
      setPagination({ pageIndex: 0, pageSize: next })
    }
  }

  const handlePageIndexChange = (pageIndex: number) => {
    if (manualPagination) {
      const next = Math.max(0, Number(pageIndex) || 0)
      onPageIndexChangeProp?.(next)
      setPagination((prev) => ({ ...prev, pageIndex: next }))
      return
    }

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
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
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
    manualPagination,
    pageCount: manualPagination
      ? (controlledPageCount ?? Math.max(1, Math.ceil((totalRecords ?? 0) / (parseInt(pageSize, 10) || 10))))
      : undefined,
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
    if (manualPagination) return
    const newPageSize = parseInt(pageSize, 10) || 10
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, pageIndex: 0 }))
  }, [pageSize])

  React.useEffect(() => {
    if (!manualPagination) return
    if (typeof controlledPageIndex === "number") {
      setPagination((prev) => ({ ...prev, pageIndex: controlledPageIndex }))
    }
  }, [manualPagination, controlledPageIndex])

  React.useEffect(() => {
    if (!manualPagination) return
    if (typeof controlledPageSize === "number") {
      setPageSize(String(controlledPageSize))
      setPagination((prev) => ({ ...prev, pageSize: controlledPageSize }))
    }
  }, [manualPagination, controlledPageSize])

  // Clamp pageIndex when filtered data or pageSize changes
  React.useEffect(() => {
    if (manualPagination) return
    const newPageSize = parseInt(pageSize, 10) || 10
    const totalPages = Math.max(1, Math.ceil(filteredData.length / newPageSize))
    if (pageIndex > totalPages - 1) {
      handlePageIndexChange(Math.max(0, totalPages - 1))
    }
  }, [filteredData.length, pageSize, pageIndex])

  const effectivePageCount = manualPagination
    ? (controlledPageCount ?? Math.max(1, Math.ceil((totalRecords ?? 0) / (parseInt(pageSize, 10) || 10))))
    : table.getPageCount()

  const controls = (
    <div className="flex flex-col gap-3 w-full md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap sm:items-center md:flex-nowrap md:flex-1 md:gap-2">
        {showGlobalFilter && (
          <div className="relative w-full md:flex-1 md:min-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={globalFilterPlaceholder || "Search..."}
              className="pl-9"
            />
          </div>
        )}

        {showFilters && (
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full sm:w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="a-z">A-Z</SelectItem>
                <SelectItem value="z-a">Z-A</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 w-full justify-end md:w-auto md:flex-nowrap">
        {toolbarRight}

        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full md:w-auto">
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
    </div>
  )

  const tableContent = (
    <div className="relative w-full rounded-md border overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 pointer-events-none">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {table.getRowModel().rows?.length ? (
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
                        {header.column.id === 'select' ? (
                          flexRender(header.column.columnDef.header, header.getContext())
                        ) : (
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
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row, index) => (
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
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        emptyState ? (
          <div className="py-12 px-4">
            {emptyState}
          </div>
        ) : (
          <div className="py-10 px-4 text-center text-sm text-muted-foreground">
            {isLoading ? "Loading..." : "No results."}
          </div>
        )
      )}
    </div>
  )

  const paginationFooter = showPagination ? (() => {
    const ps = parseInt(pageSize, 10) || 10
    const total = manualPagination ? (totalRecords ?? 0) : table.getFilteredRowModel().rows.length
    return (
      <PaginationFooter
        page={pageIndex + 1}
        totalPages={effectivePageCount || 1}
        onPageChange={(p) => handlePageIndexChange(Math.max(0, (p - 1)))}
        isLoading={isLoading}
        from={total > 0 ? pageIndex * ps + 1 : 0}
        to={Math.min((pageIndex + 1) * ps, total)}
        total={total}
        pageSize={ps}
        onPageSizeChange={(size) => { handlePageSizeChange(String(size)); handlePageIndexChange(0); }}
        pageSizeOptions={[10, 50, 100]}
      />
    )
  })() : null

  return (
    <div className="space-y-4">
      {layout === "card" ? (
        <>
          <Card>
            <CardContent className="p-4">{controls}</CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">{tableContent}</CardContent>
          </Card>
          {paginationFooter}
        </>
      ) : (
        <>
          {controls}
          {tableContent}
          {paginationFooter}
        </>
      )}
    </div>
  )
}
