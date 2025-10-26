import React from "react"
import { getOrganizationMembersById } from "@/action/members"
import { getMemberPerformance } from "@/action/member_performance"
import MemberProfile from "@/components/members/member-profile"
import { ContentLayout } from "@/components/admin-panel/content-layout"

// Mock data for testing enhanced features
const getMockRecentAttendance = () => {
  const today = new Date()
  const records = []
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Vary the status for realistic demo
    let status: "present" | "late" | "absent" | "excused" | "leave"
    if (i === 0) status = "present"
    else if (i === 1) status = "late"
    else if (i === 3) status = "absent"
    else if (i === 6) status = "excused"
    else if (i === 7) status = "leave"
    else status = Math.random() > 0.2 ? "present" : "late"
    
    const isWorkday = status !== "leave" && status !== "excused"
    
    records.push({
      id: `rec-${i}`,
      date: date.toISOString().split('T')[0],
      status,
      checkIn: isWorkday ? (status === "late" ? "09:05" : "08:15") : undefined,
      checkOut: isWorkday ? "17:30" : undefined,
      duration: isWorkday ? (status === "late" ? "8h 25m" : "9h 15m") : undefined,
      location: isWorkday ? "Office HQ" : undefined,
    })
  }
  
  return records
}

const getMockSchedule = () => ({
  name: "Standard Office Hours",
  type: "Fixed",
  workingHours: "08:00 - 17:00",
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
})

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [memberRes, perfRes] = await Promise.all([
    getOrganizationMembersById(id),
    getMemberPerformance(id),
  ])

  const member = memberRes && memberRes.success ? memberRes.data : null
  const performance = perfRes && perfRes.success ? perfRes.data : undefined

  // Add mock data for enhanced features
  const recentAttendance = getMockRecentAttendance()
  const schedule = getMockSchedule()

  return (
    <ContentLayout title="Member Profile">
      <div className="max-w-4xl mx-auto py-4">
        {member ? (
          <MemberProfile 
            member={member} 
            performance={performance}
            recentAttendance={recentAttendance}
            schedule={schedule}
          />
        ) : (
          <div className="text-muted-foreground">Member not found.</div>
        )}
      </div>
    </ContentLayout>
  )
}
