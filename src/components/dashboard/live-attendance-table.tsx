'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Removed Collapsible - not compatible with table structure
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  MapPin, 
  FileText,
  Users,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

interface AttendanceRecord {
  id: number;
  member_id: number;
  member_name: string;
  department_name: string;
  status: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  work_duration_minutes: number | null;
  late_minutes: number | null;
  notes: string | null;
  location: string | null;
  profile_photo_url: string | null;
}

interface LiveAttendanceTableProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  pageSize?: number;
}

const statusConfig = {
  present: {
    label: 'Hadir',
    color: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-500/20',
    icon: CheckCircle2,
    dotColor: 'bg-green-500',
  },
  late: {
    label: 'Terlambat',
    color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20',
    icon: AlertCircle,
    dotColor: 'bg-orange-500',
  },
  absent: {
    label: 'Tidak Hadir',
    color: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20',
    icon: XCircle,
    dotColor: 'bg-red-500',
  },
  'on-leave': {
    label: 'Cuti',
    color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20',
    icon: FileText,
    dotColor: 'bg-blue-500',
  },
};

// Simple cache to prevent duplicate requests
const attendanceCache: {
  data: AttendanceRecord[] | null;
  timestamp: number;
  isLoading: boolean;
} = {
  data: null,
  timestamp: 0,
  isLoading: false,
};

const ATTENDANCE_CACHE_DURATION = 120000; // 2 minutes cache (increased from 10s)

export function LiveAttendanceTable({
  autoRefresh = true,
  refreshInterval = 180000, // 3 minutes (increased from 60s)
  pageSize = 10,
}: LiveAttendanceTableProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAttendanceRecords = async (force = false) => {
    const now = Date.now();
    
    // Check cache first
    if (!force && attendanceCache.data && (now - attendanceCache.timestamp) < ATTENDANCE_CACHE_DURATION) {
      setRecords(attendanceCache.data);
      setLastUpdate(new Date(attendanceCache.timestamp));
      setLoading(false);
      return;
    }

    // Prevent concurrent requests (CRITICAL: blocks duplicates)
    if (attendanceCache.isLoading) {
      console.log('[LiveAttendance] Request already in progress, skipping duplicate');
      return;
    }

    attendanceCache.isLoading = true;

    try {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!orgMember?.organization_id) {
        throw new Error('Organization not found');
      }

      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          status,
          actual_check_in,
          actual_check_out,
          work_duration_minutes,
          late_minutes,
          notes,
          organization_member_id,
          organization_members!inner (
            id,
            organization_id,
            user_profiles!inner (
              first_name,
              last_name,
              profile_photo_url
            ),
            departments!organization_members_department_id_fkey (
              name
            )
          )
        `)
        .eq('organization_members.organization_id', orgMember.organization_id)
        .eq('attendance_date', today)
        .order('actual_check_in', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transformedData = data?.map((record: any) => {
        const member = record.organization_members;
        const profile = member?.user_profiles;
        const department = member?.departments;

        return {
          id: record.id,
          member_id: member?.id,
          member_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown',
          department_name: department?.name || 'N/A',
          status: record.status,
          actual_check_in: record.actual_check_in,
          actual_check_out: record.actual_check_out,
          work_duration_minutes: record.work_duration_minutes,
          late_minutes: record.late_minutes,
          notes: record.notes,
          location: null, // Can be populated if location tracking exists
          profile_photo_url: profile?.profile_photo_url,
        };
      }) || [];

      attendanceCache.data = transformedData;
      attendanceCache.timestamp = Date.now();
      setRecords(transformedData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
    } finally {
      setLoading(false);
      attendanceCache.isLoading = false;
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();

    if (autoRefresh) {
      const interval = setInterval(() => fetchAttendanceRecords(true), refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, refreshInterval]);

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.ceil(records.length / pageSize);
  const paginatedRecords = records.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-primary animate-pulse" />
            Live Attendance
          </CardTitle>
          <CardDescription className="text-muted-foreground">Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-primary" />
              Live Attendance Today
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Last updated: {format(lastUpdate, 'HH:mm:ss', { locale: idLocale })}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAttendanceRecords()}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="text-sm">
              <p className="text-muted-foreground">Total</p>
              <p className="font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="text-sm">
              <p className="text-muted-foreground">Present</p>
              <p className="font-bold text-green-600 dark:text-green-400">{stats.present}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <div className="text-sm">
              <p className="text-muted-foreground">Late</p>
              <p className="font-bold text-orange-600 dark:text-orange-400">{stats.late}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="text-sm">
              <p className="text-muted-foreground">Absent</p>
              <p className="font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No attendance records today</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Work Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record) => {
                    const isExpanded = expandedRows.has(record.id);
                    const config = statusConfig[record.status as keyof typeof statusConfig] || statusConfig.present;
                    const StatusIcon = config.icon;

                    return (
                      <React.Fragment key={record.id}>
                        <TableRow 
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleRow(record.id)}
                        >
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-0 h-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(record.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 border border-border">
                                <AvatarImage src={record.profile_photo_url || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {record.member_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{record.member_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{record.department_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-xs", config.color)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {record.actual_check_in 
                              ? format(new Date(record.actual_check_in), 'HH:mm', { locale: idLocale })
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-foreground">
                            {record.work_duration_minutes 
                              ? `${(record.work_duration_minutes / 60).toFixed(1)}h`
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${record.id}-details`}>
                            <TableCell colSpan={6} className="p-0 border-0">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-muted/30 border-t border-border">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        Time Details
                                      </h4>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Check In:</span>
                                          <span className="font-medium text-foreground">
                                            {record.actual_check_in 
                                              ? format(new Date(record.actual_check_in), 'HH:mm:ss', { locale: idLocale })
                                              : '-'
                                            }
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Check Out:</span>
                                          <span className="font-medium text-foreground">
                                            {record.actual_check_out 
                                              ? format(new Date(record.actual_check_out), 'HH:mm:ss', { locale: idLocale })
                                              : 'Not yet'
                                            }
                                          </span>
                                        </div>
                                        {record.late_minutes && record.late_minutes > 0 && (
                                          <div className="flex justify-between text-orange-600 dark:text-orange-400">
                                            <span>Late by:</span>
                                            <span className="font-bold">{record.late_minutes} min</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {record.location && (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                          <MapPin className="w-4 h-4 text-primary" />
                                          Location
                                        </h4>
                                        <p className="text-sm text-muted-foreground">{record.location}</p>
                                      </div>
                                    )}

                                    {record.notes && (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-primary" />
                                          Notes
                                        </h4>
                                        <p className="text-sm text-muted-foreground">{record.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, records.length)} of {records.length} records
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
