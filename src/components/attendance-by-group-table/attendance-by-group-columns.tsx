"use client"

import type { ColumnDef } from "@tanstack/react-table"

export type AttendanceByGroupRow = {
  group?: string
  present_plus_late?: number
  not_in_others?: number
  percent_present?: number
  late_count?: number
  overall?: number
}

export const attendanceByGroupColumns: ColumnDef<AttendanceByGroupRow>[] = [
  {
    id: "group",
    accessorKey: "group",
    header: () => <span className="ms-4 font-medium">Group</span>,
    cell: ({ row }) => <span className="ms-4 text-primary">{String(row.getValue("group") ?? "Unknown")}</span>,
  },
  {
    id: "present_plus_late",
    accessorKey: "present_plus_late",
    header: () => <span className="font-medium">Attendance Present</span>,
    cell: ({ row }) => <span>{String(row.getValue("present_plus_late") ?? 0)}</span>,
  },
  {
    id: "not_in_others",
    accessorKey: "not_in_others",
    header: () => <span className="font-medium">Others</span>,
    cell: ({ row }) => <span>{String(row.getValue("not_in_others") ?? 0)}</span>,
  },
  {
    id: "percent_present",
    accessorKey: "percent_present",
  header: () => <span className="font-medium">Present Rate (%)</span>,
    cell: ({ row }) => {
      const v = row.getValue("percent_present") as number | undefined
      const num = typeof v === "number" ? v : 0
      return <span>{(num * 100).toFixed(1)}%</span>
    },
  },
  {
    id: "late_count",
    accessorKey: "late_count",
    header: () => <span className="font-medium">Late Count</span>,
    cell: ({ row }) => <span>{String(row.getValue("late_count") ?? 0)}</span>,
  },
  {
    id: "overall",
    accessorKey: "overall",
    header: () => <span className="font-medium">Overall</span>,
    cell: ({ row }) => <span>{String(row.getValue("overall") ?? 0)}</span>,
  },
]
