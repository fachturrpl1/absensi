'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Clock, Target,
  Building2, BarChart3, PieChart, Activity,
  CheckCircle2, XCircle, Award, Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/utils/supabase/client';
import { format, subDays } from 'date-fns';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';
import { EmptyState } from '@/components/dashboard/empty-state';
import {
  AreaChart, Area, 
  PieChart as RechartPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface AttendanceRecord {
  id: string;
  member_name: string;
  department_name: string;
  status: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  work_duration_minutes: number | null;
  late_minutes: number | null;
  attendance_date: string;
}

interface MasterData {
  totalMembers: number;
  totalDepartments: number;
  averageTeamSize: number;
}

const COLORS = {
  present: '#10b981',
  late: '#f59e0b',
  absent: '#ef4444',
  leave: '#3b82f6',
  excused: '#8b5cf6',
};

export default function AnalyticsPage() {
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [masterData, setMasterData] = useState<MasterData>({ totalMembers: 0, totalDepartments: 0, averageTeamSize: 0 });
  const [dateRange, setDateRange] = useState<DateFilterState>(() => {
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    return {
      from: startOfToday,
      to: endOfToday,
      preset: 'today',
    };
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (!orgMember) return;
        const orgId = orgMember.organization_id;

        // Fetch master data
        const [membersResult, deptsResult] = await Promise.all([
          supabase
            .from('organization_members')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('is_active', true),
          supabase
            .from('departments')
            .select('id, name', { count: 'exact' })
            .eq('organization_id', orgId)
        ]);

        setMasterData({
          totalMembers: membersResult.count || 0,
          totalDepartments: deptsResult.count || 0,
          averageTeamSize: (membersResult.count || 0) / (deptsResult.count || 1),
        });

        // Fetch attendance records (last 90 days)
        const { data: records } = await supabase
          .from('attendance_records')
          .select(`
            id,
            status,
            actual_check_in,
            actual_check_out,
            work_duration_minutes,
            late_minutes,
            attendance_date,
            organization_members!inner (
              organization_id,
              user_profiles (first_name, last_name),
              departments!organization_members_department_id_fkey (name)
            )
          `)
          .eq('organization_members.organization_id', orgId)
          .gte('attendance_date', format(subDays(new Date(), 90), 'yyyy-MM-dd'))
          .order('attendance_date', { ascending: false });

        const formattedRecords: AttendanceRecord[] = (records || []).map((record: any) => ({
          id: record.id,
          member_name: `${record.organization_members.user_profiles.first_name} ${record.organization_members.user_profiles.last_name}`,
          department_name: record.organization_members.departments?.name || 'N/A',
          status: record.status,
          actual_check_in: record.actual_check_in,
          actual_check_out: record.actual_check_out,
          work_duration_minutes: record.work_duration_minutes,
          late_minutes: record.late_minutes,
          attendance_date: record.attendance_date,
        }));

        setAllRecords(formattedRecords);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const getFilterLabel = () => {
    if (!dateRange.preset) return 'Custom Range';
    const labels: Record<string, string> = {
      'today': 'Today',
      'last7': 'Last 7 Days',
      'last30': 'Last 30 Days',
      'thisWeek': 'This Week',
      'thisMonth': 'This Month',
    };
    return labels[dateRange.preset] || 'Custom Range';
  };

  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      const recordDate = new Date(record.attendance_date);
      recordDate.setHours(0, 0, 0, 0);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      return recordDate >= fromDate && recordDate <= toDate;
    });
  }, [allRecords, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredRecords.length;
    if (total === 0) return null;

    const presentCount = filteredRecords.filter(r => r.status === 'present').length;
    const lateCount = filteredRecords.filter(r => r.status === 'late').length;
    const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
    const leaveCount = filteredRecords.filter(r => r.status === 'leave' || r.status === 'excused').length;

    const totalWorkMinutes = filteredRecords.reduce((sum, r) => sum + (r.work_duration_minutes || 0), 0);
    const totalLateMinutes = filteredRecords.reduce((sum, r) => sum + (r.late_minutes || 0), 0);
    
    const attendanceRate = ((presentCount + lateCount) / total) * 100;
    const punctualityRate = presentCount > 0 ? (presentCount / (presentCount + lateCount)) * 100 : 0;
    const absenteeismRate = (absentCount / total) * 100;
    const avgWorkHours = totalWorkMinutes / total / 60;
    const avgLateMinutes = lateCount > 0 ? totalLateMinutes / lateCount : 0;

    const uniqueMembers = new Set(filteredRecords.map(r => r.member_name));

    return {
      total,
      presentCount,
      lateCount,
      absentCount,
      leaveCount,
      totalWorkHours: totalWorkMinutes / 60,
      attendanceRate,
      punctualityRate,
      absenteeismRate,
      avgWorkHours,
      avgLateMinutes,
      activeMembers: uniqueMembers.size,
    };
  }, [filteredRecords]);

  // Status distribution
  const statusData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: 'Present', value: metrics.presentCount, color: COLORS.present },
      { name: 'Late', value: metrics.lateCount, color: COLORS.late },
      { name: 'Absent', value: metrics.absentCount, color: COLORS.absent },
      { name: 'Leave', value: metrics.leaveCount, color: COLORS.leave },
    ].filter(item => item.value > 0);
  }, [metrics]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const dateMap: Record<string, { present: number; late: number; absent: number }> = {};
    
    filteredRecords.forEach(record => {
      const dateKey = format(new Date(record.attendance_date), 'MMM dd');
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { present: 0, late: 0, absent: 0 };
      }
      if (record.status === 'present') dateMap[dateKey].present++;
      else if (record.status === 'late') dateMap[dateKey].late++;
      else if (record.status === 'absent') dateMap[dateKey].absent++;
    });

    return Object.entries(dateMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-14) // Last 14 days
      .map(([date, data]) => ({
        date,
        ...data,
        total: data.present + data.late + data.absent,
      }));
  }, [filteredRecords]);

  // Department performance
  const departmentData = useMemo(() => {
    const depts: Record<string, { present: number; late: number; absent: number; total: number }> = {};
    
    filteredRecords.forEach(record => {
      const deptName = record.department_name || 'Unknown';
      if (!depts[deptName]) {
        depts[deptName] = { present: 0, late: 0, absent: 0, total: 0 };
      }
      depts[deptName].total++;
      if (record.status === 'present') depts[deptName].present++;
      else if (record.status === 'late') depts[deptName].late++;
      else if (record.status === 'absent') depts[deptName].absent++;
    });

    return Object.entries(depts)
      .map(([name, data]) => ({
        name,
        rate: data.total > 0 ? ((data.present + data.late) / data.total * 100) : 0,
        present: data.present,
        late: data.late,
        absent: data.absent,
        total: data.total,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }, [filteredRecords]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive attendance insights and performance metrics
          </p>
        </div>
        <DateFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} />
      </motion.div>

      {/* Filter Info */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline">{getFilterLabel()}</Badge>
        <span className="text-muted-foreground">
          {filteredRecords.length} records from {format(dateRange.from, 'MMM dd')} to {format(dateRange.to, 'MMM dd, yyyy')}
        </span>
      </div>

      {/* SECTION 1: MASTER DATA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Organization Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{masterData.totalMembers}</div>
                <Users className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Active employees in organization</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{masterData.totalDepartments}</div>
                <Building2 className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total organizational units</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Team Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{masterData.averageTeamSize.toFixed(1)}</div>
                <Target className="w-8 h-8 text-green-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Members per department</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SECTION 2: KEY PERFORMANCE INDICATORS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Key Performance Indicators</h2>
          <Badge variant="outline" className="ml-auto">{getFilterLabel()}</Badge>
        </div>
        
        {metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{metrics.attendanceRate.toFixed(1)}%</div>
                <Progress value={metrics.attendanceRate} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.presentCount + metrics.lateCount} of {metrics.total} attended
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-600" />
                  Punctuality Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{metrics.punctualityRate.toFixed(1)}%</div>
                <Progress value={metrics.punctualityRate} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.presentCount} on-time arrivals
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  Avg Work Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{metrics.avgWorkHours.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground mt-4">
                  Per member per day average
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Absenteeism Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{metrics.absenteeismRate.toFixed(1)}%</div>
                <Progress value={metrics.absenteeismRate} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.absentCount} absences recorded
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={BarChart3}
                title="No data available"
                description={`No attendance records found for ${getFilterLabel().toLowerCase()}. Adjust your date range to see metrics.`}
              />
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* SECTION 3: ATTENDANCE TRENDS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Attendance Trends</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Trend Chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Daily Attendance Trend</CardTitle>
              <CardDescription>Last 14 days attendance pattern</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyTrend}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.present} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.present} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.late} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.late} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="present" stroke={COLORS.present} fillOpacity={1} fill="url(#colorPresent)" />
                    <Area type="monotone" dataKey="late" stroke={COLORS.late} fillOpacity={1} fill="url(#colorLate)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <EmptyState
                    icon={BarChart3}
                    title="No trend data"
                    description="Not enough data points to show trend"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Status Distribution</CardTitle>
              <CardDescription>Breakdown by attendance status</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartPie>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartPie>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2">
                    {statusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}:</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <EmptyState
                    icon={PieChart}
                    title="No distribution data"
                    description="No status breakdown available"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SECTION 4: DEPARTMENT PERFORMANCE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Department Performance</h2>
        </div>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Top 5 Departments by Attendance Rate</CardTitle>
            <CardDescription>Ranked by percentage of attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentData.length > 0 ? (
              <div className="space-y-4">
                {departmentData.map((dept, index) => (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'default' : 'outline'} className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600 dark:text-green-400">{dept.present}✓</span>
                        <span className="text-orange-600 dark:text-orange-400">{dept.late}⚠</span>
                        <span className="text-red-600 dark:text-red-400">{dept.absent}✗</span>
                        <span className="font-bold min-w-[60px] text-right">{dept.rate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={dept.rate} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Building2}
                title="No department data"
                description="No performance data available for departments"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 5: ADDITIONAL METRICS */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Additional Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.activeMembers}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Unique members with attendance records
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Work Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.totalWorkHours.toFixed(0)}h</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Combined hours for the period
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Late Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.avgLateMinutes.toFixed(0)} min</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Average lateness when late
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}
