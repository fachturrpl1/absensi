'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';
import {
  Clock,
  Search,
  TrendingUp,
  TrendingDown,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  Plus,
  Grid3x3,
  List,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { formatLocalTime } from '@/utils/timezone';

interface ModernAttendanceListProps {
  initialData?: any[];
  initialStats?: any;
}

export default function ModernAttendanceList({ initialData: _initialData, initialStats: _initialStats }: ModernAttendanceListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [userTimezone, setUserTimezone] = useState('UTC');
  
  // Date filter state (same as Dashboard)
  const [dateRange, setDateRange] = useState<DateFilterState>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    return {
      from: today,
      to: endOfToday,
      preset: 'today',
    };
  });
  
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Filter data by date range and other filters
  const filteredData = useMemo(() => {
    return attendanceData.filter((record: any) => {
      // Filter by date range (like Dashboard)
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      const matchDate = recordDate >= fromDate && recordDate <= toDate;
      
      const matchSearch = record.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.employee.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchDepartment = departmentFilter === 'all' || record.employee.department === departmentFilter;
      const matchLocation = locationFilter === 'all' || record.location === locationFilter;
      
      return matchDate && matchSearch && matchStatus && matchDepartment && matchLocation;
    });
  }, [attendanceData, dateRange, searchQuery, statusFilter, departmentFilter, locationFilter]);

  // Calculate stats from filtered data (based on date range)
  const filteredStats = useMemo(() => {
    // First filter only by date range (ignore status filter for stats calculation)
    const dateFilteredData = attendanceData.filter((record: any) => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      return recordDate >= fromDate && recordDate <= toDate;
    });

    const present = dateFilteredData.filter((r: any) => r.status === 'present').length;
    const late = dateFilteredData.filter((r: any) => r.status === 'late').length;
    const absent = dateFilteredData.filter((r: any) => r.status === 'absent').length;
    const total = dateFilteredData.length;

    return {
      total,
      present,
      late,
      absent,
      onLeave: 0,
      avgWorkHours: '8.5h',
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }, [attendanceData, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, departmentFilter, locationFilter, dateRange]);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

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
    if (selectedRecords.length === filteredData.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredData.map((r: any) => r.id));
    }
  };

  // Realtime data fetching
  useEffect(() => {
    const supabase = createClient();

    const fetchRealtimeData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get organization_id and timezone
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id, organizations!inner(timezone)')
          .eq('user_id', user.id)
          .single();

        if (!orgMember) {
          setLoading(false);
          return;
        }

        // Set user timezone from organization
        const timezone = (orgMember as any).organizations?.timezone || 'UTC';
        setUserTimezone(timezone);

        // Fetch attendance records with organization filter through organization_members
        const { data: records, error } = await supabase
          .from('attendance_records')
          .select(`
            *,
            organization_members!inner (
              user_profiles (first_name, last_name, profile_photo_url),
              departments:department_id (name),
              organization_id
            )
          `)
          .eq('organization_members.organization_id', orgMember.organization_id)
          .order('attendance_date', { ascending: false });

        if (error) {
          console.error('Error fetching attendance:', error);
          setLoading(false);
          return;
        }

        if (records) {
        // Transform data to match component structure
        const transformed = records.map((r: any) => ({
          id: r.id,
          employee: {
            name: `${r.organization_members?.user_profiles?.first_name || ''} ${r.organization_members?.user_profiles?.last_name || ''}`,
            avatar: r.organization_members?.user_profiles?.profile_photo_url,
            position: '',
            department: r.organization_members?.departments?.name || 'No Department',
          },
          date: r.attendance_date,
          checkIn: r.actual_check_in || null,
          checkOut: r.actual_check_out || null,
          workHours: r.work_duration_minutes ? `${Math.floor(r.work_duration_minutes / 60)}h ${r.work_duration_minutes % 60}m` : '0h',
          status: r.status,
          overtime: '',
          location: '-',
          notes: r.remarks || '',
        }));

        setAttendanceData(transformed);

        // Extract unique departments from records
        const uniqueDepts = Array.from(new Set(
          transformed.map((r: any) => r.employee.department)
        )).filter(dept => dept && dept !== 'No Department').sort();
        setDepartments(uniqueDepts);
        }
      } catch (error) {
        console.error('Error in fetchRealtimeData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealtimeData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('attendance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
        },
        () => {
          fetchRealtimeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground">
            Track and manage employee attendance records
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/attendance/add">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Manual Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stats - Interactive Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className={cn(
            "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
            statusFilter === 'present' && "ring-2 ring-green-500"
          )}
          onClick={() => {
            console.log('Present card clicked! Current filter:', statusFilter);
            setStatusFilter(statusFilter === 'present' ? 'all' : 'present');
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{filteredStats.present}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span>{filteredStats.attendanceRate}% of total</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
            statusFilter === 'late' && "ring-2 ring-amber-500"
          )}
          onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Timer className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{filteredStats.late}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{filteredStats.total > 0 ? ((filteredStats.late / filteredStats.total) * 100).toFixed(1) : '0.0'}% of total</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
            statusFilter === 'absent' && "ring-2 ring-red-500"
          )}
          onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{filteredStats.absent}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-green-600" />
              <span>Click to filter</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
            statusFilter === 'all' && "ring-2 ring-blue-500"
          )}
          onClick={() => setStatusFilter('all')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">All Records</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{filteredStats.total}</div>
            <Progress value={100} className="h-1 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Date Filter + Search + View Toggle Row */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {/* Date Filter */}
                <DateFilterBar 
                  dateRange={dateRange} 
                  onDateRangeChange={setDateRange}
                />
                
                {/* Search */}
                <div className="relative flex-1 min-w-[250px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or department..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      if (e.target.value === '') setSearchQuery('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSearchQuery(searchInput);
                    }}
                    className="pl-9 pr-20"
                  />
                  <Button
                    size="sm"
                    className="absolute right-1 top-1/2 h-7 -translate-y-1/2"
                    onClick={() => setSearchQuery(searchInput)}
                  >
                    Search
                  </Button>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-l-none border-l"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className={showMoreFilters ? 'bg-accent' : ''}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                More Filters
                {showMoreFilters && <X className="ml-2 h-3 w-3" />}
              </Button>

              {(searchQuery || statusFilter !== 'all' || departmentFilter !== 'all' || locationFilter !== 'all' || dateRange.preset !== 'today') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                    setLocationFilter('all');
                    // Reset to today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endOfToday = new Date(today);
                    endOfToday.setHours(23, 59, 59, 999);
                    setDateRange({ from: today, to: endOfToday, preset: 'today' });
                  }}
                >
                  <X className="mr-2 h-3 w-3" />
                  Clear All Filters
                </Button>
              )}
            </div>

            {/* More Filters - Expanded Section */}
            <AnimatePresence>
              {showMoreFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t pt-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Additional Filters:</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Location Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Location</Label>
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Locations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            <SelectItem value="Main Office">Main Office</SelectItem>
                            <SelectItem value="Branch Office">Branch Office</SelectItem>
                            <SelectItem value="Remote">Remote</SelectItem>
                            <SelectItem value="WFH">Work From Home</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Work Hours Range */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Work Hours</Label>
                        <Select defaultValue="all">
                          <SelectTrigger>
                            <SelectValue placeholder="Any Duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Duration</SelectItem>
                            <SelectItem value="0-4">0-4 hours</SelectItem>
                            <SelectItem value="4-8">4-8 hours</SelectItem>
                            <SelectItem value="8+">8+ hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Has Notes */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Notes</Label>
                        <Select defaultValue="all">
                          <SelectTrigger>
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Records</SelectItem>
                            <SelectItem value="with-notes">With Notes</SelectItem>
                            <SelectItem value="no-notes">No Notes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLocationFilter('all');
                          // Reset other advanced filters here
                        }}
                      >
                        Reset Advanced Filters
                      </Button>
                      
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowMoreFilters(false)}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  <Button variant="ghost" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Bulk Edit
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
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === filteredData.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-medium">Employee</th>
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
                    <tr>
                      <td colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-muted-foreground">Loading attendance data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No attendance records found
                      </td>
                    </tr>
                  ) : paginatedData.map((record: any, index: number) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
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
                            <AvatarImage src={record.employee.avatar} />
                            <AvatarFallback>
                              {record.employee.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{record.employee.name}</p>
                            <p className="text-sm text-muted-foreground">{record.employee.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">
                          {formatLocalTime(record.checkIn, userTimezone, '24h', true)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">
                          {formatLocalTime(record.checkOut, userTimezone, '24h', true)}
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
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {record.location}
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && paginatedData.length > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        size="default"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={cn(
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {typeof page === 'number' ? (
                          <PaginationLink
                            href="#"
                            size="default"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        ) : (
                          <PaginationEllipsis />
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        size="default"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={cn(
                          currentPage === totalPages && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground">Loading attendance data...</span>
                </div>
              </CardContent>
            </Card>
          ) : paginatedData.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No attendance records found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedData.map((record: any, index: number) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={record.employee.avatar} />
                        <AvatarFallback>
                          {record.employee.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{record.employee.name}</p>
                        <p className="text-sm text-muted-foreground">{record.employee.position}</p>
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
                        {formatLocalTime(record.checkIn, userTimezone, '24h', true)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check Out</p>
                      <p className="font-mono font-medium">
                        {formatLocalTime(record.checkOut, userTimezone, '24h', true)}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Work Hours</span>
                    <span className="font-semibold">{record.workHours}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {record.location}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
