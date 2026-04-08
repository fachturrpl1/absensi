import { Suspense } from "react"
import { AttendanceAddClient } from "@/components/attendance/add/attendance-add-client"
import { LoadingAttendanceAdd } from "@/app/attendance/add/loading"

// Server Component — wrapper yang memungkinkan loading.tsx / Suspense bekerja
export default function AttendanceAddPage() {
  return (
    <Suspense fallback={<LoadingAttendanceAdd />}>
      <AttendanceAddClient />
    </Suspense>
  )
}