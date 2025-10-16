"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Check, X, Clock, Info, User, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  IAttendance,
  IMemberSchedule,
  IOrganization,
  IOrganization_member,
  IUser,
  IWorkSchedule,
} from "@/interface";

import { toast } from "sonner";
import { getAllOrganization_member } from "@/action/members";
import { getAllAttendance, updateAttendanceStatus } from "@/action/attendance";
import { getAllUsers } from "@/action/users";
import { getAllOrganization } from "@/action/organization";
import { getAllWorkSchedules } from "@/action/schedule";
import { getAllMemberSchedule } from "@/action/members_schedule";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import LoadingSkeleton from "@/components/loading-skeleton";

// ✅ timezone helper & provider
import { useTimezone } from "@/components/timezone-provider";
import { formatLocalTime } from "@/utils/timezone";

// ✅ Supabase Realtime client
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type AttendanceWithRelations = IAttendance & {
  memberName?: string;
  timezone?: string;
  schedules?: IWorkSchedule[];
};

export default function AttendancePage() {
  const [attendance, setAttendance] = React.useState<AttendanceWithRelations[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const timezone = useTimezone(); // 🕒 timezone global dari layout (mis. Asia/Jakarta)

  // 🔹 Ambil semua data attendance dan relasinya
  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        attendanceRes,
        memberRes,
        usersRes,
        orgRes,
        workScheduleRes,
        memberScheduleRes,
      ] = await Promise.all([
        getAllAttendance(),
        getAllOrganization_member(),
        getAllUsers(),
        getAllOrganization(),
        getAllWorkSchedules(),
        getAllMemberSchedule(),
      ]);

      if (
        !attendanceRes.success ||
        !memberRes.success ||
        !usersRes.success ||
        !workScheduleRes ||
        !memberScheduleRes
      ) {
        throw new Error("Failed to fetch data");
      }

      const attendanceData: IAttendance[] = attendanceRes.data || [];
      const membersData: IOrganization_member[] = memberRes.data || [];
      const usersData: IUser[] = usersRes.data || [];
      const orgData: IOrganization[] = orgRes.data || [];
      const workScheduleData: IWorkSchedule[] = workScheduleRes.data || [];
      const memberScheduleData: IMemberSchedule[] = memberScheduleRes.data || [];

      const merged: AttendanceWithRelations[] = attendanceData.map((a) => {
        const member = membersData.find((m) => m.id === a.organization_member_id);
        const user = usersData.find((u) => u.id === member?.user_id);
        const org = orgData.find((o) => o.id === member?.organization_id);

        const memberSchedules = memberScheduleData.filter(
          (ms) => ms.organization_member_id === member?.id
        );

        const schedules = memberSchedules
          .map((ms) => workScheduleData.find((ws) => ws.id === ms.work_schedule_id))
          .filter((s): s is IWorkSchedule => s !== undefined);

        return {
          ...a,
          memberName: user?.first_name || "No User",
          timezone: org?.timezone || "UTC",
          schedules,
        };
      });

      setAttendance(merged);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Realtime listener Supabase
  React.useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("attendance-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_records" },
        (payload) => {
          console.log("Realtime event:", payload);
          fetchData();
        }
      )
      .subscribe((status) => console.log("Realtime status:", status));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 📊 Kolom tabel attendance
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
      cell: ({ row }) => {
        const date = row.getValue("attendance_date") as string;
        return <span>{date || "-"}</span>;
      },
    },
    {
      accessorKey: "actual_check_in",
      header: "Check In",
      cell: ({ row }) => {
        const utc = row.getValue("actual_check_in") as string;
        const tz = row.original.timezone || "Asia/Jakarta";
        return <span>{formatLocalTime(utc, tz, row.original.time_format || '24h')}</span>;
      },
    },
    {
      accessorKey: "actual_check_out",
      header: "Check Out",
      cell: ({ row }) => {
        const utc = row.getValue("actual_check_out") as string;
        const tz = row.original.timezone || "Asia/Jakarta";
        return <span>{formatLocalTime(utc, tz, row.original.time_format || '24h')}</span>;
      },
    },
    {
      header: "Schedule",
      cell: ({ row }) => {
        const schedules = row.original.schedules || [];
        return schedules.length > 0 ? (
          <div className="flex flex-col">
            {schedules.map((s: IWorkSchedule) => (
              <span key={s.id}>{s.name}</span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">No Schedule</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
          present: { color: "bg-green-500 text-white", icon: <Check className="w-3 h-3 mr-1" /> },
          absent: { color: "bg-gray-300 text-black", icon: <X className="w-3 h-3 mr-1" /> },
          late: { color: "bg-red-500 text-white", icon: <Clock className="w-3 h-3 mr-1" /> },
          excused: { color: "bg-blue-500 text-white", icon: <Info className="w-3 h-3 mr-1" /> },
        };
        const { color, icon } = statusMap[status] || { color: "bg-gray-200", icon: null };
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${color}`}
          >
            {icon} {status || "-"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const attendance = row.original;

        const handleUpdateStatus = async (newStatus: string) => {
          try {
            const res = await updateAttendanceStatus(attendance.id, newStatus);
            if (res.success) toast.success("Status updated successfully");
            else toast.error("Failed to update status");
          } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "An error occurred");
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
              {["present", "absent", "late", "excused", "go home"].map((s) => (
                <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <ContentLayout title="Attendance">
      <div className="w-full max-w-6xl mx-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <DataTable columns={columns} data={attendance} />
        )}
      </div>
    </ContentLayout>
  );
}
