"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { DataTable } from "@/components/data-table"
import { Check, X, Clock, Info, User, MoreHorizontal, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQueryClient } from "@tanstack/react-query"

import {
  IAttendance,
  IMemberSchedule,
  IOrganization,
  IOrganization_member,
  IUser,
  IWorkSchedule,
} from "@/interface"

import { toast } from "sonner"
import { updateAttendanceStatus } from "@/action/attendance"
import { formatLocalTime } from "@/utils/timezone"
import { ATTENDANCE_STATUSES } from "@/constants/attendance-status"

type AttendanceWithRelations = IAttendance & {
  memberName?: string
  timezone?: string
  schedules?: IWorkSchedule[]
}

interface AttendanceClientProps {
  initialAttendance: IAttendance[]
  initialMembers: IOrganization_member[]
  initialUsers: IUser[]
  initialOrganizations: IOrganization[]
  initialWorkSchedules: IWorkSchedule[]
  initialMemberSchedules: IMemberSchedule[]
  defaultTimezone: string
}

export default function AttendanceClient({
  initialAttendance,
  initialMembers,
  initialUsers,
  initialOrganizations,
  initialWorkSchedules,
  initialMemberSchedules,
  defaultTimezone,
}: AttendanceClientProps) {
  const queryClient = useQueryClient()
  const [attendance, setAttendance] = React.useState<AttendanceWithRelations[]>([])

  // Merge data - memoized
  React.useEffect(() => {
    const merged: AttendanceWithRelations[] = initialAttendance.map((a) => {
      const member = initialMembers.find((m) => m.id === a.organization_member_id)
      const user = initialUsers.find((u) => u.id === member?.user_id)
      const org = initialOrganizations.find((o) => o.id === member?.organization_id)

      const memberSchedules = initialMemberSchedules.filter(
        (ms) => ms.organization_member_id === member?.id
      )

      const schedules = memberSchedules
        .map((ms) => initialWorkSchedules.find((ws) => ws.id === ms.work_schedule_id))
        .filter((s): s is IWorkSchedule => s !== undefined)

      const fullNameParts = [user?.first_name, user?.middle_name, user?.last_name].filter(
        (part): part is string => Boolean(part && part.trim())
      )
      const fullName = fullNameParts.join(" ")

      return {
        ...a,
        memberName: fullName || user?.display_name || "No User",
        timezone: org?.timezone || defaultTimezone,
        schedules,
      }
    })

    setAttendance(merged)
  }, [
    initialAttendance,
    initialMembers,
    initialUsers,
    initialOrganizations,
    initialWorkSchedules,
    initialMemberSchedules,
    defaultTimezone,
  ])

  const handleUpdateStatus = async (attendanceId: string, newStatus: string) => {
    try {
      const res = await updateAttendanceStatus(attendanceId, newStatus)
      if (res.success) {
        // Invalidate dashboard cache to refresh stats
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast.success("Status updated successfully")
        // Optimistic update
        setAttendance((prev) =>
          prev.map((a) => (a.id === attendanceId ? { ...a, status: newStatus as "present" | "late" | "absent" | "excused" } : a))
        )
      } else {
        toast.error("Failed to update status")
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const columns: ColumnDef<AttendanceWithRelations>[] = [
    {
      accessorKey: "memberName",
      header: "Members",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center">
          <User className="w-4 h-4" /> {row.getValue("memberName")}
        </div>
      ),
    },
    {
      accessorKey: "attendance_date",
      header: "Date",
      sortingFn: "datetime",
      cell: ({ row }) => {
        const date = row.getValue("attendance_date") as string
        return <span>{date || "-"}</span>
      },
    },
    {
      accessorKey: "actual_check_in",
      header: "Check In",
      sortingFn: "datetime",
      cell: ({ row }) => {
        const utc = row.getValue("actual_check_in") as string
        const tz = row.original.timezone || defaultTimezone
        return <span>{formatLocalTime(utc, tz, row.original.time_format || "24h")}</span>
      },
    },
    {
      accessorKey: "actual_check_out",
      header: "Check Out",
      cell: ({ row }) => {
        const utc = row.getValue("actual_check_out") as string
        const tz = row.original.timezone || defaultTimezone
        return <span>{formatLocalTime(utc, tz, row.original.time_format || "24h")}</span>
      },
    },
    {
      header: "Schedule",
      cell: ({ row }) => {
        const schedules = row.original.schedules || []
        return schedules.length > 0 ? (
          <div className="flex flex-col">
            {schedules.map((s: IWorkSchedule, index) => (
              <span key={`${row.original.id}-schedule-${s.id}-${index}`}>{s.name}</span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">No Schedule</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const statusConfig = ATTENDANCE_STATUSES.find((s) => s.value === status)
        if (!statusConfig) return <span>-</span>

        const Icon = statusConfig.icon
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.color}`}
          >
            <Icon className="w-3 h-3 mr-1" /> {statusConfig.label}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const record = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
              {ATTENDANCE_STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status.value}
                  onClick={() => handleUpdateStatus(record.id, status.value)}
                >
                  {status.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="items-center my-7">
        <div className="float-end ml-5">
          <Button asChild>
            <Link href="/attendance/add">
              Add Attendance <Plus className="ml-2" />
            </Link>
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={attendance}
        initialSorting={[
          { id: "attendance_date", desc: true },
          { id: "actual_check_in", desc: true },
        ]}
      />
    </div>
  )
}
