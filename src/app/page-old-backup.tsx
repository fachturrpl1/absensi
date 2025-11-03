'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Clock,
  Users,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  BarChart3,
  Trophy,
} from 'lucide-react';
import {
  BarChart,
  Bar,
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
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';

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
  totalWorkHoursToday: number; // Total work hours from filtered date range
  activeMembers: number; // Members who checked in within date range
}

// Color palette based on research
const COLORS = {
  primary: ['#3B82F6', '#2563EB', '#1D4ED8'],
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CommandCenterDashboard() {
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    onTimeRate: 0,
    avgWorkHours: 0,
    totalWorkHoursToday: 0,
    activeMembers: 0,
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);

  // Date filter state (default: Today)
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

  const supabase = useMemo(() => createClient(), []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live members duration update removed - using Presence instead

  // Fetch organization and setup presence
  useEffect(() => {
    const fetchOrganization = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          user_profiles!inner(
            first_name,
            last_name,
            profile_photo_url
          ),
          departments:departments!organization_members_department_id_fkey(name)
        `)
        .eq('user_id', user.id)
        .single();

      if (orgMember) {
        setOrganizationId(orgMember.organization_id.toString());
        setCurrentUser({
          id: user.id,
          name: `${orgMember.user_profiles.first_name} ${orgMember.user_profiles.last_name}`,
          avatar: orgMember.user_profiles.profile_photo_url,
          department: orgMember.departments?.name || 'N/A'
        });
      }
    };
    fetchOrganization();
  }, []);

  // Presence tracking removed - replaced with Top Performers feature

  // Fetch dashboard data
  useEffect(() => {
    if (!organizationId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch attendance records (last 30 days for filtering)
        const { data: allAttendanceRecords, error } = await supabase
          .from('attendance_records')
          .select(`
            id,
            status,
            actual_check_in,
            actual_check_out,
            work_duration_minutes,
            attendance_date,
            organization_members!inner(
              id,
              user_id,
              departments:departments!organization_members_department_id_fkey(id, name),
              user_profiles!inner(
                first_name,
                last_name,
                profile_photo_url
              )
            )
          `)
          .eq('organization_members.organization_id', organizationId)
          .gte('attendance_date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
          .order('attendance_date', { ascending: false })
          .order('actual_check_in', { ascending: false });

        if (error) throw error;

        const formattedRecords: AttendanceRecord[] = (allAttendanceRecords || []).map((record: any) => ({
          id: record.id,
          member_name: `${record.organization_members.user_profiles.first_name} ${record.organization_members.user_profiles.last_name}`,
          department_name: record.organization_members.departments?.name || 'N/A',
          status: record.status,
          actual_check_in: record.actual_check_in,
          actual_check_out: record.actual_check_out,
          work_duration_minutes: record.work_duration_minutes,
          attendance_date: record.attendance_date,
          profile_photo_url: record.organization_members.user_profiles.profile_photo_url,
        }));

        setAllRecords(formattedRecords);

        // Initial stats will be updated by filteredRecords effect

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // No auto-refresh, only fetch when page loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // Apply date range filtering
  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      const recordDate = new Date(record.attendance_date);
      // Set time to start of day for accurate comparison
      recordDate.setHours(0, 0, 0, 0);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      return recordDate >= fromDate && recordDate <= toDate;
    });
  }, [allRecords, dateRange]);

  // Recalculate stats from filtered data
  useEffect(() => {
    // Use filtered records directly (based on selected date range)
    setRecords(filteredRecords);

    const present = filteredRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const late = filteredRecords.filter(r => r.status === 'late').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;
    const leave = filteredRecords.filter(r => r.status === 'leave').length;
    
    // Total work hours in filtered date range (in minutes)
    const totalWorkMinutes = filteredRecords.reduce((sum, r) => sum + (r.work_duration_minutes || 0), 0);
    const totalWorkHours = totalWorkMinutes / 60; // Convert to hours
    const avgHours = filteredRecords.length > 0 ? totalWorkMinutes / filteredRecords.length / 60 : 0;

    // Active members: unique members who checked in within filtered date range
    const uniqueMembers = new Set(
      filteredRecords
        .filter(r => r.actual_check_in)
        .map(r => r.member_name)
    );
    const activeMembers = uniqueMembers.size;

    setStats(prev => ({
      ...prev,
      totalPresent: present,
      totalLate: late,
      totalAbsent: absent,
      onTimeRate: present > 0 ? ((present - late) / present) * 100 : 0,
      avgWorkHours: avgHours,
      totalWorkHoursToday: totalWorkHours,
      activeMembers: activeMembers,
    }));
  }, [filteredRecords]);

  // Generate weekly data from filtered records
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysMap: Record<string, { present: number; late: number; absent: number }> = {};
    
    // Initialize
    days.forEach(day => {
      daysMap[day] = { present: 0, late: 0, absent: 0 };
    });
    
    // Count from filtered records
    filteredRecords.forEach(record => {
      const date = new Date(record.attendance_date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[date.getDay()];
      
      if (daysMap[dayName]) {
        if (record.status === 'present') daysMap[dayName].present++;
        else if (record.status === 'late') daysMap[dayName].late++;
        else if (record.status === 'absent') daysMap[dayName].absent++;
      }
    });
    
    return days.map(day => ({
      day,
      present: daysMap[day].present,
      late: daysMap[day].late,
      absent: daysMap[day].absent,
    }));
  }, [filteredRecords]);

  // Department comparison data from filtered records
  const deptData = useMemo(() => {
    const depts = filteredRecords.reduce((acc, r) => {
      if (!acc[r.department_name]) {
        acc[r.department_name] = { present: 0, total: 0 };
      }
      acc[r.department_name].total++;
      if (r.status === 'present' || r.status === 'late') {
        acc[r.department_name].present++;
      }
      return acc;
    }, {} as Record<string, { present: number; total: number }>);

    return Object.entries(depts)
      .map(([name, data]) => ({
        name,
        rate: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))
      .slice(0, 5);
  }, [filteredRecords]);

  // Status distribution
  const statusData = useMemo(() => [
    { name: 'Present', value: stats.totalPresent - stats.totalLate, color: COLORS.success },
    { name: 'Late', value: stats.totalLate, color: COLORS.warning },
    { name: 'Absent', value: stats.totalAbsent, color: COLORS.danger },
  ], [stats]);

  // Hourly activity from filtered records
  const hourlyData = useMemo(() => {
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const hourlyMap: Record<string, { checkIn: number; checkOut: number }> = {};
    
    // Initialize
    hours.forEach(hour => {
      hourlyMap[hour] = { checkIn: 0, checkOut: 0 };
    });
    
    // Count from filtered records
    filteredRecords.forEach(record => {
      // Check-in
      if (record.actual_check_in) {
        const checkInTime = new Date(record.actual_check_in);
        const hour = `${checkInTime.getHours().toString().padStart(2, '0')}:00`;
        if (hourlyMap[hour]) {
          hourlyMap[hour].checkIn++;
        }
      }
      
      // Check-out
      if (record.actual_check_out) {
        const checkOutTime = new Date(record.actual_check_out);
        const hour = `${checkOutTime.getHours().toString().padStart(2, '0')}:00`;
        if (hourlyMap[hour]) {
          hourlyMap[hour].checkOut++;
        }
      }
    });
    
    return hours.map(hour => ({
      hour,
      checkIn: hourlyMap[hour].checkIn,
      checkOut: hourlyMap[hour].checkOut,
    }));
  }, [filteredRecords]);



  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {format(currentTime, 'EEEE, MMMM dd, yyyy • HH:mm:ss')}
          </p>
        </div>
      </motion.div>

      {/* Date Filter */}
      <DateFilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        className="mb-6"
      />

      {/* Top Stats - 4 Cards with Equal Height */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="h-full">
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 h-full min-h-[160px]">
            <CardContent className="p-6 h-full flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-blue-100 text-sm font-medium mb-3">Total Work Hours</p>
                  <h3 className="text-4xl font-bold text-white">
                    {stats.totalWorkHoursToday.toFixed(1)}
                    <span className="text-2xl ml-1">hrs</span>
                  </h3>
                  <p className="text-blue-200 text-xs mt-3">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {stats.activeMembers} active members
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="h-full">
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 h-full min-h-[160px]">
            <CardContent className="p-6 h-full flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-100 text-sm font-medium mb-3">Total Present</p>
                  <h3 className="text-4xl font-bold text-white">{stats.totalPresent}</h3>
                  <p className="text-green-200 text-xs mt-3">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {stats.onTimeRate.toFixed(1)}% on time
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }} className="h-full">
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-orange-500 h-full min-h-[160px]">
            <CardContent className="p-6 h-full flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-yellow-100 text-sm font-medium mb-3">Late Check-in</p>
                  <h3 className="text-4xl font-bold text-white">{stats.totalLate}</h3>
                  <p className="text-yellow-200 text-xs mt-3">Need attention</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }} className="h-full">
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-500 to-indigo-600 h-full min-h-[160px]">
            <CardContent className="p-6 h-full flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-purple-100 text-sm font-medium mb-3">Avg Work Hours</p>
                  <h3 className="text-4xl font-bold text-white">{stats.avgWorkHours.toFixed(1)}h</h3>
                  <p className="text-purple-200 text-xs mt-3">Per employee today</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
          </Card>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Attendance Trend */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Weekly Attendance Trend
                </CardTitle>
                <Badge variant="outline" className="bg-blue-50">Last 7 Days</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <RechartsTooltip 
                    content={<CustomTooltip />}
                    wrapperStyle={{ 
                      zIndex: 9999,
                      pointerEvents: 'none',
                      outline: 'none',
                    }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)', strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                  <Bar dataKey="present" name="Present" fill={COLORS.success} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="late" name="Late" fill={COLORS.warning} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill={COLORS.danger} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Today's Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    wrapperStyle={{ 
                      zIndex: 9999,
                      pointerEvents: 'none',
                      outline: 'none',
                    }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '10px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      opacity: 1,
                    }}
                    isAnimationActive={false}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {statusData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Online Members - Real-time Presence */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.7 }}
          className="lg:col-span-1"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  Today's Top Performers
                </CardTitle>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                  <Trophy className="w-3 h-3 mr-1" />
                  Top 5
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[380px] overflow-y-auto">
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No attendance data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const memberStats: Record<string, { name: string; workHours: number; status: string; dept: string }> = {};
                      filteredRecords.forEach(record => {
                        if (!memberStats[record.member_name]) {
                          memberStats[record.member_name] = {
                            name: record.member_name,
                            workHours: 0,
                            status: record.status,
                            dept: record.department_name,
                          };
                        }
                        memberStats[record.member_name].workHours += (record.work_duration_minutes || 0) / 60;
                      });
                      
                      return Object.values(memberStats)
                        .filter(m => m.status === 'present' || m.status === 'late')
                        .sort((a, b) => b.workHours - a.workHours)
                        .slice(0, 5)
                        .map((member, idx) => (
                          <motion.div
                            key={member.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-sm">
                              #{idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{member.name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{member.dept}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-amber-600">{member.workHours.toFixed(1)}h</p>
                              <p className="text-[10px] text-gray-500">work hours</p>
                            </div>
                          </motion.div>
                        ));
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hourly Activity */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-600" />
                Hourly Activity Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorCheckIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.info} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorCheckOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <RechartsTooltip 
                    content={<CustomTooltip />}
                    wrapperStyle={{ 
                      zIndex: 9999,
                      pointerEvents: 'none',
                      outline: 'none',
                    }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)', strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="checkIn"
                    name="Check In"
                    stroke={COLORS.info}
                    fillOpacity={1}
                    fill="url(#colorCheckIn)"
                  />
                  <Area
                    type="monotone"
                    dataKey="checkOut"
                    name="Check Out"
                    stroke={COLORS.purple}
                    fillOpacity={1}
                    fill="url(#colorCheckOut)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Department Performance */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.9 }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-pink-600" />
              Department Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deptData.map((dept, idx) => (
                <motion.div
                  key={dept.name}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1 + idx * 0.1, duration: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{dept.name}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{dept.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dept.rate}%` }}
                      transition={{ delay: 1 + idx * 0.1, duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      style={{
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
