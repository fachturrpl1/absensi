"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { AttendanceForm } from "@/components/form/attendance-form"
import { AlertCircle, Users, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AddAttendancePage() {
    return (
        <ContentLayout title="Add Manual Attendance">
            <div className="w-full max-w-5xl mx-auto space-y-6">
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <CardTitle className="text-base text-blue-900 dark:text-blue-200">Single Entry</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm text-blue-800 dark:text-blue-300">
                            Add attendance records one by one for team members.
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <CardTitle className="text-base text-green-900 dark:text-green-200">Batch Entry</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm text-green-800 dark:text-green-300">
                            Add multiple attendance records at once for a department or group.
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <CardTitle className="text-base text-purple-900 dark:text-purple-200">Quick Select</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm text-purple-800 dark:text-purple-300">
                            Use the quick select button or search for members easily.
                        </CardContent>
                    </Card>
                </div>

                {/* Tips */}
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>How to Use</AlertTitle>
                    <AlertDescription>
                        <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                            <li>Filter members by department for faster search</li>
                            <li>Use the "Quick Select" button in batch mode to add multiple members at once</li>
                            <li>Status can be selected quickly using the available buttons</li>
                            <li>Notes are optional but helpful for documentation</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                {/* Form */}
                <Card className="md:border-2">
                    <CardHeader>
                        <CardTitle className="text-xl">Add Attendance</CardTitle>
                        <CardDescription>
                            Choose Single Entry or Batch Entry mode according to your needs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AttendanceForm />
                    </CardContent>
                </Card>
            </div>
        </ContentLayout>
    )
}
