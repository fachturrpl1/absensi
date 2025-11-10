'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Removed unused spotlight components
import {
  Clock,
  Users,
  CheckCircle2,
  BarChart3,
  Activity,
  UserCheck,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { LiveAttendanceTable } from '@/components/dashboard/live-attendance-table';
import { EmptyState } from '@/components/dashboard/empty-state';

// Types
interface AttendanceRecord {
  id: number;
  member_name: string;
  department_name: string;
  status: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  work_duration_minutes: number | null;
  attendance_date: string;
  profile_photo_url: string | null;
}

interface DashboardStats {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  onTimeRate: number;
  avgWorkHours: number;
  totalWorkHoursToday: number;
  activeMembers: number;
}

// Color Palette
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Enhanced Stat Card Component with proper dark/light mode
const EnhancedStatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  trendValue,
  trendLabel,
  color = 'blue',
  delay = 0 
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
  delay?: number;
}) => {
  const iconColorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    green: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full border-border bg-card hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            </div>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColorClasses[color])}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
          
          {trend && (
            <div className="flex items-center gap-1.5 text-sm">
              {trend === 'up' && <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />}
              {trend === 'down' && <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />}
              {trend === 'neutral' && <Minus className="w-4 h-4 text-muted-foreground" />}
              <span className={cn(
                "font-semibold",
                trend === 'up' && "text-green-600 dark:text-green-400",
                trend === 'down' && "text-red-600 dark:text-red-400",
                trend === 'neutral' && "text-muted-foreground"
              )}>
                {trendValue}
              </span>
              {trendLabel && (
                <span className="text-muted-foreground text-xs ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function ImprovedDashboard() {
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Date filter state
  const [dateRange, setDateRange] = useState<DateFilterState>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    return { from: today, to: endOfToday, preset: 'today' };
  });

  const [stats, setStats] = useState<DashboardStats>({
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    onTimeRate: 0,
    avgWorkHours: 0,
    totalWorkHoursToday: 0,
    activeMembers: 0,
  });

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data
  useEffect(() => {
    const supabase = createClient();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: orgMemberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!orgMemberData) return;
        
        const orgId = String(orgMemberData.organization_id);

        const { data: attendanceData } = await supabase
          .from('attendance_records')
          .select(`
            id,
            status,
            actual_check_in,
            actual_check_out,
            work_duration_minutes,
            attendance_date,
            organization_members!inner (
              organization_id,
              user_profiles (
                first_name,
                last_name,
                profile_photo_url
              ),
              departments!organization_members_department_id_fkey (
                name
              )
            )
          `)
          .eq('organization_members.organization_id', orgId)
          .order('attendance_date', { ascending: false })
          .limit(1000);

        const formattedRecords: AttendanceRecord[] = (attendanceData || []).map((record: any) => ({
          id: record.id,
          member_name: `${record.organization_members.user_profiles.first_name} ${record.organization_members.user_profiles.last_name}`,
          department_name: record.organization_members.departments?.name || 'N/A',
          status: record.status,
          actual_check_in: record.actual_check_in,
          actual_check_out: record.actual_check_out,
          work_duration_minutes: record.work_duration_minutes,
          attendance_date: record.attendance_date,
          profile_photo_url: record.organization_members.user_profiles.profile_photo_url,
        })).filter(Boolean);

        setAllRecords(formattedRecords);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter records
  const fromDateStr = dateRange.from.toISOString().split('T')[0];
  const toDateStr = dateRange.to.toISOString().split('T')[0];
  
  const filteredRecords = useMemo(() => {
    if (allRecords.length === 0) return [];

    const fromDate = new Date(fromDateStr + 'T00:00:00');
    const toDate = new Date(toDateStr + 'T23:59:59.999');
    
    return allRecords.filter(record => {
      const recordDate = new Date(record.attendance_date + 'T00:00:00');
      return recordDate >= fromDate && recordDate <= toDate;
    });
  }, [allRecords, fromDateStr, toDateStr]);

  // Calculate stats
  useEffect(() => {
    const present = filteredRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const late = filteredRecords.filter(r => r.status === 'late').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;
    
    const totalWorkMinutes = filteredRecords.reduce((sum, r) => sum + (r.work_duration_minutes || 0), 0);
    const totalWorkHours = totalWorkMinutes / 60;
    const avgHours = filteredRecords.length > 0 ? totalWorkMinutes / filteredRecords.length / 60 : 0;

    const uniqueMembers = new Set(
      filteredRecords.filter(r => r.actual_check_in).map(r => r.member_name)
    );

    setStats({
      totalPresent: present,
      totalLate: late,
      totalAbsent: absent,
      onTimeRate: present > 0 ? ((present - late) / present) * 100 : 0,
      avgWorkHours: avgHours,
      totalWorkHoursToday: totalWorkHours,
      activeMembers: uniqueMembers.size,
    });
  }, [filteredRecords]);

  // Get filter period label and chart data
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

  // Dynamic chart data based on filter
  const chartData = useMemo(() => {
    const isToday = dateRange.preset === 'today';
    
    if (isToday) {
      // Hourly data for today
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const hourlyMap: Record<number, { present: number; late: number; absent: number }> = {};
      
      hours.forEach(hour => {
        hourlyMap[hour] = { present: 0, late: 0, absent: 0 };
      });
      
      filteredRecords.forEach(record => {
        if (record.actual_check_in) {
          const checkInDate = new Date(record.actual_check_in);
          const hour = checkInDate.getHours();
          
          if (hourlyMap[hour]) {
            if (record.status === 'present') hourlyMap[hour].present++;
            else if (record.status === 'late') hourlyMap[hour].late++;
            else if (record.status === 'absent') hourlyMap[hour].absent++;
          }
        }
      });
      
      return hours.map(hour => ({
        label: `${hour.toString().padStart(2, '0')}:00`,
        present: hourlyMap[hour]?.present || 0,
        late: hourlyMap[hour]?.late || 0,
        absent: hourlyMap[hour]?.absent || 0,
      }));
    } else {
      // Daily data for other periods
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
        label: day,
        present: daysMap[day]?.present || 0,
        late: daysMap[day]?.late || 0,
        absent: daysMap[day]?.absent || 0,
      }));
    }
  }, [filteredRecords, dateRange.preset]);

  // Status distribution
  const statusData = useMemo(() => [
    { name: 'Present', value: stats.totalPresent, color: COLORS.success },
    { name: 'Late', value: stats.totalLate, color: COLORS.warning },
    { name: 'Absent', value: stats.totalAbsent, color: COLORS.danger },
  ].filter(item => item.value > 0), [stats]);

  // Top performers
  const topPerformers = useMemo(() => {
    const memberStats = new Map<string, { name: string; workHours: number; avatar: string | null }>();
    
    filteredRecords.forEach(record => {
      const existing = memberStats.get(record.member_name);
      const hours = (record.work_duration_minutes || 0) / 60;
      
      if (existing) {
        existing.workHours += hours;
      } else {
        memberStats.set(record.member_name, {
          name: record.member_name,
          workHours: hours,
          avatar: record.profile_photo_url,
        });
      }
    });
    
    return Array.from(memberStats.values())
      .sort((a, b) => b.workHours - a.workHours)
      .slice(0, 5);
  }, [filteredRecords]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(currentTime, 'EEEE, MMMM dd, yyyy • HH:mm:ss')}
          </p>
        </div>
        
        <DateFilterBar 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EnhancedStatCard
          title="Total Work Hours"
          value={`${stats.totalWorkHoursToday.toFixed(1)}h`}
          icon={Clock}
          trend="up"
          trendValue="+12%"
          trendLabel="from last period"
          color="blue"
          delay={0}
        />
        <EnhancedStatCard
          title="Active Members"
          value={stats.activeMembers}
          icon={Users}
          trend="up"
          trendValue="+5"
          trendLabel="new this week"
          color="green"
          delay={0.1}
        />
        <EnhancedStatCard
          title="On-Time Rate"
          value={`${stats.onTimeRate.toFixed(0)}%`}
          icon={CheckCircle2}
          trend="up"
          trendValue="+8%"
          trendLabel="improvement"
          color="purple"
          delay={0.2}
        />
        <EnhancedStatCard
          title="Avg Hours/Member"
          value={`${stats.avgWorkHours.toFixed(1)}h`}
          icon={Activity}
          trend="neutral"
          trendValue="0%"
          trendLabel="no change"
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4"
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {dateRange.preset === 'today' ? 'Hourly Attendance' : 'Attendance Trend'}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {dateRange.preset === 'today' 
                      ? 'Check-in patterns throughout the day' 
                      : `Attendance patterns for ${getFilterLabel().toLowerCase()}`
                    }
                  </CardDescription>
                </div>
                <Badge variant="outline">{getFilterLabel()}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    dataKey="label" 
                    stroke="currentColor" 
                    opacity={0.5} 
                    fontSize={12}
                    angle={dateRange.preset === 'today' ? -45 : 0}
                    textAnchor={dateRange.preset === 'today' ? 'end' : 'middle'}
                    height={dateRange.preset === 'today' ? 60 : 30}
                  />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={12} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="present" stroke={COLORS.success} fillOpacity={1} fill="url(#colorPresent)" />
                  <Area type="monotone" dataKey="late" stroke={COLORS.warning} fillOpacity={1} fill="url(#colorLate)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-3"
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Status Distribution</CardTitle>
              <CardDescription className="text-muted-foreground">Breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
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
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {statusData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-foreground">{item.name}</span>
                        </div>
                        <span className="font-semibold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Top Performers
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Members with highest work hours for {getFilterLabel().toLowerCase()}
                </CardDescription>
              </div>
              <Badge variant="outline">{getFilterLabel()}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {topPerformers.map((member, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className="flex flex-col items-center p-4 rounded-lg border border-border bg-card hover:shadow-md hover:border-primary/50 transition-all"
                  >
                    <div className="relative mb-3">
                      <Avatar className="w-16 h-16 border-2 border-border">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {idx === 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 dark:bg-yellow-400 rounded-full flex items-center justify-center text-xs shadow-lg">
                          🏆
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-center mb-1 line-clamp-2 text-foreground">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="font-bold text-primary">
                        {member.workHours.toFixed(1)}h
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={UserCheck}
                title="No performance data yet"
                description={`No attendance records found for ${getFilterLabel().toLowerCase()}. Check back after members start checking in.`}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Timeline & Live Attendance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <ActivityTimeline limit={10} autoRefresh={true} />
        </motion.div>

        {/* Live Attendance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-1"
        >
          <LiveAttendanceTable 
            autoRefresh={true} 
            refreshInterval={60000}
            pageSize={5}
          />
        </motion.div>
      </div>
    </div>
  );
}
