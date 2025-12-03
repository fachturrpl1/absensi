"use client"

import { AttendanceFormBatch } from "@/components/form/attendance-form-batch"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AddAttendancePage() {
    return (
        <div className="flex flex-1 flex-col gap-4 w-full">
            <div className="w-full">
                <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="bg-white text-black px-4 md:px-6 py-4 rounded-t-lg border-b-2 border-black-200">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Add Attendance Record</h1>
                    </div>
                    
                    <div className="p-4 md:p-6 space-y-6 overflow-x-auto">
                        {/* Info Card */}
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Add Attendance Record</AlertTitle>
                            <AlertDescription>
                                Record attendance for a single team member. Select member, choose status, and set check-in/check-out times.
                            </AlertDescription>
                        </Alert>

                        {/* Form */}
                        <AttendanceFormBatch />
                    </div>
                </div>
            </div>
        </div>
    )
}
