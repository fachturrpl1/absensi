"use client"

import { useEffect, useState } from "react"
import { getWorkSchedulesPage } from "@/action/schedule"
import ScheduleClient from "./schedule-client"
import { IWorkSchedule } from "@/interface"
import { useHydration } from "@/hooks/useHydration"
import { useOrgStore } from "@/store/org-store"
import { toast } from "sonner"

// Server Component - fetch data di server (now with secure organization filtering)
export default function WorkSchedulesPage() {
  const { isReady, organizationId } = useHydration()
  const { organizationName } = useOrgStore()
  const [schedules, setSchedules] = useState<IWorkSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!isReady) return
    setPageIndex(0)
  }, [isReady, organizationId])

  useEffect(() => {
    if (!isReady) return
    if (!organizationId) {
      setSchedules([])
      setTotalRecords(0)
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const schedulesRes = await getWorkSchedulesPage(organizationId, pageIndex, pageSize)

        if (schedulesRes?.success && Array.isArray(schedulesRes.data)) {
          setSchedules(schedulesRes.data as IWorkSchedule[])
          setTotalRecords(typeof schedulesRes.total === "number" ? schedulesRes.total : 0)
        } else {
          setSchedules([])
          setTotalRecords(0)
        }
      } catch (error) {
        toast.error("Failed to load work schedules")
        setSchedules([])
        setTotalRecords(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isReady, organizationId, pageIndex, pageSize, refreshKey])

  if (!isReady) {
    return (
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading work schedules...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-6xl">🏢</div>
            <h2 className="text-2xl font-semibold">No Organization Selected</h2>
            <p className="text-muted-foreground max-w-md">
              Please select an organization to view work schedules.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <ScheduleClient
        initialSchedules={schedules}
        organizationId={String(organizationId)}
        organizationName={organizationName || ""}
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
