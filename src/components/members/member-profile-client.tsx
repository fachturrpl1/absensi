"use client"

import React from "react"
import MemberProfile from "./member-profile"
import type { IOrganization_member, IMemberPerformance } from "@/interface"
import { useMemberRecentAttendance } from "@/hooks/use-member-recent-attendance"

type WorkSchedule = {
  name: string
  type: string
  workingHours: string
  workingDays: string[]
}

type MemberProfileClientProps = {
  member: IOrganization_member
  performance?: IMemberPerformance
  schedule?: WorkSchedule
}

export default function MemberProfileClient({ member, performance, schedule }: MemberProfileClientProps) {
  const { data: recentAttendance } = useMemberRecentAttendance(String(member.id), 14)

  return (
    <MemberProfile
      member={member}
      performance={performance}
      recentAttendance={recentAttendance}
      schedule={schedule}
    />
  )
}
