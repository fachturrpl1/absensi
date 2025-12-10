"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  LayoutDashboard,
  AlertTriangle,
  PieChart,
  ChevronDown,
  UserCheck,
  Clock,
  XCircle,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { getDashboardStats } from "@/action/dashboard";
import { AttendanceAnalytics } from "@/components/attendance/attendance-analytics";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useOrganizationGuard } from "@/hooks/use-organization-guard";
import { DateFilterBar, DateFilterState } from "@/components/analytics/date-filter-bar";
import useOrgStore from "@/store/org-store";

export default function AttendanceDashboard() {
  const {isChecking,hasOrganization} = useOrganizationGuard();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [distChartType, setDistChartType] = useState<'donut' | 'pie' | 'bar'>('donut');
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Date filter state
  const [dateRange, setDateRange] = useState<DateFilterState>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    return { from: today, to: endOfToday, preset: 'today' };
  });

  // Track hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const loadData = useCallback(async () => {
      console.log('🔍 loadData: Called with isChecking:', isChecking, 'hasOrganization:', hasOrganization);
    
    // Prevent loading if organization check is still in progress or no organization
    if (isChecking || !hasOrganization) {
    console.log('⏳ loadData: Skipping because:', {
      isChecking,
      hasOrganization,
      reason: isChecking ? 'still checking' : 'no organization'
    });
    return;
  }
    
    setLoading(true);
    try {
      const orgId = useOrgStore.getState().organizationId || null;
      const data = await getDashboardStats(orgId || undefined);
      setStats(data);
    } catch (error) {
      console.error("Error loading attendance stats:", error);
      toast.error("Failed to load attendance statistics");
    } finally {
      setLoading(false);
    }
  }, [isChecking, hasOrganization]);

  useEffect(() => {
  // Only load data when organization check is complete and we have organization
  if (!isChecking && hasOrganization) {
    loadData();
  }
}, [isChecking, hasOrganization])
  if (isChecking || !hasOrganization) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking organization...</p>
        </div>
      </div>
    );
  }

  // Don't render Tabs until hydration is complete
  if (!isHydrated) {
    return (
      <div className="flex flex-1 flex-col gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DateFilterBar 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange}
          />
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="grid gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 w-full">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden w-full min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-1.5 md:pb-2 px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-6 pt-1.5 sm:pt-2 md:pt-3 lg:pt-4 xl:pt-6">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent className="px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-6 pb-1.5 sm:pb-2 md:pb-3 lg:pb-4 xl:pb-6">
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getChartIcon = (chartType: 'donut' | 'pie' | 'bar') => {
    switch (chartType) {
      case 'donut':
      case 'pie':
        return <PieChart className="h-4 w-4" />;
      case 'bar':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <PieChart className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <DateFilterBar 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Error State */}
      {!loading && !stats && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards - Restored */}
      <div className="grid gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 w-full">
        <Card className="overflow-hidden w-full min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-1.5 md:pb-2 px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-6 pt-1.5 sm:pt-2 md:pt-3 lg:pt-4 xl:pt-6">
            <CardTitle className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium leading-tight truncate min-w-0">Present Today</CardTitle>
            <UserCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-green-600 shrink-0 ml-1" />
          </CardHeader>
          <CardContent className="px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-6 pb-1.5 sm:pb-2 md:pb-3 lg:pb-4 xl:pb-6">
            {loading ? (
              <Skeleton className="h-4 sm:h-5 md:h-6 lg:h-8 w-10 sm:w-12 md:w-16 lg:w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.todaySummary?.checkedIn || 0}</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden w-full min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-1.5 md:pb-2 px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-6 pt-1.5 sm:pt-2 md:pt-3 lg:pt-4 xl:pt-6">
            <CardTitle className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium leading-tight truncate min-w-0">Late Today</CardTitle>
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-amber-600 shrink-0 ml-1" />
          </CardHeader>
          <CardContent className="px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-6 pb-1.5 sm:pb-2 md:pb-3 lg:pb-4 xl:pb-6">
            {loading ? (
              <Skeleton className="h-4 sm:h-5 md:h-6 lg:h-8 w-10 sm:w-12 md:w-16 lg:w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.todaySummary?.late || 0}</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden w-full min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-1.5 md:pb-2 px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-6 pt-1.5 sm:pt-2 md:pt-3 lg:pt-4 xl:pt-6">
            <CardTitle className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium leading-tight truncate min-w-0">Absent Today</CardTitle>
            <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-red-600 shrink-0 ml-1" />
          </CardHeader>
          <CardContent className="px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-6 pb-1.5 sm:pb-2 md:pb-3 lg:pb-4 xl:pb-6">
            {loading ? (
              <Skeleton className="h-4 sm:h-5 md:h-6 lg:h-8 w-10 sm:w-12 md:w-16 lg:w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.todaySummary?.absent || 0}</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden w-full min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-1.5 md:pb-2 px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-6 pt-1.5 sm:pt-2 md:pt-3 lg:pt-4 xl:pt-6">
            <CardTitle className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium leading-tight truncate min-w-0">Total Members</CardTitle>
            <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-muted-foreground shrink-0 ml-1" />
          </CardHeader>
          <CardContent className="px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-6 pb-1.5 sm:pb-2 md:pb-3 lg:pb-4 xl:pb-6">
            {loading ? (
              <Skeleton className="h-4 sm:h-5 md:h-6 lg:h-8 w-10 sm:w-12 md:w-16 lg:w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveTab("overview")}
            className="flex-1 sm:flex-none gap-2 h-9 px-4"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "outline"}
            onClick={() => setActiveTab("analytics")}
            className="flex-1 sm:flex-none gap-2 h-9 px-4"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 w-full">
            {/* Today's Status Distribution */}
            <Card className="w-full min-w-0 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-2 sm:px-3 md:px-4 lg:px-6 pt-2 sm:pt-3 md:pt-4 lg:pt-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl truncate">Today's Attendance</CardTitle>
                    <CardDescription className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm truncate">Real-time status distribution</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 md:gap-2 h-7 sm:h-8 md:h-9 w-full sm:w-auto shrink-0 text-[10px] sm:text-xs md:text-sm">
                        {getChartIcon(distChartType)}
                        <span className="hidden sm:inline">Chart</span>
                        <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDistChartType('donut')}>Donut Chart</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDistChartType('pie')}>Pie Chart</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDistChartType('bar')}>Bar Chart</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:px-3 md:px-4 lg:px-6 pb-2 sm:pb-3 md:pb-4 lg:pb-6 w-full min-w-0">
                <AttendanceAnalytics 
                  data={stats?.todaySummary} 
                  type="distribution" 
                  loading={loading}
                  chartType={distChartType}
                />
              </CardContent>
            </Card>

            {/* Attendance Trend - Restored */}
            <Card className="w-full min-w-0 overflow-hidden">
              <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-2 sm:px-3 md:px-4 lg:px-6 pt-2 sm:pt-3 md:pt-4 lg:pt-6">
                 <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl truncate">Attendance Trend</CardTitle>
                    <CardDescription className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm truncate">Last 6 months performance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:px-3 md:px-4 lg:px-6 pb-2 sm:pb-3 md:pb-4 lg:pb-6 w-full min-w-0">
                <AttendanceAnalytics 
                  data={stats?.monthlyTrend} 
                  type="trend" 
                  loading={loading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
           <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>More in-depth analysis (Coming Soon)</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                Advanced analytics features are being developed.
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
