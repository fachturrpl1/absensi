'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
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
import { getAllAttendance } from '@/action/attendance';
import { toast } from 'sonner';

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
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Auto-refresh state
  const [isAutoRefreshPaused, setIsAutoRefreshPaused] = useState(false);

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
    // Pause auto-refresh while loading to avoid overlapping
    setIsAutoRefreshPaused(true); 
    try {
      const result = await getAllAttendance({
        page: currentPage,
        limit: itemsPerPage,
        dateFrom: dateRange.from.toISOString().split('T')[0],
        dateTo: dateRange.to.toISOString().split('T')[0],
        search: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        department: departmentFilter === 'all' ? undefined : departmentFilter,
      });

      if (result.success) {
        setAttendanceData(result.data);
        setTotalItems(result.meta?.total || 0);
        
        // Set timezone from first record if available (fallback to UTC)
        if (result.data.length > 0) {
          setUserTimezone(result.data[0].timezone || 'UTC');
        }

        // Extract unique departments from current page (simple solution for now)
        const uniqueDepts = Array.from(new Set(
          result.data.map((r: any) => r.member.department)
        )).filter(dept => dept && dept !== 'No Department').sort();
        
        if (departments.length === 0 && uniqueDepts.length > 0) {
          setDepartments(uniqueDepts);
        }
      } else {
        toast.error('Failed to load attendance data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
      setIsAutoRefreshPaused(false); // Resume countdown
    }
  }, [currentPage, itemsPerPage, dateRange, searchQuery, statusFilter, departmentFilter]);

  // Trigger fetch when filters change (and initial load)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when filters change (except pagination itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, searchQuery, statusFilter, departmentFilter]);

  // Auto-refresh Timer
  useEffect(() => {
    // Only run timer if not loading and not paused
    if (loading || isAutoRefreshPaused) return;

    const timer = setInterval(() => {
      fetchData();
    }, 10000); // 10 seconds

    return () => clearInterval(timer);
  }, [loading, isAutoRefreshPaused, fetchData]);

  // Stats calculation
  const filteredStats = useMemo(() => {
    // Placeholder stats based on current page only
    const total = attendanceData.length; 
    const present = attendanceData.filter((r: any) => r.status === 'present').length;
    const late = attendanceData.filter((r: any) => r.status === 'late').length;
    const absent = attendanceData.filter((r: any) => r.status === 'absent').length;

    return {
      total: totalItems, 
      present,
      late,
      absent,
      onLeave: 0,
      avgWorkHours: '8.5h',
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }, [attendanceData, totalItems]);

  // Helper component to display device location
  const LocationDisplay = ({ checkInLocationName, checkOutLocationName }: any) => {
    if (!checkInLocationName && !checkOutLocationName) {
      return <span className="text-muted-foreground text-xs">No device</span>;
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
  
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }
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
    if (selectedRecords.length === attendanceData.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(attendanceData.map((r: any) => r.id));
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
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
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 pr-20"
                  />
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

              {(searchQuery || statusFilter !== 'all' || departmentFilter !== 'all' || dateRange.preset !== 'today') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setStatusFilter('all');
                    setDepartmentFilter('all');
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

      {/* Summary Stats - Interactive Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className={cn(
            "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
            statusFilter === 'present' && "ring-2 ring-green-500"
          )}
          onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present (Page)</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{filteredStats.present}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span>On current page</span>
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
            <CardTitle className="text-sm font-medium">Late (Page)</CardTitle>
            <Timer className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{filteredStats.late}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>On current page</span>
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
            <CardTitle className="text-sm font-medium">Absent (Page)</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{filteredStats.absent}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-green-600" />
              <span>On current page</span>
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
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{filteredStats.total}</div>
            <Progress value={100} className="h-1 mt-2" />
          </CardContent>
        </Card>
      </div>

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
                  {loading && attendanceData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-muted-foreground">Loading attendance data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : attendanceData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No attendance records found
                      </td>
                    </tr>
                  ) : attendanceData.map((record: any, index: number) => (
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
                            <AvatarImage src={record.member.avatar} />
                            <AvatarFallback>
                              {record.member.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{record.member.name}</p>
                            <p className="text-sm text-muted-foreground">{record.member.department}</p>
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
                        <LocationDisplay 
                          checkInLocationName={record.checkInLocationName}
                          checkOutLocationName={record.checkOutLocationName}
                        />
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
            {!loading && totalItems > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {attendanceData.map((record: any, index: number) => (
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
                        <AvatarImage src={record.member.avatar} />
                        <AvatarFallback>
                          {record.member.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{record.member.name}</p>
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
                  <LocationDisplay 
                    checkInLocationName={record.checkInLocationName}
                    checkOutLocationName={record.checkOutLocationName}
                  />
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
