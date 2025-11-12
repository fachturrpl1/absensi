import ModernAttendanceList from "@/components/attendance/modern-attendance-list"

// Server Component - Modern attendance list only (secure by design)
// Classic attendance view has been removed due to security vulnerabilities
export default async function AttendancePage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <ModernAttendanceList />
    </div>
  )
}
