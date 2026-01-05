'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';
import {
  Search,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Edit,
  Trash2,
  Grid3x3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { formatLocalTime } from '@/utils/timezone';
import { getAllAttendance, deleteAttendanceRecord, deleteMultipleAttendanceRecords } from '@/action/attendance';
import { toast } from 'sonner';
import { useOrgStore } from '@/store/org-store';
import { createClient } from '@/utils/supabase/client';

type AttendanceChangeRow = { attendance_date?: string | null; organization_member_id?: number | null; organization_id?: number | null };
type PgChange<T> = { new: T | null; old: T | null };

interface ModernAttendanceListProps {
  initialData?: any[];
  initialStats?: any;
}

export default function ModernAttendanceList({ initialData: _initialData, initialStats: _initialStats }: ModernAttendanceListProps) {
  const orgStore = useOrgStore();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [userTimezone, setUserTimezone] = useState('UTC');
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  
  // Date filter state (same as Dashboard)
  const [dateRange, setDateRange] = useState<DateFilterState>({
    from: new Date(),
    to: new Date(),
    preset: 'today',
  });
  
  // Initialize date range after hydration
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    setDateRange({
      from: today,
      to: endOfToday,
      preset: 'today',
    });
    
    // Set selected org from store
    if (orgStore.organizationId) {
      setSelectedOrgId(orgStore.organizationId);
    }
  }, [orgStore.organizationId]);
  
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecords, setEditingRecords] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const realtimeDebounceRef = useRef<number | null>(null);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const cacheKeyBase = React.useMemo(() => {
    const orgId = selectedOrgId || orgStore.organizationId || 'no-org';
    const fromStr = dateRange.from.toISOString().split('T')[0];
    const toStr = dateRange.to.toISOString().split('T')[0];
    const status = statusFilter || 'all';
    const dept = departmentFilter || 'all';
    const q = searchQuery || '';
    return `attendance:list:${orgId}:p=${currentPage}:l=${itemsPerPage}:from=${fromStr}:to=${toStr}:status=${status}:dept=${dept}:q=${q}`;
  }, [selectedOrgId, orgStore.organizationId, currentPage, itemsPerPage, dateRange.from, dateRange.to, statusFilter, departmentFilter, searchQuery]);

  // Hydrate loading state from localStorage for current key (ignore stale >15s)
  useEffect(() => {
    if (!isMounted) return;
    try {
      const raw = localStorage.getItem(`${cacheKeyBase}:loading`);
      if (raw) {
        const parsed = JSON.parse(raw) as { loading?: boolean; ts?: number };
        const tooOld = parsed.ts ? (Date.now() - parsed.ts > 15_000) : true;
        if (typeof parsed.loading === 'boolean' && !tooOld) setLoading(parsed.loading);
      }
    } catch {}
  }, [cacheKeyBase, isMounted]);

  // Persist loading state on change
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(`${cacheKeyBase}:loading`, JSON.stringify({ loading, ts: Date.now() }));
    } catch {}
  }, [loading, cacheKeyBase, isMounted]);

  // Hydrate data from cache for perceived-fast load
  useEffect(() => {
    if (!isMounted) return;
    try {
      const raw = localStorage.getItem(cacheKeyBase);
      if (raw) {
        const parsed = JSON.parse(raw) as { data?: any[]; total?: number; tz?: string; ts?: number };
        const TTL = 60_000; // 60s cache TTL
        if (!parsed.ts || Date.now() - parsed.ts < TTL) {
          if (Array.isArray(parsed.data)) {
            setAttendanceData(parsed.data);
            setTotalItems(parsed.total || 0);
            if (parsed.tz) setUserTimezone(parsed.tz);
            // If we successfully hydrated data, ensure loading UI doesn't block
            setLoading(false);
          }
        }
      }
    } catch {}
  }, [cacheKeyBase, isMounted]);

  // Edit form schema
  const editFormSchema = z.object({
    status: z.string().min(1, 'Status is required'),
    remarks: z.string().optional(),
  });

  type EditFormValues = z.infer<typeof editFormSchema>;

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      status: 'present',
      remarks: '',
    },
  });
  
  const handleDeleteClick = async (recordId: string) => {
    setRecordToDelete(recordId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    
    try {
      setIsSubmitting(true);
      const result = await deleteAttendanceRecord(recordToDelete);
      
      if (result.success) {
        toast.success('Attendance record deleted successfully');
        setDeleteDialogOpen(false);
        setRecordToDelete(null);
        // Refresh data
        const orgId = selectedOrgId || orgStore.organizationId;
        if (orgId) {
          const response = await getAllAttendance({ organizationId: orgId });
          if (response.success) {
            setAttendanceData(response.data);
            setTotalItems(response.meta?.total || 0);
          }
        }
      } else {
        toast.error(result.message || 'Failed to delete record');
      }
    } catch (error) {
      toast.error('Error deleting record');
      console.error('Delete error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedRecords.length === 0) return;
    
    try {
      setIsSubmitting(true);
      const result = await deleteMultipleAttendanceRecords(selectedRecords);
      
      if (result.success) {
        toast.success(`${selectedRecords.length} record(s) deleted successfully`);
        setSelectedRecords([]);
        // Refresh data
        const orgId = selectedOrgId || orgStore.organizationId;
        if (orgId) {
          const response = await getAllAttendance({ organizationId: orgId });
          if (response.success) {
            setAttendanceData(response.data);
            setTotalItems(response.meta?.total || 0);
          }
        }
      } else {
        toast.error(result.message || 'Failed to delete records');
      }
    } catch (error) {
      toast.error('Error deleting records');
      console.error('Delete error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = () => {
    const recordsToEdit = attendanceData.filter(r => selectedRecords.includes(r.id));
    setEditingRecords(recordsToEdit);
    editForm.reset({
      status: recordsToEdit[0]?.status || 'present',
      remarks: '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSingle = (rec: any) => {
    setEditingRecords([rec]);
    setSelectedRecords([rec.id]);
    editForm.reset({
      status: rec?.status || 'present',
      remarks: '',
    });
    setEditDialogOpen(true);
  };

  // Handle edit form submit
  const onEditSubmit = async (_values: EditFormValues) => {
    try {
      setIsSubmitting(true);
      // TODO: Implement API call to update attendance records
      // For now, just show success message
      toast.success(`Updated ${selectedRecords.length} record(s)`);
      setEditDialogOpen(false);
      setSelectedRecords([]);
      // Refresh data
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update records');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch data using Server Action with pagination
  const fetchData = useCallback(async () => {
    setLoading(true);
    const reqId = latestRequestRef.current + 1;
    latestRequestRef.current = reqId;
    try {
      const orgId = selectedOrgId || orgStore.organizationId || undefined;
      const [listResult] = await Promise.all([
        getAllAttendance({
          page: currentPage,
          limit: itemsPerPage,
          dateFrom: dateRange.from.toISOString().split('T')[0],
          dateTo: dateRange.to.toISOString().split('T')[0],
          search: searchQuery || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          department: departmentFilter === 'all' ? undefined : departmentFilter,
          organizationId: orgId,
        })
      ]);

      const result = (listResult && typeof listResult === 'object' && 'success' in listResult)
        ? listResult as { success: boolean; data?: any[]; meta?: { total?: number; totalPages?: number }; message?: string }
        : { success: false, data: [], meta: { total: 0, totalPages: 0 }, message: 'Invalid response from server' };

      if (result.success) {
        const data = result.data || [];
        console.log('📊 Attendance data received:', {
          count: data.length,
          total: result.meta?.total,
          firstItem: data[0],
          allData: data
        });
        if (reqId !== latestRequestRef.current) {
          return; // stale response
        }
        setAttendanceData(data);
        setTotalItems(result.meta?.total || 0);
        
        // Set timezone from first record if available (fallback to UTC)
        if (data.length > 0) {
          setUserTimezone(data[0].timezone || 'UTC');
        }

        // Extract unique departments from current page (simple solution for now)
        if (data.length > 0) {
        const uniqueDepts = Array.from(new Set(
            data.map((r: any) => r.member?.department)
        )).filter(dept => dept && dept !== 'No Department').sort();
        
        if (departments.length === 0 && uniqueDepts.length > 0) {
          setDepartments(uniqueDepts);
          }
        }
        try {
          const tz = (data.length > 0 ? (data[0].timezone || 'UTC') : undefined);
          localStorage.setItem(cacheKeyBase, JSON.stringify({ data, total: result.meta?.total || 0, tz, ts: Date.now() }));

          // Background prefetch next page to warm cache
          const totalPages = (
            typeof result.meta?.totalPages === 'number' && !Number.isNaN(result.meta.totalPages)
          ) ? result.meta.totalPages : Math.ceil(((result.meta?.total || 0) / itemsPerPage));
          if (totalPages > currentPage) {
            const nextPage = currentPage + 1;
            const orgIdForKey = selectedOrgId || orgStore.organizationId || 'no-org';
            const fromStr = dateRange.from.toISOString().split('T')[0];
            const toStr = dateRange.to.toISOString().split('T')[0];
            const statusVal = statusFilter || 'all';
            const deptVal = departmentFilter || 'all';
            const qVal = searchQuery || '';
            const nextKey = `attendance:list:${orgIdForKey}:p=${nextPage}:l=${itemsPerPage}:from=${fromStr}:to=${toStr}:status=${statusVal}:dept=${deptVal}:q=${qVal}`;

            // Do not await; fire-and-forget
            (async () => {
              try {
                const res = await getAllAttendance({
                  page: nextPage,
                  limit: itemsPerPage,
                  dateFrom: fromStr,
                  dateTo: toStr,
                  search: qVal || undefined,
                  status: statusVal === 'all' ? undefined : statusVal,
                  department: deptVal === 'all' ? undefined : deptVal,
                  organizationId: selectedOrgId || orgStore.organizationId || undefined,
                });
                if (res?.success) {
                  const d = res.data || [];
                  const tzPref = (d.length > 0 ? (d[0].timezone || 'UTC') : tz);
                  localStorage.setItem(nextKey, JSON.stringify({ data: d, total: res.meta?.total || 0, tz: tzPref, ts: Date.now() }));
                }
              } catch {}
            })();
          }
        } catch {}
      } else {
        console.error('Failed to load attendance:', result?.message ?? result);
        setAttendanceData([]);
        setTotalItems(0);
        toast.error(result.message || 'Failed to load attendance data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      // Don't clear existing data on error, just log it
      // setAttendanceData([]);
      // setTotalItems(0);
      // Only show error if we don't have any data
      if (attendanceData.length === 0) {
      toast.error('An error occurred while fetching data');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, dateRange, searchQuery, statusFilter, departmentFilter, selectedOrgId, orgStore.organizationId]);

  // Trigger fetch when filters change (and initial load)
  useEffect(() => {
    console.log('🔄 Fetch triggered:', { currentPage, dateRange, searchQuery, statusFilter, departmentFilter });
    fetchData();
  }, [fetchData]);

  // Realtime subscription to attendance_records (similar to finger page)
  useEffect(() => {
    const orgId = selectedOrgId || orgStore.organizationId;
    if (!orgId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`attendance-records-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `organization_id=eq.${orgId}`
        },
        (payload: PgChange<AttendanceChangeRow>) => {
          const newRow = payload.new;
          const oldRow = payload.old;
          const payloadOrgId = (newRow as any)?.organization_id ?? (oldRow as any)?.organization_id;
          if (payloadOrgId && orgId && Number(payloadOrgId) !== Number(orgId)) {
            return;
          }
          const dateStr = (newRow?.attendance_date as string | undefined) || (oldRow?.attendance_date as string | undefined);
          if (dateStr) {
            const ts = new Date(dateStr).getTime();
            const from = new Date(dateRange.from).getTime();
            const to = new Date(dateRange.to).getTime();
            if (ts < from || ts > to) {
              return; // outside current filter window, skip
            }
          }
          if (realtimeDebounceRef.current) {
            window.clearTimeout(realtimeDebounceRef.current);
          }
          realtimeDebounceRef.current = window.setTimeout(() => {
            fetchData();
          }, 700);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeActive(true);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setRealtimeActive(false);
      });

    return () => {
      setRealtimeActive(false);
      if (realtimeDebounceRef.current) {
        window.clearTimeout(realtimeDebounceRef.current);
        realtimeDebounceRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [selectedOrgId, orgStore.organizationId, dateRange.from, dateRange.to, fetchData]);

  // Fallback polling if realtime not active
  useEffect(() => {
    if (realtimeActive) return;
    const id = window.setInterval(() => {
      fetchData();
    }, 30000); // 30s fallback
    return () => window.clearInterval(id);
  }, [realtimeActive, fetchData]);
  
  // Log attendanceData changes
  useEffect(() => {
    console.log('📊 Attendance data state updated:', {
      length: attendanceData.length,
      totalItems,
      loading,
      firstItem: attendanceData[0]
    });
  }, [attendanceData, totalItems, loading]);

  // Reset to page 1 when filters change (except pagination itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, searchQuery, statusFilter, departmentFilter]);

  // Auto-refresh Timer - Disabled for now to prevent errors
  // useEffect(() => {
  //   // Only run timer if not loading and not paused
  //   if (loading || isAutoRefreshPaused) return;

  //   const timer = setInterval(() => {
  //     fetchData();
  //   }, 10000); // 10 seconds

  //   return () => clearInterval(timer);
  // }, [loading, isAutoRefreshPaused, fetchData]);

  // Helper component to display device location
  const LocationDisplay = ({ checkInLocationName, checkOutLocationName }: any) => {
    if (!checkInLocationName && !checkOutLocationName) {
      return <span className="text-muted-foreground text-xs">No Location</span>;
    }

    if (checkInLocationName && checkOutLocationName && checkInLocationName === checkOutLocationName) {
      return (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-foreground">{checkInLocationName}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {checkInLocationName && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-green-600 dark:text-green-400 font-medium">IN:</span>
            <MapPin className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-foreground">{checkInLocationName}</span>
          </div>
        )}
        {checkOutLocationName && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-red-600 dark:text-red-400 font-medium">OUT:</span>
            <MapPin className="h-3 w-3 text-red-600 dark:text-red-400" />
            <span className="text-foreground">{checkOutLocationName}</span>
          </div>
        )}
      </div>
    );
  };

  // Pagination Logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'late':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'absent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'leave':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'late':
        return <Timer className="h-3 w-3" />;
      case 'absent':
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === attendanceData.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(attendanceData.map((r: any) => r.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[260px] relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or department..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>

            {/* Refresh */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                fetchData();
              }}
              title="Refresh"
              className="border-gray-300 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* View toggle */}
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              title={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
              className={viewMode === 'grid' ? 'shrink-0' : 'border-gray-300 shrink-0'}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>

            {/* Date Filter */}
            <div className="shrink-0">
              <DateFilterBar 
                dateRange={dateRange} 
                onDateRangeChange={setDateRange}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 shrink-0">
              {isMounted ? (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-gray-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-40 h-9 border border-gray-300 rounded bg-muted/50" aria-hidden />
              )}
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2 shrink-0">
              {isMounted ? (
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px] border-gray-300">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-[180px] h-9 border border-gray-300 rounded bg-muted/50" aria-hidden />
              )}
            </div>

            {/* Manual Entry Button */}
            <Link href="/attendance/add" className="shrink-0">
              <Button className="bg-black text-white hover:bg-black/90 whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" />
                Manual Entry
              </Button>
            </Link>
          </div>

            {/* Selected Actions */}
            <AnimatePresence>
              {selectedRecords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2"
                >
                  <span className="text-sm font-medium">
                    {selectedRecords.length} selected
                  </span>
                  <Separator orientation="vertical" className="h-6" />
                  {/* <Button variant="ghost" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button> */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleEditClick}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {selectedRecords.length === 1 ? 'Edit' : 'Bulk Edit'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteMultiple}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRecords([])}
                    className="ml-auto"
                  >
                    Clear Selection
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
        </CardContent>
      </Card>

      {/* Summary Stats - Interactive Cards - REMOVED as requested */}
      
      {/* Charts Section - REMOVED as requested */}

      {/* Attendance List */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            {/* Mobile Card View - Only show on small screens */}
            <div className="block lg:hidden divide-y">
              {loading ? (
                <div className="divide-y">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`mobile-skel-${i}`} className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : attendanceData.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No attendance records found
                  {totalItems > 0 && (
                    <div className="mt-2 text-xs">
                      (Total: {totalItems} but no data in current page)
                    </div>
                  )}
                </div>
              ) : (
                attendanceData.map((record: any, index: number) => {
                  if (!record || !record.id) {
                    console.warn('Invalid record at index', index, record);
                    return null;
                  }
                  return (
                  <div
                    key={`mobile-${record.id}-${index}`}
                    className="p-4 space-y-3 border-b last:border-b-0"
                  >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecords([...selectedRecords, record.id]);
                          } else {
                            setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                          }
                        }}
                        className="rounded border-gray-300 mt-1"
                      />
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={record.member.avatar} />
                        <AvatarFallback>
                          {record.member.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          <Link href={`/members/${record.member.id ?? ''}`} className="hover:underline">
                            {record.member.name}
                          </Link>
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{record.member.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                        onClick={() => handleEditSingle(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete"
                        onClick={() => handleDeleteClick(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Check In</p>
                      <p className="font-mono text-sm">
                        {record.checkIn ? formatLocalTime(record.checkIn, userTimezone, '24h', true) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                      <p className="font-mono text-sm">
                        {record.checkOut ? formatLocalTime(record.checkOut, userTimezone, '24h', true) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Work Hours</p>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{record.workHours}</span>
                        {record.overtime && (
                          <Badge variant="secondary" className="w-fit text-xs">
                            +{record.overtime} OT
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Badge className={cn('gap-1', getStatusColor(record.status))}>
                        {getStatusIcon(record.status)}
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <LocationDisplay 
                      checkInLocationName={record.checkInLocationName}
                      checkOutLocationName={record.checkOutLocationName}
                    />
                  </div>
                </div>
                  );
                }).filter(Boolean)
              )}
            </div>

            {/* Desktop Table View - Show on larger screens */}
            <div className="hidden lg:block overflow-x-auto w-full">
              <table className="w-full min-w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === attendanceData.length && attendanceData.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-medium">Member</th>
                    <th className="p-4 text-left text-sm font-medium">Check In</th>
                    <th className="p-4 text-left text-sm font-medium">Check Out</th>
                    <th className="p-4 text-left text-sm font-medium">Work Hours</th>
                    <th className="p-4 text-left text-sm font-medium">Status</th>
                    <th className="p-4 text-left text-sm font-medium">Location</th>
                    <th className="p-4 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <tr key={`table-skel-${i}`} className="border-b">
                          <td className="p-4">
                            <Skeleton className="h-4 w-4 rounded" />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </td>
                          <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                          <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Skeleton className="h-8 w-8 rounded" />
                              <Skeleton className="h-8 w-8 rounded" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : attendanceData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No attendance records found
                        {totalItems > 0 && (
                          <div className="mt-2 text-xs">
                            (Total: {totalItems} but no data in current page)
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    attendanceData.map((record: any, index: number) => {
                      if (!record || !record.id) {
                        console.warn('Invalid record at index', index, record);
                        return null;
                      }
                      console.log(`📋 Rendering table row ${index + 1}/${attendanceData.length}:`, record.id, record.member.name);
                      return (
                    <tr
                      key={`table-${record.id}-${index}`}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecords([...selectedRecords, record.id]);
                            } else {
                              setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={record.member.avatar} />
                            <AvatarFallback>
                              {record.member.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              <Link href={`/members/${record.member.id ?? ''}`} className="hover:underline">
                                {record.member.name}
                              </Link>
                            </p>
                            <p className="text-sm text-muted-foreground">{record.member.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">
                          {record.checkIn ? formatLocalTime(record.checkIn, userTimezone, '24h', true) : '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">
                          {record.checkOut ? formatLocalTime(record.checkOut, userTimezone, '24h', true) : '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm">{record.workHours}</span>
                          {record.overtime && (
                            <Badge variant="secondary" className="w-fit text-xs">
                              +{record.overtime} OT
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={cn('gap-1', getStatusColor(record.status))}>
                          {getStatusIcon(record.status)}
                          {record.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <LocationDisplay 
                          checkInLocationName={record.checkInLocationName}
                          checkOutLocationName={record.checkOutLocationName}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            onClick={() => handleEditSingle(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            onClick={() => handleDeleteClick(record.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                      );
                    }).filter(Boolean)
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (aligned with Members) */}
            {!loading && (
              <div className="flex items-center justify-between py-4 px-4 bg-muted/50 rounded-md border">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                    title="First page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                    title="Previous page"
                  >
                    <ChevronLeft className="  h-4 w-4" />
                  </Button>

                  <span className="text-sm text-muted-foreground">Page</span>

                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, totalPages)}
                    value={currentPage}
                    onChange={(e) => {
                      const page = e.target.value ? Number(e.target.value) : 1;
                      const safe = Math.max(1, Math.min(page, Math.max(1, totalPages)));
                      setCurrentPage(safe);
                    }}
                    className="w-12 h-8 px-2 border rounded text-sm text-center bg-background"
                    disabled={totalItems === 0}
                  />

                  <span className="text-sm text-muted-foreground">/ {Math.max(1, totalPages)}</span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages || 1, currentPage + 1))}
                    disabled={currentPage >= (totalPages || 1)}
                    className="h-8 w-8 p-0"
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, totalPages))}
                    disabled={currentPage >= (totalPages || 1)}
                    className="h-8 w-8 p-0"
                    title="Last page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {totalItems > 0
                      ? (
                        <>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} total records</>
                        )
                      : (<>Showing 0 to 0 of 0 total records</>)}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        const size = parseInt(e.target.value, 10) || 10;
                        setItemsPerPage(size);
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border rounded text-sm bg-background"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          {loading && attendanceData.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground">Loading attendance data...</span>
                </div>
              </CardContent>
            </Card>
          ) : attendanceData.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No attendance records found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {attendanceData.map((record: any, index: number) => {
                if (!record || !record.id) {
                  return null;
                }
                console.log(`🎴 Rendering grid card ${index + 1}/${attendanceData.length}:`, record.id, record.member.name);
                return (
            <div
              key={`grid-${record.id}-${index}`}
              className="relative"
            >
              {/* Checkbox - Top Left */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={selectedRecords.includes(record.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRecords([...selectedRecords, record.id]);
                    } else {
                      setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                    }
                  }}
                  className="rounded border-gray-300 w-5 h-5 cursor-pointer"
                />
              </div>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={record.member.avatar} />
                        <AvatarFallback>
                          {record.member.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          <Link href={`/members/${record.member.id ?? ''}`} className="hover:underline">
                            {record.member.name}
                          </Link>
                        </p>
                        <p className="text-sm text-muted-foreground">{record.member.department}</p>
                      </div>
                    </div>
                    <Badge className={cn('gap-1', getStatusColor(record.status))}>
                      {getStatusIcon(record.status)}
                      {record.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Check In</p>
                      <p className="font-mono font-medium">
                        {record.checkIn ? formatLocalTime(record.checkIn, userTimezone, '24h', true) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check Out</p>
                      <p className="font-mono font-medium">
                        {record.checkOut ? formatLocalTime(record.checkOut, userTimezone, '24h', true) : '-'}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Work Hours</span>
                    <span className="font-semibold">{record.workHours}</span>
                  </div>
                  <LocationDisplay 
                    checkInLocationName={record.checkInLocationName}
                    checkOutLocationName={record.checkOutLocationName}
                  />
                </CardContent>
              </Card>
            </div>
              );
              }).filter(Boolean)}
            </div>
          )}
        </>
      )}

      {/* Edit Dialog Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRecords.length === 1 ? 'Edit Attendance' : `Bulk Edit (${selectedRecords.length} records)`}
            </DialogTitle>
            <DialogDescription>
              {selectedRecords.length === 1 
                ? `Edit attendance record for ${editingRecords[0]?.member?.name || 'member'}`
                : `Update status and remarks for ${selectedRecords.length} selected records`
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              {/* Status Field */}
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                        <SelectItem value="early_leave">Early Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remarks Field */}
              <FormField
                control={editForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Add remarks..." 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display affected records */}
              {selectedRecords.length > 1 && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium mb-2">Affected Records:</p>
                  <ul className="space-y-1 text-xs">
                    {editingRecords.slice(0, 5).map((record) => (
                      <li key={record.id}>
                        • {record.member?.name} ({record.member?.department})
                      </li>
                    ))}
                    {editingRecords.length > 5 && (
                      <li className="text-muted-foreground">... and {editingRecords.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm">
            <p className="font-medium text-destructive mb-1">Warning</p>
            <p className="text-destructive/80">
              This will permanently delete the attendance record from the database.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
