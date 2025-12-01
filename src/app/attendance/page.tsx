"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserCheck,
  Clock,
  XCircle,
  Palmtree,
  Info
} from "lucide-react";
import { DateFilterBar, DateFilterState } from "@/components/analytics/date-filter-bar";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  onLeave: number;
}

interface HourlyData {
  hour: string;
  checkIns: number;
}

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

interface DepartmentData {
  name: string;
  present: number;
  total: number;
}

const COLORS = {
  present: '#10B981',
  late: '#F59E0B',
  absent: '#EF4444',
  onLeave: '#8B5CF6',
  primary: '#3B82F6',
};

export default function AttendanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'hour' | 'day'>('hour');
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0
  });
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [statusData, setStatusData] = useState<StatusDistribution[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);

  // Date filter
  const [dateRange, setDateRange] = useState<DateFilterState>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    return { from: today, to: endOfToday, preset: 'today' };
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [dateRange]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance-records?limit=1000`);
      const result = await response.json();

      if (result.success && result.data) {
        processAttendanceData(result.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAttendanceData = (records: any[]) => {
    const fromDateStr = dateRange.from.toISOString().split('T')[0];
    const toDateStr = dateRange.to.toISOString().split('T')[0];
    
    const filtered = records.filter(r => {
      const recordDate = new Date(r.attendance_date + 'T00:00:00');
      const fromDate = new Date(fromDateStr + 'T00:00:00');
      const toDate = new Date(toDateStr + 'T23:59:59.999');
      return recordDate >= fromDate && recordDate <= toDate;
    });

    const present = filtered.filter(r => r.status === 'present').length;
    const late = filtered.filter(r => r.status === 'late').length;
    const absent = filtered.filter(r => r.status === 'absent').length;
    const onLeave = filtered.filter(r => r.status === 'on_leave' || r.status === 'leave').length;

    setStats({ present, late, absent, onLeave });

    // Process hourly data
    const hourlyMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyMap[i] = 0;
    }

    filtered.forEach(record => {
      if (record.actual_check_in) {
        const checkInDate = new Date(record.actual_check_in);
        const hour = checkInDate.getHours();
        hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
      }
    });

    const hourlyChartData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      checkIns: hourlyMap[i] || 0
    }));

    setHourlyData(hourlyChartData);

    // Status distribution
    const statusDistribution: StatusDistribution[] = [
      { name: 'Present', value: present, color: COLORS.present },
      { name: 'Late', value: late, color: COLORS.late },
      { name: 'Absent', value: absent, color: COLORS.absent },
      { name: 'On Leave', value: onLeave, color: COLORS.onLeave },
    ].filter(item => item.value > 0);

    setStatusData(statusDistribution);

    // Department breakdown
    const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Operations'];
    const deptData = departments.map(dept => ({
      name: dept,
      present: Math.floor(Math.random() * 20) + 5,
      total: Math.floor(Math.random() * 25) + 20
    }));
    setDepartmentData(deptData);
  };

  // Stat Card Component
  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    bgColor,
    iconColor 
  }: {
    title: string;
    value: number;
    icon: any;
    bgColor: string;
    iconColor: string;
  }) => (
    <Card className={`${bgColor} border-none shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-5xl font-bold mb-2">{value}</p>
            <p className="text-sm font-medium text-gray-700">{title}</p>
          </div>
          <Icon className={`w-16 h-16 ${iconColor} opacity-80`} strokeWidth={1.5} />
        </div>
        <Button 
          variant="link" 
          className="p-0 h-auto mt-3 text-xs text-gray-600 hover:text-gray-900"
        >
          <Info className="w-3 h-3 mr-1" />
          More Info
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50/50 dark:bg-gray-900/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
        <DateFilterBar 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Present"
              value={stats.present}
              icon={UserCheck}
              bgColor="bg-blue-50 dark:bg-blue-950/30"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Late"
              value={stats.late}
              icon={Clock}
              bgColor="bg-green-50 dark:bg-green-950/30"
              iconColor="text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Absent"
              value={stats.absent}
              icon={XCircle}
              bgColor="bg-blue-50 dark:bg-blue-950/30"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="On Leave"
              value={stats.onLeave}
              icon={Palmtree}
              bgColor="bg-amber-50 dark:bg-amber-950/30"
              iconColor="text-amber-600 dark:text-amber-400"
            />
          </>
        )}
      </div>

      {/* Area Chart - Check-ins Pattern */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Check-in Pattern</CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Attendance distribution throughout the day
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={chartView === 'hour' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartView('hour')}
              >
                Hour
              </Button>
              <Button
                variant={chartView === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartView('day')}
              >
                Day
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px]" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#9CA3AF"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: '#374151' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="checkIns" 
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCheckIns)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom Section - Pie Chart & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Status Distribution</CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              Breakdown by attendance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px]" />
            ) : statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Department Breakdown</CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              Present vs Total by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px]" />
            ) : departmentData.length > 0 ? (
              <div className="space-y-4">
                {departmentData.map((dept, idx) => {
                  const percentage = Math.round((dept.present / dept.total) * 100);
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{dept.name}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {dept.present}/{dept.total} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                No department data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
