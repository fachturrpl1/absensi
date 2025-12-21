"use client"

import { useEffect, useState } from "react"
import { getAllMemberSchedule } from "@/action/members_schedule"
import { getAllOrganization_member } from "@/action/members"
import { getAllWorkSchedules } from "@/action/schedule"
import MemberSchedulesClient from "./member-schedules-client"
import { IMemberSchedule, IOrganization_member, IWorkSchedule } from "@/interface"
import { useHydration } from "@/hooks/useHydration"
import { toast } from "sonner"

// Client Component - fetch data berdasarkan organization dari store
export default function MemberSchedulesPage() {
  const { organizationId } = useHydration()
  const [schedules, setSchedules] = useState<IMemberSchedule[]>([])
  const [members, setMembers] = useState<IOrganization_member[]>([])
  const [workSchedules, setWorkSchedules] = useState<IWorkSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!organizationId) {
      console.log('[MEMBER-SCHEDULES] Waiting for organizationId - orgId:', organizationId)
      return
    }
    
    console.log('[MEMBER-SCHEDULES] Starting fetch with organizationId:', organizationId)

    const fetchData = async () => {

      try {
        setIsLoading(true)
        const [schedulesRes, membersRes, workSchedulesRes] = await Promise.all([
          getAllMemberSchedule(organizationId),
          getAllOrganization_member(organizationId),
          getAllWorkSchedules(organizationId),
        ])

        // Validate and safely extract data
        if (!schedulesRes || typeof schedulesRes !== 'object') {
          console.error('[MEMBER-SCHEDULES] Invalid schedules response:', schedulesRes)
          setSchedules([])
        } else if (schedulesRes.success && Array.isArray(schedulesRes.data)) {
          console.log('[MEMBER-SCHEDULES] ✅ Fetched', schedulesRes.data.length, 'schedules for org', organizationId)
          setSchedules(schedulesRes.data as IMemberSchedule[])
        } else {
          console.warn('[MEMBER-SCHEDULES] ❌ Schedules fetch failed:', schedulesRes.message)
          setSchedules([])
        }

        if (!membersRes || typeof membersRes !== 'object') {
          console.error('[MEMBER-SCHEDULES] Invalid members response:', membersRes)
          setMembers([])
        } else if (membersRes.success && Array.isArray(membersRes.data)) {
          console.log('[MEMBER-SCHEDULES] ✅ Fetched', membersRes.data.length, 'members for org', organizationId)
          setMembers(membersRes.data as IOrganization_member[])
        } else {
          console.warn('[MEMBER-SCHEDULES] ❌ Members fetch failed:', membersRes.message)
          setMembers([])
        }

        if (!workSchedulesRes || typeof workSchedulesRes !== 'object') {
          console.error('[MEMBER-SCHEDULES] Invalid work schedules response:', workSchedulesRes)
          setWorkSchedules([])
        } else if (workSchedulesRes.success && Array.isArray(workSchedulesRes.data)) {
          console.log('[MEMBER-SCHEDULES] ✅ Fetched', workSchedulesRes.data.length, 'work schedules for org', organizationId)
          setWorkSchedules(workSchedulesRes.data as IWorkSchedule[])
        } else {
          console.warn('[MEMBER-SCHEDULES] ❌ Work schedules fetch failed:', workSchedulesRes.message)
          setWorkSchedules([])
        }
      } catch (error) {
        console.error('[MEMBER-SCHEDULES] Error fetching data:', error)
        toast.error('Failed to load member schedules')
        setSchedules([])
        setMembers([])
        setWorkSchedules([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [organizationId])

  if (!organizationId) {
    return (
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-6xl">🏢</div>
            <h2 className="text-2xl font-semibold">No Organization Selected</h2>
            <p className="text-muted-foreground max-w-md">
              Please select an organization to view member schedules.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading member schedules...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <MemberSchedulesClient
        initialSchedules={schedules}
        initialMembers={members}
        initialWorkSchedules={workSchedules}
      />
    </div>
  )
}
