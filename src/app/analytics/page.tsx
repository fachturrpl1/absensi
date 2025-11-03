'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Clock, Users, TrendingUp,
  AlertCircle, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/utils/supabase/client';
import { format, subDays } from 'date-fns';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { PageSkeleton } from '@/components/ui/loading-skeleton';

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

const COLORS = {
  present: '#10b981',
  late: '#f59e0b',
  absent: '#ef4444',
  leave: '#3b82f6',
  excused: '#8b5cf6',
};

export default function AnalyticsPageComprehensive() {
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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

        const { data: records, error } = await supabase
          .from('attendance_records')
          .select(`
            *,
            organization_members!inner (
              id,
              organization_id,
              user_profiles (first_name, last_name, profile_photo_url),
              departments:department_id (id, name)
            )
          `)
          .eq('organization_members.organization_id', orgMember.organization_id)
          .gte('attendance_date', format(subDays(new Date(), 90), 'yyyy-MM-dd'))
          .order('attendance_date', { ascending: false });

        if (error) throw error;

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const total = filteredRecords.length;
    if (total === 0) return null;

    const presentCount = filteredRecords.filter(r => r.status === 'present').length;
    const lateCount = filteredRecords.filter(r => r.status === 'late').length;
    const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
    const leaveCount = filteredRecords.filter(r => r.status === 'leave').length;
    const excusedCount = filteredRecords.filter(r => r.status === 'excused').length;

    const totalWorkMinutes = filteredRecords.reduce((sum, r) => sum + (r.work_duration_minutes || 0), 0);
    const totalLateMinutes = filteredRecords.reduce((sum, r) => sum + (r.late_minutes || 0), 0);
    
    const attendanceRate = ((presentCount + lateCount) / total) * 100;
    const punctualityRate = (presentCount / (presentCount + lateCount || 1)) * 100;
    const absenteeismRate = (absentCount / total) * 100;
    const avgWorkHours = totalWorkMinutes / total / 60;
    const avgLateMinutes = totalLateMinutes / (lateCount || 1);

    const uniqueMembers = new Set(filteredRecords.map(r => r.member_name));
    const activeMembers = uniqueMembers.size;

    return {
      total,
      presentCount,
      lateCount,
      absentCount,
      leaveCount,
      excusedCount,
      totalWorkHours: totalWorkMinutes / 60,
      attendanceRate,
      punctualityRate,
      absenteeismRate,
      avgWorkHours,
      avgLateMinutes,
      activeMembers,
    };
  }, [filteredRecords]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: 'Present', value: metrics.presentCount, color: COLORS.present },
      { name: 'Late', value: metrics.lateCount, color: COLORS.late },
      { name: 'Absent', value: metrics.absentCount, color: COLORS.absent },
      { name: 'Leave', value: metrics.leaveCount, color: COLORS.leave },
      { name: 'Excused', value: metrics.excusedCount, color: COLORS.excused },
    ].filter(item => item.value > 0);
  }, [metrics]);

  // Weekly trend
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysMap: Record<string, { present: number; late: number; absent: number }> = {};
    
    days.forEach(day => {
      daysMap[day] = { present: 0, late: 0, absent: 0 };
    });
    
    filteredRecords.forEach(record => {
      const date = new Date(record.attendance_date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[date.getDay()];
      
      if (dayName && daysMap[dayName]) {
        if (record.status === 'present') daysMap[dayName].present++;
        else if (record.status === 'late') daysMap[dayName].late++;
        else if (record.status === 'absent') daysMap[dayName].absent++;
      }
    });
    
    return days.map(day => ({
      day,
      present: daysMap[day]?.present || 0,
      late: daysMap[day]?.late || 0,
      absent: daysMap[day]?.absent || 0,
      total: (daysMap[day]?.present || 0) + (daysMap[day]?.late || 0) + (daysMap[day]?.absent || 0),
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
        attendanceRate: data.total > 0 ? ((data.present + data.late) / data.total * 100).toFixed(1) : '0',
        present: data.present,
        late: data.late,
        absent: data.absent,
        total: data.total,
      }))
      .sort((a, b) => parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate));
  }, [filteredRecords]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive attendance analytics and insights
          </p>
        </div>
      </motion.div>

      {/* Date Filter */}
      <DateFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} />

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRecords.length} records from {format(dateRange.from, 'MMM dd')} to {format(dateRange.to, 'MMM dd, yyyy')}
      </div>

      {/* Always show components, with empty states if no data */}
      <>
        {/* KPI Cards - 4 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-100">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{metrics ? metrics.attendanceRate.toFixed(1) : '0.0'}%</div>
                  <Progress value={metrics?.attendanceRate || 0} className="mt-2 h-2 bg-blue-400" />
                  <p className="text-xs text-blue-100 mt-2">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {metrics ? `${metrics.presentCount + metrics.lateCount} of ${metrics.total}` : 'No data today'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-100">Punctuality Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{metrics ? metrics.punctualityRate.toFixed(1) : '0.0'}%</div>
                  <Progress value={metrics?.punctualityRate || 0} className="mt-2 h-2 bg-green-400" />
                  <p className="text-xs text-green-100 mt-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {metrics ? `${metrics.presentCount} on-time arrivals` : 'No data today'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 border-0 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-100">Avg Work Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{metrics ? metrics.avgWorkHours.toFixed(1) : '0.0'}h</div>
                  <p className="text-xs text-orange-100 mt-4">
                    <BarChart3 className="w-3 h-3 inline mr-1" />
                    {metrics ? 'Per employee per day' : 'No data today'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-100">Active Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{metrics?.activeMembers || 0}</div>
                  <p className="text-xs text-purple-100 mt-4">
                    <Users className="w-3 h-3 inline mr-1" />
                    {metrics ? 'Unique employees' : 'No data today'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

        {/* Secondary Metrics - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Absenteeism Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? metrics.absenteeismRate.toFixed(1) : '0.0'}%</div>
              <Progress value={metrics?.absenteeismRate || 0} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {metrics ? `${metrics.absentCount} absences` : 'No absences today'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Avg Late Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? metrics.avgLateMinutes.toFixed(0) : '0'} min</div>
              <p className="text-xs text-muted-foreground mt-4">
                {metrics ? `${metrics.lateCount} late arrivals` : 'No late arrivals today'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Total Work Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics ? metrics.totalWorkHours.toFixed(1) : '0.0'}h</div>
              <p className="text-xs text-muted-foreground mt-4">
                {metrics ? 'Cumulative hours' : 'No work hours today'}
              </p>
            </CardContent>
          </Card>
        </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Trend</CardTitle>
                <CardDescription>Attendance breakdown by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '10px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          opacity: 1,
                        }}
                        wrapperStyle={{ 
                          zIndex: 9999,
                          pointerEvents: 'none',
                          outline: 'none',
                        }}
                        cursor={{ fill: 'rgba(0, 0, 0, 0.1)', strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                      <Legend />
                      <Bar dataKey="present" fill={COLORS.present} name="Present" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="late" fill={COLORS.late} name="Late" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="absent" fill={COLORS.absent} name="Absent" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No attendance data for this week</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Breakdown by attendance status</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '10px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          opacity: 1,
                        }}
                        wrapperStyle={{ 
                          zIndex: 9999,
                          pointerEvents: 'none',
                          outline: 'none',
                        }}
                        isAnimationActive={false}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No status distribution data</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Department Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Attendance rate by department (sorted)</CardDescription>
            </CardHeader>
            <CardContent>
              {departmentData.length > 0 ? (
                <div className="space-y-4">
                  {departmentData.slice(0, 10).map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{dept.name}</span>
                        <span className="text-muted-foreground">
                          {dept.attendanceRate}% ({dept.present + dept.late}/{dept.total})
                        </span>
                      </div>
                      <Progress value={parseFloat(dept.attendanceRate)} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No department data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
      </>
    </div>
  );
}
