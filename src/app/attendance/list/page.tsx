import ModernAttendanceList from "@/components/attendance/modern-attendance-list"
import { getAllAttendance } from "@/action/attendance";

// Server Component
export default async function AttendancePage() {
  const today = new Date();
  const from = new Date(today);
  from.setHours(0,0,0,0);
  const to = new Date(today);
  to.setHours(23,59,59,999);

  let initialData: any[] = [];
  let initialMeta: { total?: number; totalPages?: number; tz?: string } | undefined = undefined;
  try {
    const res = await getAllAttendance({
      page: 1,
      limit: 10,
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0],
    });
    if (res?.success) {
      initialData = res.data || [];
      initialMeta = { total: res.meta?.total, totalPages: res.meta?.totalPages, tz: initialData[0]?.timezone };
    }
  } catch {}

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full">
      <ModernAttendanceList initialData={initialData} initialMeta={initialMeta} />
    </div>
  )
}
