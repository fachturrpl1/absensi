"use client"

import { useEffect, useState } from "react"
import { getActiveMemberScheduleMemberIds, getMemberSchedulesPage } from "@/action/members_schedule"
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
  const [activeMemberIds, setActiveMemberIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!organizationId) {
      console.log('[MEMBER-SCHEDULES] Waiting for organizationId - orgId:', organizationId)
      return
    }
    
    console.log('[MEMBER-SCHEDULES] Starting fetch with organizationId:', organizationId)

    const fetchLookups = async () => {
      try {
        const [membersRes, workSchedulesRes] = await Promise.all([
          getAllOrganization_member(organizationId),
          getAllWorkSchedules(organizationId),
        ])

        if (membersRes?.success && Array.isArray(membersRes.data)) {
          setMembers(membersRes.data as IOrganization_member[])
        } else {
          setMembers([])
        }

        if (workSchedulesRes?.success && Array.isArray(workSchedulesRes.data)) {
          setWorkSchedules(workSchedulesRes.data as IWorkSchedule[])
        } else {
          setWorkSchedules([])
        }

      } catch (error) {
        toast.error('Failed to load member schedules')
        setMembers([])
        setWorkSchedules([])
      }
    }

    fetchLookups()
  }, [organizationId])

  useEffect(() => {
    if (!organizationId) return

    const fetchActiveIds = async () => {
      try {
        const activeIdsRes = await getActiveMemberScheduleMemberIds(organizationId)

        if (activeIdsRes?.success && Array.isArray(activeIdsRes.data)) {
          setActiveMemberIds(activeIdsRes.data)
        } else {
          setActiveMemberIds([])
        }
      } catch (error) {
        setActiveMemberIds([])
      }
    }

    fetchActiveIds()
  }, [organizationId, refreshKey])

  useEffect(() => {
    if (!organizationId) return

    const fetchSchedules = async () => {
      try {
        setIsLoading(true)
        const schedulesRes = await getMemberSchedulesPage(organizationId, pageIndex, pageSize)

        if (schedulesRes?.success && Array.isArray(schedulesRes.data)) {
          setSchedules(schedulesRes.data as IMemberSchedule[])
          setTotalRecords(typeof schedulesRes.total === "number" ? schedulesRes.total : 0)
        } else {
          setSchedules([])
          setTotalRecords(0)
        }
      } catch (error) {
        toast.error('Failed to load member schedules')
        setSchedules([])
        setTotalRecords(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedules()
  }, [organizationId, pageIndex, pageSize, refreshKey])

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

  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <MemberSchedulesClient
        initialSchedules={schedules}
        initialMembers={members}
        initialWorkSchedules={workSchedules}
        activeMemberIds={activeMemberIds}
        isLoading={isLoading}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
