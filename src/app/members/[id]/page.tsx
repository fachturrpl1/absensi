import React from "react"
import { getOrganizationMembersById } from "@/action/members"
import { getMemberPerformance } from "@/action/member_performance"
import { getMemberAttendanceTrend } from "@/action/member_attendance_trend"
import MemberProfile from "@/components/members/member-profile"
import { ContentLayout } from "@/components/admin-panel/content-layout"

interface Props {
  params: { id: string }
}

export default async function MemberProfilePage({ params }: Props) {
  const { id } = await params

  const [memberRes, perfRes, trendRes] = await Promise.all([
    getOrganizationMembersById(id),
    getMemberPerformance(id),
    getMemberAttendanceTrend(id),
  ])

  const member = memberRes && memberRes.success ? memberRes.data : null
  const performance = perfRes && perfRes.success ? perfRes.data : undefined
  const attendanceTrend = trendRes && trendRes.success ? trendRes.data : []

  return (
    <ContentLayout title="Member Profile">
      <div className="max-w-4xl mx-auto py-4">
        {member ? (
          <>
            <MemberProfile member={member} performance={performance} attendanceTrend={attendanceTrend} />
          </>
        ) : (
          <div className="text-muted-foreground">Member not found.</div>
        )}
      </div>
    </ContentLayout>
  )
}
