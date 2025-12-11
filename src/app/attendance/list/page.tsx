import ModernAttendanceList from "@/components/attendance/modern-attendance-list"

// Server Component
export default async function AttendancePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full">
      <ModernAttendanceList />
    </div>
  )
}
