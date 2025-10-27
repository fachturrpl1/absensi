import React from "react"
import { getOrganizationMembersById } from "@/action/members"
import { getMemberPerformance } from "@/action/member_performance"
import MemberProfileClient from "@/components/members/member-profile-client"
import { ContentLayout } from "@/components/admin-panel/content-layout"

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
  const schedule = getMockSchedule()

  return (
    <ContentLayout title="Member Profile">
      <div className="max-w-4xl mx-auto py-4">
        {member ? (
          <MemberProfileClient 
            member={member} 
            performance={performance}
            schedule={schedule}
          />
        ) : (
          <div className="text-muted-foreground">Member not found.</div>
        )}
      </div>
    </ContentLayout>
  )
}
