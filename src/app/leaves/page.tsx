"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Calendar, 
  FileText, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Settings,
  PieChart,
  BarChart3,
  Activity,
  UserCheck,
  CalendarOff,
  Briefcase
} from "lucide-react";
import { getMyLeaveBalance, getMyLeaveRequests, getLeaveTypes } from "@/action/leaves";
import { getLeaveStatistics, getAllLeaveRequests, getOrganizationLeaveTypes } from "@/action/admin-leaves";
import { LeaveBalanceWithType, ILeaveRequest, ILeaveType } from "@/lib/leave/types";
import { formatLeaveDateRange, getStatusColor } from "@/lib/leave/utils";
import { useUserStore } from "@/store/user-store";
import { useOrgStore } from "@/store/org-store";
import Link from "next/link";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { LeaveRequestList } from "@/components/leave/leave-request-list";
import { LeaveCalendar } from "@/components/leave/leave-calendar";
import { LeaveAnalytics } from "@/components/leave/leave-analytics";
import { cn } from "@/lib/utils";

import { logger } from '@/lib/logger';

interface LeaveStatistics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalEmployees: number;
  employeesOnLeave: number;
  upcomingLeaves: number;
  averageLeaveDays: number;
}

export default function LeavesPage() {
  const [balances, setBalances] = useState<LeaveBalanceWithType[]>([]);
  const [requests, setRequests] = useState<ILeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<ILeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<ILeaveType[]>([]);
  const [statistics, setStatistics] = useState<LeaveStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const { role, permissions } = useUserStore();
  const { organizationId } = useOrgStore();
  const isAdmin = role === 'ADMIN_ORG' || role === 'SUPER_ADMIN';
  const canManageLeaveTypes = permissions?.includes('leaves:type:manage') || isAdmin;
  const canViewAllRequests = permissions?.includes('leaves:request:read_all') || isAdmin;
  const canApproveRequests = permissions?.includes('leaves:approval:create') || isAdmin;

  // Load data based on user role
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin && organizationId) {
        // Admin: Load all organization data
        const [statsResult, allRequestsResult, typesResult, balanceResult, myRequestsResult] = await Promise.all([
          getLeaveStatistics(organizationId),
          getAllLeaveRequests(organizationId),
          getOrganizationLeaveTypes(organizationId),
          getMyLeaveBalance(),
          getMyLeaveRequests()
        ]);

        if (statsResult.success && statsResult.data) {
          setStatistics(statsResult.data);
        }

        if (allRequestsResult.success && allRequestsResult.data) {
          setAllRequests(allRequestsResult.data);
        }

        if (typesResult.success && typesResult.data) {
          setLeaveTypes(typesResult.data);
        }

        if (balanceResult.success && balanceResult.data) {
          setBalances(balanceResult.data as any);
        }

        if (myRequestsResult.success && myRequestsResult.data) {
          setRequests(myRequestsResult.data);
        }
      } else {
        // User: Load personal data only
        const [balanceResult, requestsResult, typesResult] = await Promise.all([
          getMyLeaveBalance(),
          getMyLeaveRequests(),
          getLeaveTypes()
        ]);

        if (balanceResult.success && balanceResult.data) {
          setBalances(balanceResult.data as any);
        }

        if (requestsResult.success && requestsResult.data) {
          setRequests(requestsResult.data);
        }

        if (typesResult.success && typesResult.data) {
          setLeaveTypes(typesResult.data);
        }
      }
    } catch (error) {
      logger.error("Error loading data:", error);
      toast.error("Failed to load leave data");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, organizationId]);

  // Setup real-time subscription
  useEffect(() => {
    loadData();

    // Setup Supabase real-time subscription
    const supabase = createClient();
    
    const channel = supabase
      .channel('leave-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_requests'
        },
        (payload) => {
          logger.info('Leave request change:', payload);
          // Reload data when changes occur
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_balances'
        },
        (payload) => {
          logger.info('Leave balance change:', payload);
          // Reload data when changes occur
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Calculate dynamic statistics
  const calculateStats = () => {
    if (!isAdmin) {
      // User statistics
      const totalBalance = balances.reduce((sum, b) => sum + (b.remaining_days || 0), 0);
      const usedDays = balances.reduce((sum, b) => sum + (b.used_days || 0), 0);
      const pendingDays = balances.reduce((sum, b) => sum + (b.pending_days || 0), 0);
      const approvedCount = requests.filter(r => r.status === 'approved').length;
      
      return {
        totalBalance,
        usedDays,
        pendingDays,
        approvedCount
      };
    }
    
    // Admin statistics from server
    return statistics;
  };

  const stats = calculateStats();

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? 'Leave Management Dashboard' : 'My Leave Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Manage employee leaves, approve requests, and view analytics'
              : 'Track your leave balance, requests, and history'
            }
          </p>
        </div>
        <div className="flex gap-2">
          {canManageLeaveTypes && (
            <Link href="/leaves/types">
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Manage Types
              </Button>
            </Link>
          )}
          <Link href="/leaves/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Request Leave
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total/Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Total Requests' : 'Leave Balance'}
            </CardTitle>
            {isAdmin ? (
              <FileText className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isAdmin 
                    ? statistics?.totalRequests || 0
                    : `${stats?.totalBalance || 0} days`
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAdmin
                    ? `${statistics?.pendingRequests || 0} pending approval`
                    : `${stats?.usedDays || 0} used this year`
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Approved/Pending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Approved Requests' : 'Pending Requests'}
            </CardTitle>
            {isAdmin ? (
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isAdmin 
                    ? statistics?.approvedRequests || 0
                    : requests.filter(r => r.status === 'pending').length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAdmin
                    ? `${((statistics?.approvedRequests || 0) / Math.max(statistics?.totalRequests || 1, 1) * 100).toFixed(0)}% approval rate`
                    : `${stats?.pendingDays || 0} days pending`
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 3: On Leave/Rejected */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Employees on Leave' : 'Approved Leaves'}
            </CardTitle>
            {isAdmin ? (
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            ) : (
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isAdmin 
                    ? statistics?.employeesOnLeave || 0
                    : stats?.approvedCount || 0
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAdmin
                    ? `Out of ${statistics?.totalEmployees || 0} employees`
                    : 'This year'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Upcoming/Types */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Upcoming Leaves' : 'Leave Types'}
            </CardTitle>
            {isAdmin ? (
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isAdmin 
                    ? statistics?.upcomingLeaves || 0
                    : leaveTypes.length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAdmin
                    ? 'Next 30 days'
                    : 'Available types'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <FileText className="h-4 w-4" />
            Requests
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="analytics" className="gap-2">
              <PieChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          )}
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Status Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Request Status Distribution</CardTitle>
                <CardDescription>
                  {isAdmin ? 'Organization-wide leave request status' : 'Your leave request status'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaveAnalytics 
                  requests={isAdmin ? allRequests : requests}
                  type="status"
                  loading={loading}
                />
              </CardContent>
            </Card>

            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Leave Trend</CardTitle>
                <CardDescription>
                  {isAdmin ? 'Organization leave trends' : 'Your leave history'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaveAnalytics 
                  requests={isAdmin ? allRequests : requests}
                  type="monthly"
                  loading={loading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Leave Requests</CardTitle>
              <CardDescription>
                {isAdmin ? 'Latest requests from all employees' : 'Your recent leave requests'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveRequestList 
                requests={(isAdmin ? allRequests : requests).slice(0, 5)}
                loading={loading}
                isAdmin={isAdmin}
                onUpdate={loadData}
                compact
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Leave Requests</CardTitle>
              <CardDescription>
                {isAdmin 
                  ? 'Manage and approve employee leave requests'
                  : 'View and manage your leave requests'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveRequestList 
                requests={isAdmin ? allRequests : requests}
                loading={loading}
                isAdmin={isAdmin}
                canApprove={canApproveRequests}
                onUpdate={loadData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Calendar</CardTitle>
                <CardDescription>
                  View all employee leaves in calendar format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaveCalendar 
                  requests={allRequests}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Analytics Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Leave Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Leave Type Distribution</CardTitle>
                  <CardDescription>
                    Breakdown by leave type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LeaveAnalytics 
                    requests={allRequests}
                    type="type"
                    loading={loading}
                  />
                </CardContent>
              </Card>

              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Distribution</CardTitle>
                  <CardDescription>
                    Leave requests by department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LeaveAnalytics 
                    requests={allRequests}
                    type="department"
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>
                  Comprehensive leave statistics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaveAnalytics 
                  requests={allRequests}
                  type="detailed"
                  loading={loading}
                  statistics={statistics}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
