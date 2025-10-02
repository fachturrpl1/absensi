"use client"
import { getUserOrganizationId } from "@/action/members";
import { getDashboardStats } from "@/action/dashboard";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { DashboardCard } from "@/components/dashboard-card";
import { GroupChart } from "@/components/bar-chart";
import { ChartLineDots } from "@/components/line-chart";
import { MemberStatusChart } from "@/components/pie-chart";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Users, UserCheck, Clock, UserX, FileCheck, Building2 } from "lucide-react";


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
  const [organizationLoading, setOrganizationLoading] = useState(true)

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
        }
      } else {
        setOrganizationLoading(false)
      }
      setLoading(false)
    }
    fetchData()
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
      <div className="mt-10">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <DashboardCard
                title="Total Employees"
                value={dashboardStats.totalActiveMembers}
                description="Active employees"
                icon={Users}
                iconColor="text-blue-600"
                loading={loading}
              />
              <DashboardCard
                title="Total Groups"
                value={dashboardStats.totalGroups}
                description="Active groups"
                icon={Building2}
                iconColor="text-purple-600"
                loading={loading}
              />
              <DashboardCard
                title="All Employees"
                value={dashboardStats.totalMembers}
                description="All employees in organization"
                icon={UserCheck}
                iconColor="text-green-600"
                loading={loading}
              />
            </div>
            <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
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
            <ChartLineDots />
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
