"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Calendar,   
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  CalendarDays,
  Settings,
  PieChart,
  BarChart3,
  UserCheck,
  Briefcase,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { getMyLeaveBalance, getMyLeaveRequests, getLeaveTypes } from "@/action/leaves";
import { getLeaveStatistics, getAllLeaveRequests, getOrganizationLeaveTypes } from "@/action/admin-leaves";
import { LeaveBalanceWithType, ILeaveRequest, ILeaveType } from "@/lib/leave/types";
import { useUserStore } from "@/store/user-store";

// Helper to parse number from string or number
function parseNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}
import { useOrgStore } from "@/store/org-store";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { LeaveRequestList } from "@/components/leave/leave-request-list";
import { LeaveCalendar } from "@/components/leave/leave-calendar";
import { LeaveAnalytics } from "@/components/leave/leave-analytics";

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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(5);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const { role, permissions } = useUserStore();
  const { organizationId } = useOrgStore();
  // Role codes: A001 = Admin Org, SA001 = Super Admin
  const isAdmin = role === 'A001' || role === 'SA001';
  const canManageLeaveTypes = permissions?.includes('leaves:type:manage') || isAdmin;
  const canApproveRequests = permissions?.includes('leaves:approval:create') || isAdmin;

  // Load data based on user role
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      logger.debug("🔄 Loading data - isAdmin:", isAdmin, "organizationId:", organizationId);
      
      if (isAdmin && organizationId) {
        // Admin: Load all organization data
        logger.debug("👑 Loading admin data for organization:", organizationId);
        const [statsResult, allRequestsResult, typesResult, balanceResult, myRequestsResult] = await Promise.all([
          getLeaveStatistics(organizationId),
          getAllLeaveRequests(organizationId),
          getOrganizationLeaveTypes(organizationId),
          getMyLeaveBalance(),
          getMyLeaveRequests()
        ]);

        if (statsResult.success && statsResult.data) {
          const statsData = statsResult.data;
          setStatistics({
            ...statsData,
            averageLeaveDays: parseNumber(statsData.averageLeaveDays)
          });
          logger.debug("📊 Statistics loaded:", statsData);
        } else {
          logger.error("❌ Failed to load statistics:", statsResult.message);
        }

        if (allRequestsResult.success && allRequestsResult.data) {
          setAllRequests(allRequestsResult.data);
          logger.debug("📋 All requests loaded:", allRequestsResult.data.length, "items");
        } else {
          logger.error("❌ Failed to load all requests:", allRequestsResult.message);
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

  // Filter, search, and sort logic
  const getFilteredAndSortedRequests = useCallback(() => {
    let filtered = isAdmin ? allRequests : requests;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(req => {
        const searchLower = searchQuery.toLowerCase();
        const employeeName = isAdmin 
          ? `${req.organization_member?.user?.first_name} ${req.organization_member?.user?.last_name}`.toLowerCase()
          : '';
        const leaveType = req.leave_type?.name.toLowerCase() || '';
        const reason = req.reason.toLowerCase();
        const requestNumber = req.request_number.toLowerCase();
        
        return employeeName.includes(searchLower) ||
               leaveType.includes(searchLower) ||
               reason.includes(searchLower) ||
               requestNumber.includes(searchLower);
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.requested_at).getTime();
      const dateB = new Date(b.requested_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  }, [isAdmin, allRequests, requests, searchQuery, statusFilter, sortOrder]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortOrder, allRequests.length, requests.length]);

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
  const calculateStats = (): { totalBalance: number; usedDays: number; pendingDays: number; approvedCount: number } | LeaveStatistics | null => {
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
  
  // Type guard untuk user stats
  const isUserStats = (s: typeof stats): s is { totalBalance: number; usedDays: number; pendingDays: number; approvedCount: number } => {
    return s !== null && !isAdmin && 'totalBalance' in s;
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isAdmin ? 'Leave Management' : 'My Leaves'}
              </h1>
              <p className="text-muted-foreground">
                {isAdmin 
                  ? 'Manage employee leaves, approve requests, and view analytics'
                  : 'Track your leave balance, requests, and history'
                }
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          {canManageLeaveTypes && (
            <Link href="/leaves/types">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Settings className="h-4 w-4" />
                Manage Types
              </Button>
            </Link>
          )}
          <Link href="/leaves/new">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Request Leave
            </Button>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {!loading && (!stats || (isAdmin && !statistics)) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total/Balance */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Total Requests' : 'Leave Balance'}
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              {isAdmin ? (
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isAdmin 
                    ? statistics?.totalRequests || 0
                    : `${isUserStats(stats) ? stats.totalBalance : 0} days`
                  }
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isAdmin ? (
                    <>
                      <Badge variant="secondary" className="text-xs px-1">
                        {statistics?.pendingRequests || 0}
                      </Badge>
                      pending approval
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-xs px-1">
                        {isUserStats(stats) ? stats.usedDays : 0}
                      </Badge>
                      used this year
                    </>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Approved/Pending */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Approved Requests' : 'Pending Requests'}
            </CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              {isAdmin ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isAdmin 
                    ? statistics?.approvedRequests || 0
                    : requests.filter(r => r.status === 'pending').length
                  }
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isAdmin ? (
                    <>
                      <Badge variant="secondary" className="text-xs px-1 bg-green-100 text-green-800">
                        {((statistics?.approvedRequests || 0) / Math.max(statistics?.totalRequests || 1, 1) * 100).toFixed(0)}%
                      </Badge>
                      approval rate
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-xs px-1">
                        {isUserStats(stats) ? stats.pendingDays : 0}
                      </Badge>
                      days pending
                    </>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 3: On Leave/Approved */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Employees on Leave' : 'Approved Leaves'}
            </CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              {isAdmin ? (
                <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isAdmin 
                    ? statistics?.employeesOnLeave || 0
                    : isUserStats(stats) ? stats.approvedCount : 0
                  }
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isAdmin ? (
                    <>
                      Out of{' '}
                      <Badge variant="outline" className="text-xs px-1">
                        {statistics?.totalEmployees || 0}
                      </Badge>
                      employees
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="text-xs px-1">
                        This year
                      </Badge>
                    </>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Upcoming/Types */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Upcoming Leaves' : 'Leave Types'}
            </CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
              {isAdmin ? (
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {isAdmin 
                    ? statistics?.upcomingLeaves || 0
                    : leaveTypes.length
                  }
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isAdmin ? (
                    <>
                      <Badge variant="secondary" className="text-xs px-1">
                        Next 30 days
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-xs px-1">
                        {leaveTypes.filter(t => t.is_active).length}
                      </Badge>
                      active types
                    </>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList className={`grid w-full sm:w-auto ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Requests</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
                <span className="sm:hidden">Cal</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <PieChart className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Tab Actions */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeTab === 'dashboard' ? 'Overview' : 
               activeTab === 'requests' ? `${(isAdmin ? allRequests : requests).length} items` :
               activeTab === 'calendar' ? 'Calendar View' :
               'Analytics'}
            </Badge>
          </div>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Status Distribution Chart */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Request Status Distribution</CardTitle>
                    <CardDescription className="mt-1">
                      {isAdmin ? 'Organization-wide leave request status' : 'Your leave request status'}
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <PieChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
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
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Monthly Leave Trend</CardTitle>
                    <CardDescription className="mt-1">
                      {isAdmin ? 'Organization leave trends' : 'Your leave history'}
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
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
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Leave Requests</CardTitle>
                  <CardDescription className="mt-1">
                    {isAdmin ? 'Latest requests from all employees' : 'Your recent leave requests'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {(isAdmin ? allRequests : requests).slice(0, 5).length} of {(isAdmin ? allRequests : requests).length}
                  </Badge>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <LeaveRequestList 
                  requests={(isAdmin ? allRequests : requests).slice(0, 5)}
                  loading={loading}
                  isAdmin={isAdmin}
                  onUpdate={loadData}
                  compact
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    All Leave Requests
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {isAdmin 
                      ? 'Manage and approve employee leave requests'
                      : 'View and manage your leave requests'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {(isAdmin ? allRequests : requests).length} total
                  </Badge>
                  {isAdmin && canApproveRequests && (
                    <Badge variant="secondary">
                      {(isAdmin ? allRequests : requests).filter(r => r.status === 'pending').length} pending
                    </Badge>
                  )}
                </div>
              </div>
              <Separator className="mt-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="grid gap-4 md:grid-cols-4">
                  {/* Search Bar */}
                  <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, type, reason, or number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Order */}
                  <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
                    <SelectTrigger>
                      <div className="flex items-left gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show:</span>
                    <Select 
                      value={itemsPerPage.toString()} 
                      onValueChange={(value) => {
                        setItemsPerPage(value === 'all' ? 'all' : parseInt(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Results Info */}
                  <div className="text-sm text-muted-foreground">
                    {itemsPerPage !== 'all' ? (
                      <>Page {currentPage} of {Math.ceil(getFilteredAndSortedRequests().length / (itemsPerPage as number))}</>
                    ) : (
                      <>{getFilteredAndSortedRequests().length} results</>
                    )}
                  </div>
                </div>

                {/* Request List */}
                <ScrollArea className="h-[500px] pr-4">
                  <LeaveRequestList 
                    requests={
                      itemsPerPage === 'all'
                        ? getFilteredAndSortedRequests()
                        : getFilteredAndSortedRequests().slice(
                            (currentPage - 1) * (itemsPerPage as number),
                            currentPage * (itemsPerPage as number)
                          )
                    }
                    loading={loading}
                    isAdmin={isAdmin}
                    canApprove={canApproveRequests}
                    onUpdate={loadData}
                  />
                </ScrollArea>

                {/* Pagination Navigation */}
                {itemsPerPage !== 'all' && getFilteredAndSortedRequests().length > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.ceil(getFilteredAndSortedRequests().length / (itemsPerPage as number)) },
                        (_, i) => i + 1
                      ).map((page) => (
                        <Button
                          key={page}
                          size="sm"
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => 
                        Math.min(
                          Math.ceil(getFilteredAndSortedRequests().length / (itemsPerPage as number)),
                          prev + 1
                        )
                      )}
                      disabled={currentPage >= Math.ceil(getFilteredAndSortedRequests().length / (itemsPerPage as number))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="calendar" className="space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Leave Calendar
                    </CardTitle>
                    <CardDescription className="mt-1">
                      View all employee leaves in calendar format
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {allRequests.filter(r => r.status === 'approved').length} approved
                    </Badge>
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                </div>
                <Separator className="mt-4" />
              </CardHeader>
              <CardContent>
                <div className="min-h-[500px]">
                  <LeaveCalendar 
                    requests={allRequests}
                    loading={loading}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Analytics Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Leave Type Distribution */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Leave Type Distribution</CardTitle>
                      <CardDescription className="mt-1">
                        Breakdown by leave type
                      </CardDescription>
                    </div>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                      <PieChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
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
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Department Distribution</CardTitle>
                      <CardDescription className="mt-1">
                        Leave requests by department
                      </CardDescription>
                    </div>
                    <div className="p-2 bg-rose-100 dark:bg-rose-900 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
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
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Detailed Analytics</CardTitle>
                    <CardDescription className="mt-1">
                      Comprehensive leave statistics and trends
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {statistics?.averageLeaveDays.toFixed(1)} avg days
                    </Badge>
                    <div className="p-2 bg-violet-100 dark:bg-violet-900 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                  </div>
                </div>
                <Separator className="mt-4" />
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <LeaveAnalytics 
                    requests={allRequests}
                    type="detailed"
                    loading={loading}
                    statistics={statistics}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
