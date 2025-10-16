import React from "react"
import { getOrganizationMembersById } from "@/action/members"
import { getMemberPerformance } from "@/action/member_performance"
import MemberProfile from "@/components/members/member-profile"
import { ContentLayout } from "@/components/admin-panel/content-layout"

interface Props {
  params: { id: string }
}

export default async function MemberProfilePage({ params }: Props) {
  const { id } = await params

  const [memberRes, perfRes] = await Promise.all([
    getOrganizationMembersById(id),
    getMemberPerformance(id),
  ])

  const member = memberRes && memberRes.success ? memberRes.data : null
  const performance = perfRes && perfRes.success ? perfRes.data : undefined

  return (
    <ContentLayout title="Member Profile">
      <div className="max-w-4xl mx-auto py-4">
        {member ? (
          <>
            <MemberProfile member={member} performance={performance} />
          </>
        ) : (
          <div className="text-muted-foreground">Member not found.</div>
        )}
      </div>
    </ContentLayout>
  )
}
