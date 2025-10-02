"use client"

import { ContentLayout } from "@/components/admin-panel/content-layout"
import { AttendanceForm } from "@/components/form/attendance-form"
import TopBar from "@/components/top-bar"


export default function AddAttendancePage() {
    
    return (
        <ContentLayout title="Text">
            <TopBar />


            <div className="w-full max-w-6xl mx-auto p-4">

            
                
                <AttendanceForm />
              
            </div>
        </ContentLayout>

    )
}
