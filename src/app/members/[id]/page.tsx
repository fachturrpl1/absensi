import React from "react"
import { getOrganizationMembersById } from "@/action/members"
import { getMemberPerformance } from "@/action/member_performance"
import MemberProfileClient from "@/components/members/member-profile-client"

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [memberRes, perfRes] = await Promise.all([
    getOrganizationMembersById(id),
    getMemberPerformance(id),
  ])

  const member = memberRes && memberRes.success ? memberRes.data : null
  const performance = perfRes && perfRes.success ? perfRes.data : undefined
  // TODO: Fetch real work schedule data from database
  const schedule = undefined

  return (
    <>
      {member ? (
        <MemberProfileClient
          member={member}
          performance={performance}
          schedule={schedule}
        />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl font-semibold text-muted-foreground">Member not found.</p>
          </div>
        </div>
      )}
    </>
  )
}
