"use client"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { AttendanceFormClean } from "@/components/form/attendance-form-clean"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AddAttendancePage() {
    return (
        <ContentLayout title="Add Manual Attendance">
            <div className="w-full max-w-5xl mx-auto space-y-6">
                {/* Info Card */}
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Add Attendance Record</AlertTitle>
                    <AlertDescription>
                        Record attendance for a single team member. Select member, choose status, and set check-in/check-out times.
                    </AlertDescription>
                </Alert>

                {/* Form */}
                <AttendanceFormClean />
            </div>
        </ContentLayout>
    )
}
