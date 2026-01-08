"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"

export type PaginationFooterProps = {
  page: number // 1-based
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  from: number
  to: number
  total: number
  pageSize: number
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function PaginationFooter({
  page,
  totalPages,
  onPageChange,
  isLoading = false,
  from,
  to,
  total,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className = "",
}: PaginationFooterProps) {
  const safeTotalPages = Math.max(1, totalPages || 1)

  const clamp = (n: number) => Math.max(1, Math.min(n, safeTotalPages))

  const goto = (p: number) => {
    const next = clamp(p)
    if (next !== page) onPageChange(next)
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 py-4 px-4 bg-muted/50 rounded-md border ${className}`}>
      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goto(1)}
          disabled={page <= 1 || isLoading}
          className="h-8 w-8 p-0"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goto(page - 1)}
          disabled={page <= 1 || isLoading}
          className="h-8 w-8 p-0"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm text-muted-foreground">Page</span>

        <input
          type="number"
          min={1}
          max={safeTotalPages}
          value={page}
          onChange={(e) => {
            const raw = Number(e.target.value || 1)
            goto(Number.isFinite(raw) ? raw : 1)
          }}
          className="w-12 h-8 px-2 border rounded text-sm text-center bg-background"
          disabled={isLoading}
        />

        <span className="text-sm text-muted-foreground">/ {safeTotalPages}</span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => goto(page + 1)}
          disabled={page >= safeTotalPages || isLoading}
          className="h-8 w-8 p-0"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goto(safeTotalPages)}
          disabled={page >= safeTotalPages || isLoading}
          className="h-8 w-8 p-0"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex w-full sm:w-auto flex-col items-center gap-2 sm:flex-row sm:justify-end sm:items-center sm:gap-4">
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-right whitespace-normal">
          {`Showing ${from} to ${to} of ${total} total records`}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              const val = Number(e.target.value)
              const size = Number.isFinite(val) && val > 0 ? val : pageSize
              onPageSizeChange(size)
              goto(1)
            }}
            className="px-2 py-1 border rounded text-sm bg-background"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
