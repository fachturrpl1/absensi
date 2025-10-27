"use client"
import { getUserOrganizationId } from "@/action/members";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { DashboardCard } from "@/components/dashboard-card";
import { GroupChart } from "@/components/bar-chart";
import { ChartLineDots } from "@/components/line-chart";
import { AttendanceByGroupTable } from "@/components/attendance-by-group-table/attendance-by-group-table";
import { MemberStatusChart } from "@/components/pie-chart";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { SectionCards } from "@/components/section-cards";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { TodaySummaryHero } from "@/components/dashboard/today-summary-hero";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { useRecentActivity } from "@/hooks/use-recent-activity";
import { DepartmentComparison } from "@/components/dashboard/department-comparison";


export default function Home() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [organizationLoading, setOrganizationLoading] = useState(true)

  // Single consolidated hook call - React Query deduplicates automatically
  const { data: dashboardData, isLoading: statsLoading } = useDashboardStats()
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(15)
  
  // Extract consolidated data - no separate API calls needed
  const monthlyTrendData = dashboardData?.monthlyTrend
  const todaySummary = dashboardData?.todaySummary
  const groupComparison = dashboardData?.groupComparison
  
  // All loading states based on single hook
  const trendLoading = statsLoading
  const summaryLoading = statsLoading
  const comparisonLoading = statsLoading
  
  // Extract data from consolidated response
  const attendanceGroups = useMemo(() => {
    if (!dashboardData?.attendanceGroups) return []
    return dashboardData.attendanceGroups.map((g: any) => {
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
  }, [dashboardData?.attendanceGroups])
  
  const memberDistribution = dashboardData?.memberDistribution

  useEffect(() => {
    let isMounted = true // Prevent state updates if unmounted
    
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user && isMounted) {
        const res = await getUserOrganizationId(user.id)
        if (isMounted) {
          setOrgId(res.organizationId)
        }
      } else if (isMounted) {
        // Clear orgId if no user
        setOrgId(null)
      }
      
      if (isMounted) {
        setOrganizationLoading(false)
      }
    }
    fetchData()
    
    return () => {
      isMounted = false // Cleanup
    }
  }, [])

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
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <SectionCards dashboardData={dashboardData} />

        {/* Recent Activity & Department Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <RecentActivityFeed 
            activities={recentActivity} 
            isLoading={activityLoading}
            limit={10}
          />
          <DepartmentComparison 
            departments={groupComparison}
            isLoading={comparisonLoading}
            topN={5}
          />
        </div>
        
        {/* Monthly Trend Chart */}
        <MonthlyTrendChart data={monthlyTrendData} isLoading={trendLoading} />
        
        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {orgId && <GroupChart organizationId={orgId} />}
          
          {memberDistribution && memberDistribution.status && (
            <MemberStatusChart data={memberDistribution.status} />
          )}
        </div>
        
        {/* Attendance Table */}
        <AttendanceByGroupTable 
          data={attendanceGroups} 
          isLoading={organizationLoading || statsLoading} 
        />
      </div>
    </ContentLayout>
  );
}

    
