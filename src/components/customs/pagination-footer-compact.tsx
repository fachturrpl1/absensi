"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/customs/pagination-footer"

export type PaginationFooterCompactProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  className?: string
}

// Logika Super Compact: (< 1 ... 3 ... 7 >) (< 1 2 ... 7 >)(< 1 .. 6 7 >)
function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  const range: number[] = []

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || // Selalu tampilkan halaman 1
      i === totalPages || // Selalu tampilkan halaman terakhir
      i === page || // Tampilkan halaman saat ini
      (page === 1 && i === 2) || // Jika sedang di halaman 1, tampilkan halaman 2
      (page === totalPages && i === totalPages - 1) // Jika sedang di halaman terakhir, tampilkan halaman sebelumnya
    ) {
      range.push(i)
    }
  }

  const rangeWithDots: (number | "...")[] = []
  let prev: number | undefined

  for (const i of range) {
    // Jika jarak antar angka lebih dari 1, langsung masukkan ellipsis "..."
    if (prev !== undefined && i - prev > 1) {
      rangeWithDots.push("...")
    }
    rangeWithDots.push(i)
    prev = i
  }

  return rangeWithDots
}

export function PaginationFooterCompact({
  page,
  totalPages,
  onPageChange,
  isLoading = false,
  className,
}: PaginationFooterCompactProps) {
  const safeTotalPages = Math.max(1, totalPages || 1)
  const pages = getPageNumbers(page, safeTotalPages)

  // Sembunyikan pagination jika hanya ada 1 halaman
  if (safeTotalPages <= 1) return null

  return (
    <div className={cn("flex justify-center w-full", className)}>
      <Pagination className="w-auto mx-0">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(page - 1)}
              isDisabled={page <= 1 || isLoading}
              // Override ukuran agar pas di sidebar
              className="h-8 w-8"
            />
          </PaginationItem>

          {pages.map((p, idx) =>
            p === "..." ? (
              <PaginationItem key={`dots-${idx}`}>
                <PaginationEllipsis className="h-8 w-8" />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={page === p}
                  isDisabled={isLoading}
                  onClick={() => onPageChange(p as number)}
                  className="h-8 w-8 text-xs"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(page + 1)}
              isDisabled={page >= safeTotalPages || isLoading}
              className="h-8 w-8"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}