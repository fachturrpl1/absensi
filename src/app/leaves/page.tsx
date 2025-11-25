"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  ChevronDown,
  List,
  Grid3x3
} from "lucide-react";
import { getMyLeaveBalance, getMyLeaveRequests, getLeaveTypes, cancelLeaveRequest } from "@/action/leaves";
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
  totalMembers: number;
  membersOnLeave: number;
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
  
  // View mode states
  const [recentViewMode, setRecentViewMode] = useState<'list' | 'grid'>('list');
  const [allRequestsViewMode, setAllRequestsViewMode] = useState<'list' | 'grid'>('list');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(6);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Cancel dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRequestToCancel, setSelectedRequestToCancel] = useState<ILeaveRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Monthly Leave Trend filter state
  const [monthlyTrendFilter, setMonthlyTrendFilter] = useState<'7days' | '1week' | 'thisweek' | '30days' | '1month' | 'thismonth' | 'lastyear' | 'thisyear'>('thisyear');
  
  // Leave Type Distribution filter state
  const [typeDistributionFilter, setTypeDistributionFilter] = useState<'7days' | '1week' | 'thisweek' | '30days' | '1month' | 'thismonth' | 'lastyear' | 'thisyear'>('thisyear');
  
  // Chart type states
  const [statusChartType, setStatusChartType] = useState<'donut' | 'pie' | 'bar'>('donut');
  const [typeChartType, setTypeChartType] = useState<'donut' | 'pie' | 'bar'>('donut');
  const [detailedChartType, setDetailedChartType] = useState<'donut' | 'pie' | 'bar'>('donut');
  
  const { role, permissions } = useUserStore();
  const { organizationId } = useOrgStore();
  // Role codes: A001 = Admin Org, SA001 = Super Admin
  const isAdmin = role === 'A001' || role === 'SA001';
  const canManageLeaveTypes = permissions?.includes('leaves:type:manage') || isAdmin;
  const canApproveRequests = permissions?.includes('leaves:approval:create') || isAdmin;

  // Helper function to get chart icon
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

  // Load data based on user role
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      logger.debug("🔄 Loading data - isAdmin:", isAdmin, "organizationId:", organizationId);
      
      if (isAdmin && organizationId) {
        // Admin: Load all organization data
        logger.debug("👑 Loading admin data for organization:", organizationId);
        
        try {
          const [statsResult, allRequestsResult, typesResult, balanceResult, myRequestsResult] = await Promise.allSettled([
            getLeaveStatistics(organizationId),
            getAllLeaveRequests(organizationId),
            getOrganizationLeaveTypes(organizationId),
            getMyLeaveBalance(),
            getMyLeaveRequests()
          ]);

          // Handle statistics result
          if (statsResult.status === 'fulfilled' && statsResult.value?.success && statsResult.value?.data) {
            const statsData = statsResult.value.data;
            setStatistics({
              ...statsData,
              averageLeaveDays: parseNumber(statsData.averageLeaveDays)
            });
            logger.debug("📊 Statistics loaded:", statsData);
          } else {
            const error = statsResult.status === 'rejected' ? statsResult.reason : statsResult.value?.message;
            logger.warn("⚠️ Statistics not available:", error);
            setStatistics(null);
          }

          // Handle all requests result
          if (allRequestsResult.status === 'fulfilled' && allRequestsResult.value?.success && allRequestsResult.value?.data) {
            setAllRequests(allRequestsResult.value.data);
            logger.debug("📋 All requests loaded:", allRequestsResult.value.data.length, "items");
          } else {
            const error = allRequestsResult.status === 'rejected' ? allRequestsResult.reason : allRequestsResult.value?.message;
            logger.warn("⚠️ All requests not available:", error);
            setAllRequests([]);
          }

          // Handle leave types result
          if (typesResult.status === 'fulfilled' && typesResult.value?.success && typesResult.value?.data) {
            setLeaveTypes(typesResult.value.data);
          } else {
            const error = typesResult.status === 'rejected' ? typesResult.reason : typesResult.value?.message;
            logger.warn("⚠️ Leave types not available:", error);
            setLeaveTypes([]);
          }

          // Handle balance result
          if (balanceResult.status === 'fulfilled' && balanceResult.value?.success && balanceResult.value?.data) {
            setBalances(balanceResult.value.data as any);
          } else {
            const error = balanceResult.status === 'rejected' ? balanceResult.reason : balanceResult.value?.message;
            logger.warn("⚠️ Balance not available:", error);
            setBalances([]);
          }

          // Handle my requests result
          if (myRequestsResult.status === 'fulfilled' && myRequestsResult.value?.success && myRequestsResult.value?.data) {
            setRequests(myRequestsResult.value.data);
          } else {
            const error = myRequestsResult.status === 'rejected' ? myRequestsResult.reason : myRequestsResult.value?.message;
            logger.warn("⚠️ My requests not available:", error);
            setRequests([]);
          }
        } catch (adminError) {
          logger.error("❌ Error loading admin data:", adminError);
          // Set default empty states
          setStatistics(null);
          setAllRequests([]);
          setLeaveTypes([]);
          setBalances([]);
          setRequests([]);
          toast.error("Some admin data could not be loaded");
        }
      } else {
        // User: Load personal data only
        try {
          const [balanceResult, requestsResult, typesResult] = await Promise.allSettled([
            getMyLeaveBalance(),
            getMyLeaveRequests(),
            getLeaveTypes()
          ]);

          // Handle balance result
          if (balanceResult.status === 'fulfilled' && balanceResult.value?.success && balanceResult.value?.data) {
            setBalances(balanceResult.value.data as any);
          } else {
            const error = balanceResult.status === 'rejected' ? balanceResult.reason : balanceResult.value?.message;
            logger.warn("⚠️ Balance not available:", error);
            setBalances([]);
          }

          // Handle requests result
          if (requestsResult.status === 'fulfilled' && requestsResult.value?.success && requestsResult.value?.data) {
            setRequests(requestsResult.value.data);
          } else {
            const error = requestsResult.status === 'rejected' ? requestsResult.reason : requestsResult.value?.message;
            logger.warn("⚠️ Requests not available:", error);
            setRequests([]);
          }

          // Handle leave types result
          if (typesResult.status === 'fulfilled' && typesResult.value?.success && typesResult.value?.data) {
            setLeaveTypes(typesResult.value.data);
          } else {
            const error = typesResult.status === 'rejected' ? typesResult.reason : typesResult.value?.message;
            logger.warn("⚠️ Leave types not available:", error);
            setLeaveTypes([]);
          }
        } catch (userError) {
          logger.error("❌ Error loading user data:", userError);
          // Set default empty states
          setBalances([]);
          setRequests([]);
          setLeaveTypes([]);
          toast.error("Some personal data could not be loaded");
        }
      }
    } catch (error) {
      logger.error("❌ Unexpected error loading data:", error);
      toast.error("Failed to load leave data. Please try refreshing the page.");
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
        const memberName = isAdmin 
          ? `${req.organization_member?.user?.first_name} ${req.organization_member?.user?.last_name}`.toLowerCase()
          : '';
        const leaveType = req.leave_type?.name.toLowerCase() || '';
        const reason = req.reason.toLowerCase();
        const requestNumber = req.request_number.toLowerCase();
        
        return memberName.includes(searchLower) ||
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

  // Handle cancel leave request
  const handleCancelRequest = useCallback((request: ILeaveRequest) => {
    setSelectedRequestToCancel(request);
    setCancelReason("");
    setCancelDialogOpen(true);
  }, []);

  // Confirm cancel leave request
  const handleConfirmCancel = useCallback(async () => {
    if (!selectedRequestToCancel || !cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setCancelLoading(true);
    try {
      const result = await cancelLeaveRequest({
        request_id: selectedRequestToCancel.id,
        reason: cancelReason.trim()
      });

      if (result.success) {
        toast.success("Leave request cancelled successfully");
        setCancelDialogOpen(false);
        setSelectedRequestToCancel(null);
        setCancelReason("");
        // Reload data to reflect changes
        await loadData();
      } else {
        toast.error(result.message || "Failed to cancel leave request");
      }
    } catch (error) {
      console.error("Error cancelling leave request:", error);
      toast.error("An error occurred while cancelling the request");
    } finally {
      setCancelLoading(false);
    }
  }, [selectedRequestToCancel, cancelReason, loadData]);

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
                {'Leaves Dashboard'}
              </h1>

            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="gap-2 w-full sm:w-auto"
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
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {isAdmin 
                        ? statistics?.totalRequests || 0
                        : isUserStats(stats) ? stats.totalBalance : 0
                      }
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isAdmin ? 'Total Requests' : 'Leave Balance'}
                    </p>
                  </>
                )}
              </div>
              <div className="w-12 h-12 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {isAdmin ? (
                  <FileText className="w-6 h-6" />
                ) : (
                  <Briefcase className="w-6 h-6" />


 
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Approved/Pending */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {isAdmin 
                        ? statistics?.approvedRequests || 0
                        : requests.filter(r => r.status === 'pending').length
                      }
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isAdmin ? 'Approved Requests' : 'Pending Requests'}
                    </p>
                  </>
                )}
              </div>
              <div className="w-12 h-12 flex items-center justify-center text-green-600 dark:text-green-400">
                {isAdmin ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: On Leave/Approved */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {isAdmin 
                        ? statistics?.membersOnLeave || 0
                        : isUserStats(stats) ? stats.approvedCount : 0
                      }
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isAdmin ? 'Members on Leave' : 'Approved Leaves'}
                    </p>
                  </>
                )}
              </div>
              <div className="w-12 h-12 flex items-center justify-center text-purple-600 dark:text-purple-400">
                {isAdmin ? (
                  <UserCheck className="w-6 h-6" />
                ) : (
                  <CheckCircle className="w-6 h-6" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Upcoming/Types */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {isAdmin 
                        ? statistics?.upcomingLeaves || 0
                        : leaveTypes.length
                      }
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isAdmin ? 'Upcoming Leaves' : 'Leave Types'}
                    </p>
                  </>
                )}
              </div>
              <div className="w-12 h-12 flex items-center justify-center text-amber-600 dark:text-amber-400">
                {isAdmin ? (
                  <TrendingUp className="w-6 h-6" />
                ) : (
                  <CalendarDays className="w-6 h-6" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList className={`grid w-full sm:w-auto ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'} bg-muted p-1 h-10 overflow-x-auto`}>
            <TabsTrigger 
              value="dashboard" 
              className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Requests</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="calendar" 
                className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
                <span className="sm:hidden">Cal</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger 
                value="analytics" 
                className="gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
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
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          {getChartIcon(statusChartType)}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setStatusChartType('donut')}>
                          <PieChart className="h-4 w-4 mr-2" />
                          Donut Chart
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusChartType('pie')}>
                          <PieChart className="h-4 w-4 mr-2" />
                          Pie Chart
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusChartType('bar')}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Bar Chart
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <LeaveAnalytics 
                  requests={isAdmin ? allRequests : requests}
                  type="status"
                  loading={loading}
                  chartType={statusChartType}
                />
              </CardContent>
            </Card>

            {/* Monthly Trend Chart */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">Leave Trend</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={monthlyTrendFilter} onValueChange={(value: typeof monthlyTrendFilter) => setMonthlyTrendFilter(value)}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="1week">Last Week</SelectItem>
                        <SelectItem value="thisweek">This Week</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="1month">Last Month</SelectItem>
                        <SelectItem value="thismonth">This Month</SelectItem>
                        <SelectItem value="lastyear">Last Year</SelectItem>
                        <SelectItem value="thisyear">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <LeaveAnalytics 
                  requests={isAdmin ? allRequests : requests}
                  type="monthly"
                  loading={loading}
                  periodFilter={monthlyTrendFilter}
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
                    {isAdmin ? 'Latest requests from all members' : 'Your recent leave requests'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {Math.min(3, (isAdmin ? allRequests : requests).length)} of {(isAdmin ? allRequests : requests).length}
                  </Badge>
                  
                  {/* View Mode Toggle for Recent */}
                  <div className="flex items-center rounded-lg border">
                    <Button
                      variant={recentViewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setRecentViewMode('list')}
                      className="rounded-r-none h-8"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={recentViewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setRecentViewMode('grid')}
                      className="rounded-l-none border-l h-8"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("requests")}
                  >
                    See All
                  </Button>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <LeaveRequestList 
                  requests={(isAdmin ? allRequests : requests).slice(0, 3)}
                  loading={loading}
                  isAdmin={isAdmin}
                  onUpdate={loadData}
                  onDelete={handleCancelRequest}
                  compact={false}
                  hideExpandButton
                  onViewAll={() => setActiveTab("requests")}
                  viewMode={recentViewMode}
                  onViewModeChange={setRecentViewMode}
                  showViewToggle={false}
                />
              </div>
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
                      ? 'Manage and approve member leave requests'
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
                {/* Search, Filters, and Pagination - Single Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Bar */}
                  <div className="flex-1 min-w-[200px] relative">
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
                    <SelectTrigger className="w-[140px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="All Status" />
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
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Show Items */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
                    <Select 
                      value={itemsPerPage.toString()} 
                      onValueChange={(value) => {
                        setItemsPerPage(value === 'all' ? 'all' : parseInt(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="9">9</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-lg border">
                    <Button
                      variant={allRequestsViewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setAllRequestsViewMode('list')}
                      className="rounded-r-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={allRequestsViewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setAllRequestsViewMode('grid')}
                      className="rounded-l-none border-l"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Request List */}
                <div>
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
                    onDelete={handleCancelRequest}
                    viewMode={allRequestsViewMode}
                    onViewModeChange={setAllRequestsViewMode}
                    showViewToggle={false}
                  />
                </div>

                {/* Footer: Page Info (Left) and Pagination (Right) */}
                {getFilteredAndSortedRequests().length > 0 && (
                  <div className="flex items-center justify-between">
                    {/* Page Info - Left */}
                    <div className="text-sm text-muted-foreground">
                      {itemsPerPage !== 'all' ? (
                        <>Page {currentPage} of {Math.ceil(getFilteredAndSortedRequests().length / (itemsPerPage as number))}</>
                      ) : (
                        <>{getFilteredAndSortedRequests().length} results</>
                      )}
                    </div>

                    {/* Pagination Navigation - Right */}
                    {itemsPerPage !== 'all' && (
                      <div className="flex items-center gap-2">
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
                      View all member leaves in calendar format
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
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              {/* Leave Type Distribution */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">Leave Type Distribution</CardTitle>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                      <Select value={typeDistributionFilter} onValueChange={(value: typeof typeDistributionFilter) => setTypeDistributionFilter(value)}>
                        <SelectTrigger className="w-[160px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7days">Last 7 Days</SelectItem>
                          <SelectItem value="1week">Last Week</SelectItem>
                          <SelectItem value="thisweek">This Week</SelectItem>
                          <SelectItem value="30days">Last 30 Days</SelectItem>
                          <SelectItem value="1month">Last Month</SelectItem>
                          <SelectItem value="thismonth">This Month</SelectItem>
                          <SelectItem value="lastyear">Last Year</SelectItem>
                          <SelectItem value="thisyear">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            {getChartIcon(typeChartType)}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setTypeChartType('donut')}>
                            <PieChart className="h-4 w-4 mr-2" />
                            Donut Chart
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTypeChartType('pie')}>
                            <PieChart className="h-4 w-4 mr-2" />
                            Pie Chart
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTypeChartType('bar')}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Bar Chart
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <LeaveAnalytics 
                    requests={allRequests}
                    type="type"
                    loading={loading}
                    chartType={typeChartType}
                    periodFilter={typeDistributionFilter}
                  />
                </CardContent>
              </Card>

              {/* Detailed Analytics */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">Detailed Analytics</CardTitle>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                      <Badge variant="secondary" className="text-xs px-2 py-1 whitespace-nowrap">
                        {statistics?.averageLeaveDays.toFixed(1)} avg days/req
                      </Badge>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              {getChartIcon(detailedChartType)}
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailedChartType('donut')}>
                              <PieChart className="h-4 w-4 mr-2" />
                              Donut Chart
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDetailedChartType('pie')}>
                              <PieChart className="h-4 w-4 mr-2" />
                              Pie Chart
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDetailedChartType('bar')}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Bar Chart
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <LeaveAnalytics 
                    requests={allRequests}
                    type="detailed"
                    loading={loading}
                    statistics={statistics}
                    chartType={detailedChartType}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Analytics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Approval Rate */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {statistics?.totalRequests && statistics.totalRequests > 0 
                          ? ((statistics.approvedRequests / statistics.totalRequests) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs px-1">
                          {statistics?.approvedRequests || 0}
                        </Badge>
                        {' '}of {statistics?.totalRequests || 0} requests
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Avg Processing Time */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">0.0 days</div>
                      <p className="text-xs text-muted-foreground">Excellent</p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Most Used Type */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Most Used Type</CardTitle>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {(() => {
                          const typeCounts: Record<string, number> = {};
                          allRequests.forEach(r => {
                            if (r.leave_type) {
                              typeCounts[r.leave_type.name] = (typeCounts[r.leave_type.name] || 0) + 1;
                            }
                          });
                          const mostUsed = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0];
                          return mostUsed ? mostUsed[1] : 0;
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          const typeCounts: Record<string, number> = {};
                          allRequests.forEach(r => {
                            if (r.leave_type) {
                              typeCounts[r.leave_type.name] = (typeCounts[r.leave_type.name] || 0) + 1;
                            }
                          });
                          const mostUsed = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0];
                          return mostUsed ? `${mostUsed[0]} used` : 'No data';
                        })()}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* This Month */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {(() => {
                          const now = new Date();
                          const thisMonth = allRequests.filter(r => {
                            const requestDate = new Date(r.requested_at);
                            return requestDate.getMonth() === now.getMonth() && 
                                   requestDate.getFullYear() === now.getFullYear();
                          });
                          return thisMonth.length;
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          const now = new Date();
                          const thisMonth = allRequests.filter(r => {
                            const requestDate = new Date(r.requested_at);
                            return requestDate.getMonth() === now.getMonth() && 
                                   requestDate.getFullYear() === now.getFullYear() &&
                                   r.status === 'approved';
                          });
                          return `${thisMonth.length} approved`;
                        })()}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Quick Insights</CardTitle>
                    <CardDescription className="mt-1">
                      Key insights and recommendations
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">3 insights</Badge>
                </div>
                <Separator/>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Insight 1 */}
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
                      <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">1 Pending Request</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        All pending requests are recent. Monitor pending requests.
                      </p>
                    </div>
                  </div>

                  {/* Insight 2 */}
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="p-1 bg-green-100 dark:bg-green-900 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">New Requests</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        1 new request in the last 24 hours. Review and process quickly.
                      </p>
                    </div>
                  </div>

                  {/* Insight 3 */}
                  <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="p-1 bg-purple-100 dark:bg-purple-900 rounded">
                      <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">Department Distribution</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        HRD department has 100.0% of all leave requests.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Types Usage Trend */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Leave Types Usage Trend</CardTitle>
                    <CardDescription className="mt-1">
                      Usage trend by leave type over time
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={typeDistributionFilter} onValueChange={(value: typeof typeDistributionFilter) => setTypeDistributionFilter(value)}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="1week">Last Week</SelectItem>
                        <SelectItem value="thisweek">This Week</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="1month">Last Month</SelectItem>
                        <SelectItem value="thismonth">This Month</SelectItem>
                        <SelectItem value="lastyear">Last Year</SelectItem>
                        <SelectItem value="thisyear">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                </div>
                <Separator className="mt-4" />
              </CardHeader>
              <CardContent>
                <LeaveAnalytics 
                  requests={allRequests}
                  type="type-trend"
                  loading={loading}
                  periodFilter={typeDistributionFilter}
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
                <Separator className="mt-4" />
              </CardHeader>
              <CardContent>
                <LeaveAnalytics 
                  requests={allRequests}
                  type="department"
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Cancel Leave Request Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedRequestToCancel && (
            <div className="space-y-4">
              {/* Request Details */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Request #{selectedRequestToCancel.request_number}</span>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    {selectedRequestToCancel.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Type: {selectedRequestToCancel.leave_type?.name}</div>
                  <div>Duration: {selectedRequestToCancel.total_days} day(s)</div>
                  <div>
                    Period: {new Date(selectedRequestToCancel.start_date).toLocaleDateString()} - {new Date(selectedRequestToCancel.end_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Cancellation Reason */}
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">
                  Reason for cancellation <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Please provide a reason for cancelling this leave request..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setSelectedRequestToCancel(null);
                setCancelReason("");
              }}
              disabled={cancelLoading}
            >
              Keep Request
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelLoading || !cancelReason.trim()}
            >
              {cancelLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
