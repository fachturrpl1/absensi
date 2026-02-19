"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export type PaginationFooterProps = {
  page: number
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

  const getPageNumbers = () => {
    const delta = 1
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= safeTotalPages; i++) {
      if (i === 1 || i === safeTotalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i)
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }

  return (
    <div className={cn("mt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 py-4", className)}>
      {/* Left Side: Info & Page Size */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          Showing <span className="font-medium text-gray-900">{from}-{to}</span> of <span className="font-medium text-gray-900">{total}</span> data
        </span>
        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={isLoading}
            className="h-8 px-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Side: Pagination */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((pageNum, idx) => (
          pageNum === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-gray-400">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <Button
              key={pageNum}
              variant={page === pageNum ? "default" : "outline"}
              size="icon"
              className={cn(
                "h-8 w-8 p-0",
                page === pageNum
                  ? "bg-gray-900 hover:bg-gray-800 text-white"
                  : "text-gray-600 hover:text-gray-900"
              )}
              onClick={() => onPageChange(Number(pageNum))}
              disabled={isLoading}
            >
              {pageNum}
            </Button>
          )
        ))}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotalPages || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
