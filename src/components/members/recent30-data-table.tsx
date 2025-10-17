"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type RecentRow = {
  attendance_date?: string
  status?: string
  work_duration_minutes?: number | null
}

const columns: ColumnDef<RecentRow, any>[] = [
  {
    accessorKey: "attendance_date",
    header: "Date",
    cell: ({ getValue }) => {
      const v = getValue() as string | undefined
      if (!v) return "-"
      try {
        const dt = new Date(v)
        if (isNaN(dt.getTime())) return String(v)
        return format(dt, "MMM d, yyyy")
      } catch {
        return String(v)
      }
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = (getValue() as string) || "-"
      const color = s === "present" ? "green" : s === "late" ? "amber" : s === "absent" ? "red" : "muted"
      return <Badge variant="outline" className="capitalize">{s}</Badge>
    },
  },
  {
    accessorKey: "work_duration_minutes",
    header: "Duration",
    cell: ({ getValue }) => {
      const v = getValue() as number | null | undefined
      if (v == null) return "-"
      const mins = Number(v)
      if (!Number.isFinite(mins)) return String(v)
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return `${h}h ${String(m).padStart(2, "0")}m`
    },
    meta: { align: "right" },
  },
]

export function Recent30DataTable({ data }: { data: RecentRow[] }) {
  // Limit to last 7 days (including today)
  const filtered = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6) // last 7 days inclusive
    const startIso = start.toISOString().split("T")[0]
    const endIso = end.toISOString().split("T")[0]

    return data
      .filter((r) => {
        const d = r.attendance_date
        if (!d) return false
        const s = String(d)
        // try to extract YYYY-MM-DD via regex first (handles '2025-10-13', '2025-10-13 08:00', etc.)
        const m = s.match(/\d{4}-\d{2}-\d{2}/)
        let ds: string | null = null
        if (m) ds = m[0]
        else {
          // fallback to Date parsing
          const dt = new Date(s)
          if (!isNaN(dt.getTime())) ds = dt.toISOString().split("T")[0]
        }
        if (!ds) return false
        return ds >= startIso && ds <= endIso
      })
      .sort((a, b) => {
        // sort descending by date
        const ad = a.attendance_date ? String(a.attendance_date).localeCompare(String(b.attendance_date)) : 0
        return -ad
      })
  }, [data])

  return (
    <div>
      <div className="mb-2">
        <div className="text-sm font-medium">Attendance in the last 7 days</div>
      </div>
      <DataTable columns={columns} data={filtered} showGlobalFilter={false} showPagination={false} showColumnToggle={false} />
    </div>
  )
}

export default Recent30DataTable
