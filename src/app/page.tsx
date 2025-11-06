'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Activity,
  Calendar,
  UserCheck,
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
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';

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

// Modern Color Palette 2025
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  gradient: {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  }
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4">
        <p className="font-semibold text-sm text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ModernDashboard() {
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Date filter state - default to TODAY
  const [dateRange, setDateRange] = useState<DateFilterState>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    console.log('🎯 Initial Date Range (TODAY):', {
      from: today.toISOString(),
      to: endOfToday.toISOString(),
      preset: 'today'
    });
    
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Debug: Watch dateRange changes
  useEffect(() => {
    console.log('🎯 DateRange State Changed:', {
      from: dateRange.from.toISOString().split('T')[0],
      to: dateRange.to.toISOString().split('T')[0],
      preset: dateRange.preset,
      timestamp: new Date().toISOString()
    });
  }, [dateRange]);

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
        setOrganizationId(orgId);

        const { data: attendanceData, error: attendanceError } = await supabase
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

        console.log('🔍 Supabase Query Response:', {
          orgId,
          hasError: !!attendanceError,
          error: attendanceError,
          dataLength: attendanceData?.length || 0,
          sampleData: attendanceData?.slice(0, 2)
        });

        if (attendanceError) {
          console.error('❌ Supabase Query Error:', attendanceError);
          setAllRecords([]);
          return;
        }

        const formattedRecords: AttendanceRecord[] = (attendanceData || []).map((record: any) => {
          try {
            return {
              id: record.id,
              member_name: `${record.organization_members.user_profiles.first_name} ${record.organization_members.user_profiles.last_name}`,
              department_name: record.organization_members.departments?.name || 'N/A',
              status: record.status,
              actual_check_in: record.actual_check_in,
              actual_check_out: record.actual_check_out,
              work_duration_minutes: record.work_duration_minutes,
              attendance_date: record.attendance_date,
              profile_photo_url: record.organization_members.user_profiles.profile_photo_url,
            };
          } catch (err) {
            console.error('❌ Error formatting record:', err, record);
            return null;
          }
        }).filter(Boolean) as AttendanceRecord[];

        console.log('📊 Dashboard Data Fetched:', {
          totalRecords: formattedRecords.length,
          orgId,
          firstRecord: formattedRecords[0],
          dateRange: formattedRecords.length > 0 ? {
            oldest: formattedRecords[formattedRecords.length - 1]?.attendance_date,
            newest: formattedRecords[0]?.attendance_date
          } : null
        });

        setAllRecords(formattedRecords);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply date range filtering - Extract dates for better dependency tracking
  const fromDateStr = dateRange.from.toISOString().split('T')[0];
  const toDateStr = dateRange.to.toISOString().split('T')[0];
  
  const filteredRecords = useMemo(() => {
    if (allRecords.length === 0) {
      console.log('⚠️ No records to filter - allRecords is empty');
      return [];
    }

    // Create fresh date objects from the string values
    const fromDate = new Date(fromDateStr + 'T00:00:00');
    const toDate = new Date(toDateStr + 'T23:59:59.999');
    
    console.log('🔍 Starting Filter:', {
      totalRecords: allRecords.length,
      dateRange: { from: fromDateStr, to: toDateStr, preset: dateRange.preset },
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
      sampleRecordDates: allRecords.slice(0, 5).map(r => r.attendance_date)
    });
    
    const filtered = allRecords.filter(record => {
      // Parse date string (format: YYYY-MM-DD) with explicit time
      const recordDate = new Date(record.attendance_date + 'T00:00:00');
      const isInRange = recordDate >= fromDate && recordDate <= toDate;
      
      if (allRecords.indexOf(record) < 3) {
        console.log('🔍 Filter check:', {
          date: record.attendance_date,
          recordDate: recordDate.toISOString(),
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
          isInRange,
          comparison: {
            afterFrom: recordDate >= fromDate,
            beforeTo: recordDate <= toDate
          }
        });
      }
      
      return isInRange;
    });

    console.log('✅ Filter Complete:', {
      filteredCount: filtered.length,
      percentage: ((filtered.length / allRecords.length) * 100).toFixed(1) + '%',
      sampleFiltered: filtered.slice(0, 3).map(r => ({
        name: r.member_name,
        date: r.attendance_date,
        status: r.status
      }))
    });

    return filtered;
  }, [allRecords, fromDateStr, toDateStr, dateRange.preset]);

  // Get chart title based on date filter preset
  const getChartTitle = () => {
    switch (dateRange.preset) {
      case 'today':
        return 'Today Data';
      case 'yesterday':
        return 'Yesterday Data';
      case 'last7':
        return 'Last 7 Days';
      case 'last30':
        return 'Last 30 Days';
      case 'thisMonth':
        return 'This Month';
      case 'lastMonth':
        return 'Last Month';
      case 'custom':
        return 'Custom Range';
      default:
        return 'Attendance Data';
    }
  };

  // Get chart subtitle based on date filter
  const getChartSubtitle = () => {
    switch (dateRange.preset) {
      case 'today':
        return 'Real-time attendance for today';
      case 'yesterday':
        return 'Attendance data from yesterday';
      case 'last7':
        return 'Weekly attendance trend';
      case 'last30':
        return 'Monthly attendance trend';
      case 'thisMonth':
        return 'Current month overview';
      case 'lastMonth':
        return 'Previous month overview';
      case 'custom':
        return 'Custom date range analysis';
      default:
        return 'Attendance statistics';
    }
  };

  // Recalculate stats from filtered data
  useEffect(() => {
    setRecords(filteredRecords);

    const present = filteredRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const late = filteredRecords.filter(r => r.status === 'late').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;
    
    const totalWorkMinutes = filteredRecords.reduce((sum, r) => sum + (r.work_duration_minutes || 0), 0);
    const totalWorkHours = totalWorkMinutes / 60;
    const avgHours = filteredRecords.length > 0 ? totalWorkMinutes / filteredRecords.length / 60 : 0;

    const uniqueMembers = new Set(
      filteredRecords
        .filter(r => r.actual_check_in)
        .map(r => r.member_name)
    );
    const activeMembers = uniqueMembers.size;

    const newStats = {
      totalPresent: present,
      totalLate: late,
      totalAbsent: absent,
      onTimeRate: present > 0 ? ((present - late) / present) * 100 : 0,
      avgWorkHours: avgHours,
      totalWorkHoursToday: totalWorkHours,
      activeMembers: activeMembers,
    };

    console.log('📈 Stats Calculated:', newStats);

    setStats(newStats);
  }, [filteredRecords]);

  // Generate weekly data
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
    
    const result = days.map(day => ({
      day,
      present: daysMap[day]?.present || 0,
      late: daysMap[day]?.late || 0,
      absent: daysMap[day]?.absent || 0,
    }));

    console.log('📊 Weekly Data Generated:', result);

    return result;
  }, [filteredRecords]);

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
    
    const result = Array.from(memberStats.values())
      .sort((a, b) => b.workHours - a.workHours)
      .slice(0, 5);

    console.log('🏆 Top Performers:', result);

    return result;
  }, [filteredRecords]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header Section - Compact */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {format(currentTime, 'EEEE, MMMM dd, yyyy • HH:mm:ss')}
            </p>
          </div>
          
          <DateFilterBar 
            dateRange={dateRange} 
            onDateRangeChange={(newRange) => {
              console.log('🔄 DateFilterBar callback triggered:', {
                old: {
                  from: dateRange.from.toISOString().split('T')[0],
                  to: dateRange.to.toISOString().split('T')[0],
                  preset: dateRange.preset
                },
                new: {
                  from: newRange.from.toISOString().split('T')[0],
                  to: newRange.to.toISOString().split('T')[0],
                  preset: newRange.preset
                }
              });
              setDateRange(newRange);
            }}
            className="w-full md:w-auto"
          />
        </motion.div>

        {/* Stats Cards - Perfect Grid, No Gaps, Equal Height */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1 - Total Work Hours */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-blue-500 to-blue-600">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-blue-100 text-sm font-medium mb-2">Total Work Hours</p>
                    <h3 className="text-3xl font-bold text-white mb-1">
                      {stats.totalWorkHoursToday.toFixed(1)}<span className="text-xl ml-1">hrs</span>
                    </h3>
                    <p className="text-blue-200 text-xs flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {stats.activeMembers} active members
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2 - Total Present */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-green-500 to-green-600">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-green-100 text-sm font-medium mb-2">Total Present</p>
                    <h3 className="text-3xl font-bold text-white mb-1">{stats.totalPresent}</h3>
                    <p className="text-green-200 text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stats.onTimeRate.toFixed(1)}% on time
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3 - Late Check-in */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-orange-500 to-orange-600">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-orange-100 text-sm font-medium mb-2">Late Check-in</p>
                    <h3 className="text-3xl font-bold text-white mb-1">{stats.totalLate}</h3>
                    <p className="text-orange-200 text-xs">Need attention</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 4 - Avg Work Hours */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full bg-gradient-to-br from-purple-500 to-purple-600">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-purple-100 text-sm font-medium mb-2">Avg Work Hours</p>
                    <h3 className="text-3xl font-bold text-white mb-1">
                      {stats.avgWorkHours.toFixed(1)}<span className="text-xl">h</span>
                    </h3>
                    <p className="text-purple-200 text-xs">Per employee</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* Charts Section - 2 Column Grid, No Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Weekly Trend - Takes 2 columns */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-md h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      {getChartTitle()}
                    </CardTitle>
                    <CardDescription>{getChartSubtitle()}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {dateRange.preset === 'today' ? 'Today' 
                      : dateRange.preset === 'yesterday' ? 'Yesterday'
                      : dateRange.preset === 'last7' ? 'Last 7 Days'
                      : dateRange.preset === 'last30' ? 'Last 30 Days'
                      : dateRange.preset === 'thisMonth' ? 'This Month'
                      : dateRange.preset === 'lastMonth' ? 'Last Month'
                      : 'Custom'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <RechartsTooltip 
                      content={<CustomTooltip />}
                      wrapperStyle={{ 
                        zIndex: 9999,
                        pointerEvents: 'none',
                        outline: 'none',
                      }}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      isAnimationActive={false}
                    />
                    <Legend />
                    <Bar dataKey="present" name="Present" fill={COLORS.success} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="late" name="Late" fill={COLORS.warning} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="absent" name="Absent" fill={COLORS.danger} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Distribution - Takes 1 column */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 shadow-md h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Status Distribution
                </CardTitle>
                <CardDescription>
                  {dateRange.preset === 'today' 
                    ? 'Today\'s breakdown' 
                    : dateRange.preset === 'last7'
                    ? 'Weekly breakdown'
                    : dateRange.preset === 'last30'
                    ? 'Monthly breakdown'
                    : 'Breakdown by status'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
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
                        }}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '10px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                        isAnimationActive={false}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-gray-400">
                    <p className="text-sm">No data available</p>
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  {statusData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* Top Performers Section */}
        {topPerformers.length > 0 && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.7 }}
          >
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-amber-600" />
                      Top Performers
                    </CardTitle>
                    <CardDescription>
                      {dateRange.preset === 'today' 
                        ? 'Highest hours today' 
                        : dateRange.preset === 'last7'
                        ? 'Top contributors this week'
                        : dateRange.preset === 'last30'
                        ? 'Top contributors this month'
                        : 'Members with highest work hours'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                    Top 5
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {topPerformers.map((member, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + idx * 0.1 }}
                      className="flex flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-blue-500">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">1</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white text-center line-clamp-1">
                        {member.name}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {member.workHours.toFixed(1)}h
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>
    </div>
  );
}
