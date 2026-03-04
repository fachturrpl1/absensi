"use client"

import { useEffect, useState } from "react"
import { getMemberSchedulesPage } from "@/action/members_schedule"
import MemberSchedulesClient from "./member-schedules-client"
import { IMemberSchedule } from "@/interface"
import { useHydration } from "@/hooks/useHydration"
import { toast } from "sonner"

// Client Component - fetch data berdasarkan organization dari store
export default function MemberSchedulesPage() {
  const { organizationId } = useHydration()
  const [schedules, setSchedules] = useState<IMemberSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

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
        initialMembers={[]}
        initialWorkSchedules={[]}
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
