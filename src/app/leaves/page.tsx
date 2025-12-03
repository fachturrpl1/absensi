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
  Calendar,   
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  CalendarDays,
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
import { getMyLeaveBalance, getMyLeaveRequests, cancelLeaveRequest } from "@/action/leaves";
import { getLeaveStatistics, getAllLeaveRequests, getOrganizationLeaveTypes } from "@/action/admin-leaves";
import { ILeaveRequest, ILeaveType } from "@/lib/leave/types";

// Helper to parse number from string or number
function parseNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}
import { useOrgStore } from "@/store/org-store";
import { useUserStore } from "@/store/user-store";
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
  // const [balances, setBalances] = useState<LeaveBalanceWithType[]>([]);
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
  
  const { organizationId } = useOrgStore();
  const { role, permissions } = useUserStore();

  // Allow all roles to access, but show different data based on role
  // Role codes: A001 = Admin Org, SA001 = Super Admin, others = Regular users
  const isAdmin = role === 'A001' || role === 'SA001';
  const canApproveRequests = permissions?.includes('leaves:request:approve') || isAdmin;

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

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      logger.debug("🔄 Loading data - organizationId:", organizationId);
      
      try {
        const [statsResult, allRequestsResult, typesResult, balanceResult, myRequestsResult] = await Promise.allSettled([
          organizationId ? getLeaveStatistics(organizationId) : Promise.resolve({ success: false }),
          organizationId ? getAllLeaveRequests(organizationId) : Promise.resolve({ success: false }),
          getOrganizationLeaveTypes(organizationId || 0),
          getMyLeaveBalance(),
          getMyLeaveRequests()
        ]);

        // Handle statistics result
        if (statsResult.status === 'fulfilled' && statsResult.value?.success) {
          const statsData = statsResult.value as any;
          setStatistics({
            ...statsData,
            averageLeaveDays: parseNumber(statsData.averageLeaveDays)
          });
          logger.debug("📊 Statistics loaded:", statsData);
        } else {
          const error = statsResult.status === 'rejected' ? statsResult.reason : 'Failed to load statistics';
          logger.warn("⚠️ Statistics not available:", error);
          setStatistics(null);
        }

        // Handle all requests result
        if (allRequestsResult.status === 'fulfilled' && allRequestsResult.value?.success) {
          const data = (allRequestsResult.value as any).data || [];
          setAllRequests(data);
          logger.debug("📋 All requests loaded:", data.length, "items");
        } else {
          const error = allRequestsResult.status === 'rejected' ? allRequestsResult.reason : 'Failed to load requests';
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
          // setBalances(balanceResult.value.data as any);
        } else {
          const error = balanceResult.status === 'rejected' ? balanceResult.reason : balanceResult.value?.message;
          logger.warn("⚠️ Balance not available:", error);
          // setBalances([]);
        }

        // Handle my requests result
        if (myRequestsResult.status === 'fulfilled' && myRequestsResult.value?.success && myRequestsResult.value?.data) {
          setRequests(myRequestsResult.value.data);
        } else {
          const error = myRequestsResult.status === 'rejected' ? myRequestsResult.reason : myRequestsResult.value?.message;
          logger.warn("⚠️ My requests not available:", error);
          setRequests([]);
        }
      } catch (error) {
        logger.error("❌ Error loading data:", error);
        // Set default empty states
        setStatistics(null);
        setAllRequests([]);
        setLeaveTypes([]);
        // setBalances([]);
        setRequests([]);
        toast.error("Some data could not be loaded");
      }
    } catch (error) {
      logger.error("❌ Unexpected error loading data:", error);
      toast.error("Failed to load leave data. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Filter, search, and sort logic
  const getFilteredAndSortedRequests = useCallback(() => {
    let filtered = allRequests.length > 0 ? allRequests : requests;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(req => {
        const searchLower = searchQuery.toLowerCase();
        const memberName = `${req.organization_member?.user?.first_name} ${req.organization_member?.user?.last_name}`.toLowerCase();
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
  }, [allRequests, requests, searchQuery, statusFilter, sortOrder]);

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
  const calculateStats = (): LeaveStatistics | null => {
    return statistics;
  };

  const stats = calculateStats();

  // Helper function to check if stats is user stats
  const isUserStats = (stats: any): stats is LeaveStatistics => {
    return stats && 'totalBalance' in stats;
  };

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
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

      {/* Statistics Cards */}
      <div className="grid gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 w-full">
        {/* Card 1: Total/Balance */}
        <Card className="hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden">
          <CardContent className="p-2 sm:p-2.5 md:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Skeleton className="h-5 sm:h-6 md:h-7 lg:h-8 w-12 sm:w-16 md:w-20" />
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-28 md:w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-0.5 sm:mb-1 leading-tight">
                      {isAdmin 
                        ? statistics?.totalRequests || 0
                        : isUserStats(stats) ? (stats as any).totalBalance : 0
                      }
                    </div>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium text-muted-foreground leading-tight truncate">
                      {isAdmin ? 'Requests' : 'Balance'}
                    </p>
                  </>
                )}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                {isAdmin ? (
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ) : (
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Approved/Pending */}
        <Card className="hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden">
          <CardContent className="p-2 sm:p-2.5 md:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Skeleton className="h-5 sm:h-6 md:h-7 lg:h-8 w-12 sm:w-16 md:w-20" />
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-28 md:w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-0.5 sm:mb-1 leading-tight">
                      {isAdmin 
                        ? statistics?.approvedRequests || 0
                        : requests.filter(r => r.status === 'pending').length
                      }
                    </div>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium text-muted-foreground leading-tight truncate">
                      {isAdmin ? 'Approved Requests' : 'Pending Requests'}
                    </p>
                  </>
                )}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                {isAdmin ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ) : (
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: On Leave/Approved */}
        <Card className="hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden">
          <CardContent className="p-2 sm:p-2.5 md:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Skeleton className="h-5 sm:h-6 md:h-7 lg:h-8 w-12 sm:w-16 md:w-20" />
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-28 md:w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-0.5 sm:mb-1 leading-tight">
                      {isAdmin 
                        ? statistics?.membersOnLeave || 0
                        : isUserStats(stats) ? (stats as any).approvedCount : 0
                      }
                    </div>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium text-muted-foreground leading-tight truncate">
                      {isAdmin ? 'Members on Leave' : 'Approved Leaves'}
                    </p>
                  </>
                )}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                {isAdmin ? (
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ) : (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Upcoming/Types */}
        <Card className="hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden">
          <CardContent className="p-2 sm:p-2.5 md:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Skeleton className="h-5 sm:h-6 md:h-7 lg:h-8 w-12 sm:w-16 md:w-20" />
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-28 md:w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-0.5 sm:mb-1 leading-tight">
                      {isAdmin 
                        ? statistics?.upcomingLeaves || 0
                        : leaveTypes.length
                      }
                    </div>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium text-muted-foreground leading-tight truncate">
                      {isAdmin ? 'Upcoming Leaves' : 'Leave Types'}
                    </p>
                  </>
                )}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                {isAdmin ? (
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ) : (
                  <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
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
        <TabsContent value="dashboard" className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 w-full">
            {/* Status Distribution Chart */}
            <Card className="hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden">
              <CardHeader className="pb-3 sm:pb-4 md:pb-5 px-3 sm:px-4 md:px-5 lg:px-6 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base md:text-lg truncate">Request Status Distribution</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 h-7 sm:h-8 md:h-9 w-full sm:w-auto text-[10px] sm:text-xs md:text-sm">
                          {getChartIcon(statusChartType)}
                          <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
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
              <CardContent className="px-3 sm:px-4 md:px-5 lg:px-6 pb-4 sm:pb-5 md:pb-6 lg:pb-8 w-full min-w-0 h-80 sm:h-96 md:h-[420px]">
                <LeaveAnalytics 
                  requests={isAdmin ? allRequests : requests}
                  type="status"
                  loading={loading}
                  chartType={statusChartType}
                />
              </CardContent>
            </Card>

            {/* Monthly Trend Chart */}
            <Card className="hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden">
              <CardHeader className="pb-3 sm:pb-4 md:pb-5 px-3 sm:px-4 md:px-5 lg:px-6 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base md:text-lg truncate">Leave Trend</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={monthlyTrendFilter} onValueChange={(value: typeof monthlyTrendFilter) => setMonthlyTrendFilter(value)}>
                      <SelectTrigger className="w-full sm:w-[140px] md:w-[160px] h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm">
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
                    <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg shrink-0">
                      <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 md:px-5 lg:px-6 pb-4 sm:pb-5 md:pb-6 lg:pb-8 w-full min-w-0 h-80 sm:h-96 md:h-[420px]">
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
          <Card className="hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-2 sm:px-3 md:px-4 lg:px-6 pt-2 sm:pt-3 md:pt-4 lg:pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm sm:text-base md:text-lg truncate">Recent Leave Requests</CardTitle>
                  <CardDescription className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm">
                    {isAdmin ? 'Latest requests from all members' : 'Your recent leave requests'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                    {Math.min(3, (isAdmin ? allRequests : requests).length)} of {(isAdmin ? allRequests : requests).length}
                  </Badge>
                  
                  {/* View Mode Toggle for Recent */}
                  <div className="flex items-center rounded-lg border shrink-0">
                    <Button
                      variant={recentViewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setRecentViewMode('list')}
                      className="rounded-r-none h-7 sm:h-8 w-8 sm:w-auto px-2 sm:px-3"
                    >
                      <List className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant={recentViewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setRecentViewMode('grid')}
                      className="rounded-l-none border-l h-7 sm:h-8 w-8 sm:w-auto px-2 sm:px-3"
                    >
                      <Grid3x3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("requests")}
                    className="h-7 sm:h-8 text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 shrink-0"
                  >
                    See All
                  </Button>
                  <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900 rounded-lg shrink-0">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-3 md:px-4 lg:px-6 pb-2 sm:pb-3 md:pb-4 lg:pb-6">
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
        <TabsContent value="requests" className="space-y-3 sm:space-y-4 md:space-y-6">
          <Card className="hover:shadow-md transition-shadow w-full min-w-0 overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-2 sm:px-3 md:px-4 lg:px-6 pt-2 sm:pt-3 md:pt-4 lg:pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="truncate">All Leave Requests</span>
                  </CardTitle>
                  <CardDescription className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm">
                    {isAdmin 
                      ? 'Manage and approve member leave requests'
                      : 'View and manage your leave requests'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                  <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                    {(isAdmin ? allRequests : requests).length} total
                  </Badge>
                  {isAdmin && canApproveRequests && (
                    <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                      {(isAdmin ? allRequests : requests).filter(r => r.status === 'pending').length} pending
                    </Badge>
                  )}
                </div>
              </div>
              <Separator className="mt-2 sm:mt-3 md:mt-4" />
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
            {/* Leave Types Usage Trend & Leave Type Distribution */}
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              {/* Leave Types Usage Trend */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Leave Types Usage Trend</CardTitle>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("calendar")}
                        className="h-9 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        title="Go to Calendar"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
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

              {/* Leave Type Distribution */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">Leave Type Distribution</CardTitle>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
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
            </div>

            {/* Detailed Analytics & Department Distribution */}
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
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

              {/* Department Distribution */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Department Distribution</CardTitle>
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
            </div>

            {/* Enhanced Analytics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Approval Rate */}
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
                            {statistics?.totalRequests && statistics.totalRequests > 0 
                              ? ((statistics.approvedRequests / statistics.totalRequests) * 100).toFixed(1)
                              : 0}%
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Approval Rate
                          </p>
                        </>
                      )}
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center text-green-600 dark:text-green-400">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Avg Processing Time */}
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
                          <div className="text-3xl font-bold text-foreground mb-1">0.0</div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Avg Processing Time
                          </p>
                        </>
                      )}
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* This Month */}
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
                          <p className="text-sm font-medium text-muted-foreground">
                            This Month
                          </p>
                        </>
                      )}
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Most Used Type */}
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
                          {(() => {
                            const typeData: Record<string, { count: number; color: string; name: string }> = {};
                            allRequests.forEach(r => {
                              if (r.leave_type) {
                                const key = r.leave_type.code;
                                if (!typeData[key]) {
                                  typeData[key] = {
                                    count: 0,
                                    color: r.leave_type.color_code || '#10B981',
                                    name: r.leave_type.name
                                  };
                                }
                                typeData[key].count++;
                              }
                            });
                            const mostUsed = Object.entries(typeData).sort(([,a], [,b]) => b.count - a.count)[0];
                            
                            if (mostUsed) {
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full shrink-0"
                                      style={{ backgroundColor: mostUsed[1].color }}
                                    />
                                    <span className="text-lg font-bold text-foreground truncate">
                                      {mostUsed[1].name}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Most Used Type
                                  </p>
                                </div>
                              );
                            } else {
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                                    <span className="text-lg font-bold text-foreground">
                                      No Data
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Most Used Type
                                  </p>
                                </div>
                              );
                            }
                          })()}
                        </>
                      )}
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Briefcase className="w-6 h-6" />
                    </div>
                  </div>
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
