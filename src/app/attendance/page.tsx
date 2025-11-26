"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  LayoutDashboard,
  Settings,
  AlertTriangle,
  Loader2,
  RefreshCw,
  PieChart,
  ChevronDown,
  UserCheck,
  Clock,
  XCircle,
  Users
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getDashboardStats } from "@/action/dashboard";
import { useUserStore } from "@/store/user-store";
import { AttendanceAnalytics } from "@/components/attendance/attendance-analytics";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AttendanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [distChartType, setDistChartType] = useState<'donut' | 'pie' | 'bar'>('donut');

  const { role } = useUserStore();
  const isAdmin = role === 'A001' || role === 'SA001';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading attendance stats:", error);
      toast.error("Failed to load attendance statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Attendance Dashboard</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="gap-2 w-full sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          {isAdmin && (
            <Link href="/attendance/settings">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          )}
        </div>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.todaySummary?.checkedIn || 0}</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Today</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.todaySummary?.late || 0}</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.todaySummary?.absent || 0}</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Today's Status Distribution */}
            <Card>
              <CardHeader className="pb-4">
                 <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today's Attendance</CardTitle>
                    <CardDescription>Real-time status distribution</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        {getChartIcon(distChartType)}
                        <ChevronDown className="h-4 w-4" />
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
              <CardContent>
                <AttendanceAnalytics 
                  data={stats?.todaySummary} 
                  type="distribution" 
                  loading={loading}
                  chartType={distChartType}
                />
              </CardContent>
            </Card>

            {/* Attendance Trend - Restored */}
            <Card>
              <CardHeader className="pb-4">
                 <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Attendance Trend</CardTitle>
                    <CardDescription>Last 6 months performance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
