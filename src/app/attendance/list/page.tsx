import ModernAttendanceList from "@/components/attendance/modern-attendance-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

// Server Component
export default async function AttendancePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/attendance/add">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Manual Entry</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </div>

      <ModernAttendanceList />
    </div>
  )
}
