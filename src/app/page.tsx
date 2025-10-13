"use client"
import { getUserOrganizationId } from "@/action/members";
import { getDashboardStats } from "@/action/dashboard";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { DashboardCard } from "@/components/dashboard-card";
import { GroupChart } from "@/components/bar-chart";
import { ChartLineDots } from "@/components/line-chart";
import { AttendanceByGroupTable } from "@/components/attendance-by-group-table/attendance-by-group-table";
import { MemberStatusChart } from "@/components/pie-chart";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
// icons moved to centralized exports; removed unused lucide-react imports
import { CustomerInsights } from "@/components/customer-insights";
import { SectionCards } from "@/components/section-cards";


export default function Home() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [dashboardStats, setDashboardStats] = useState<{
    totalActiveMembers: number;
    totalMembers: number;
    todayAttendance: number;
    todayLate: number;
    todayAbsent: number;
    todayExcused: number;
    pendingApprovals: number;
    totalGroups: number;
    memberDistribution: {
      status: { name: string; value: number; color: string; }[];
      employment: { name: string; value: number; color: string; }[];
    } | never[];
  }>({
    totalActiveMembers: 0,
    totalMembers: 0,
    todayAttendance: 0,
    todayLate: 0,
    todayAbsent: 0,
    todayExcused: 0,
    pendingApprovals: 0,
    totalGroups: 0,
    memberDistribution: { status: [], employment: [] }
  })
  const [loading, setLoading] = useState(true)
  const [attendanceGroups, setAttendanceGroups] = useState<any[] | null>(null)
  const [organizationLoading, setOrganizationLoading] = useState(true)
  const [monthlyAttendance, setMonthlyAttendance] = useState<{ currentMonth: number; previousMonth: number; percentChange: number } | null>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const res = await getUserOrganizationId(user.id)
        setOrgId(res.organizationId)
        setOrganizationLoading(false)
        
        // Fetch dashboard stats
        if (res.organizationId) {
          const stats = await getDashboardStats()
          setDashboardStats(stats)

          // Fetch monthly attendance from server-side API (server will use service/client with cookies)
          try {
            const resp = await fetch('/api/dashboard/monthly', { credentials: 'same-origin' })
            const json = await resp.json()
            console.log('[dashboard] /api/dashboard/monthly response status', resp.status, json)
            if (json && json.success && json.data) {
              setMonthlyAttendance(json.data)
            } else {
              console.error('Monthly attendance API returned no data', { status: resp.status, body: json })
            }
          } catch (err) {
            console.error('Failed to fetch monthly attendance from API', err)
          }
        }
      } else {
        setOrganizationLoading(false)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // fetch attendance groups after orgId is available (avoid showing other orgs)
  useEffect(() => {
    if (!orgId) return

    async function fetchGroups() {
      try {
        const query = `?organizationId=${orgId}`
        const resp = await fetch(`/api/attendance/group${query}`)
        const json = await resp.json()
        if (json && json.success) {
          // transform data to table schema
          const transformed = (json.data || []).map((g: any) => {
            const present_plus_late = (g.present || 0) + (g.late || 0)
            const not_in_others = (g.absent || 0) + (g.excused || 0) + (g.others || 0)
            const total = g.total || present_plus_late + not_in_others
            const percent_present = total > 0 ? present_plus_late / total : 0
            const late_count = g.late || 0
            const overall = present_plus_late + not_in_others
            return {
              group: g.group,
              present_plus_late,
              not_in_others,
              percent_present,
              late_count,
              overall,
            }
          })
          setAttendanceGroups(transformed)
        } else {
          setAttendanceGroups([])
        }
      } catch (err) {
        console.error('Failed to load attendance groups', err)
        setAttendanceGroups([])
      }
    }
    fetchGroups()
  }, [orgId])

  // Show loading state while checking organization
  if (organizationLoading) {
    return (
      <ContentLayout title="Dashboard">
        <div className="mt-10 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ContentLayout>
    )
  }

  // Show organization not found message only after loading is complete
  if (!organizationLoading && orgId === null) {
    return (
      <ContentLayout title="Dashboard">
        <div className="mt-10 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">You are not assigned to any organization.</p>
            <p className="text-sm text-muted-foreground">Please contact your administrator for access.</p>
          </div>
        </div>
      </ContentLayout>
    )
  }
  return (
    <ContentLayout title="Dashboard">
      <div className="mt-10">
  <div className="w-full max-w-[90rem] px-6 mx-auto">
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="mt-4">
              <SectionCards monthlyAttendance={monthlyAttendance} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {orgId && <GroupChart organizationId={orgId} />}
            
            {dashboardStats.memberDistribution && 
             !Array.isArray(dashboardStats.memberDistribution) && 
             dashboardStats.memberDistribution.status && (
              <MemberStatusChart data={dashboardStats.memberDistribution.status} />
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-5">
                {/* replaced ChartLineDots with AttendanceByGroupTable */}
                <div>
                  <AttendanceByGroupTable 
                    data={attendanceGroups} 
                    isLoading={loading || organizationLoading} 
                  />
                </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}

    
