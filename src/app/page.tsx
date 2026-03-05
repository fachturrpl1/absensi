'use client';

import { useOrgStore } from '@/store/org-store'
import { useHydration } from '@/hooks/useHydration'
import { useEffect, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import type { TooltipProps } from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Users,
  CheckCircle2,
  BarChart3,
  Activity,
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
import { DateFilterBar } from '@/components/attendance/dashboard/date-filter-bar';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { LiveAttendanceTable } from '@/components/dashboard/live-attendance-table';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload?.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (entry as any)?.color }} />
            <span className="text-muted-foreground">{entry?.name}:</span>
            <span className="font-bold">{entry?.value as number}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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
  icon: ComponentType<SVGProps<SVGSVGElement>>;
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

export default function DashboardPage() {
  const orgStore = useOrgStore();
  const queryClient = useQueryClient();
  const { isHydrated, organizationId: hydratedOrgId } = useHydration();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);

  const orgId = hydratedOrgId ?? orgStore.organizationId
  const {
    stats,
    chartData,
    statusData,
    dateRange,
    isLoading,
    setDateRange,
  } = useDashboardData(orgId, isHydrated)

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor organization changes
  useEffect(() => {
    if (orgStore.organizationId && isClient) {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  }, [orgStore.organizationId, queryClient, isClient]);

  // Get filter period label and chart data
  const getFilterLabel = () => {
    const labels: Record<string, string> = {
      'today': 'Today',
      'last7': 'Last 7 Days',
      'last30': 'Last 30 Days',
      'thisYear': 'This Year',
      'lastYear': 'Last Year',
    };

    return labels[dateRange.preset as keyof typeof labels] || 'Custom Range';
  };

  if (!isHydrated || !isClient || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="ml-5 mt-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center   md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard{orgStore.organizationName && ` - ${orgStore.organizationName}`}
          </h1>
          {isClient && currentTime && (
            <p className="text-muted-foreground text-sm mt-1">
              {format(currentTime, 'EEEE, MMMM dd, yyyy • HH:mm:ss')}
            </p>
          )}
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
                    {dateRange.preset === 'today'
                      ? 'Hourly Attendance'
                      : (dateRange.preset === 'thisYear' || dateRange.preset === 'lastYear')
                        ? 'Monthly Attendance'
                        : 'Attendance Trend'
                    }
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {dateRange.preset === 'today'
                      ? 'Check-in patterns throughout the day'
                      : (dateRange.preset === 'thisYear' || dateRange.preset === 'lastYear')
                        ? `Monthly attendance patterns for ${getFilterLabel().toLowerCase()}`
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
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
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
                  <YAxis
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    stroke="currentColor"
                    opacity={0.5}
                    fontSize={12}
                    tickFormatter={(value) => Math.floor(value).toString()}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={0}
                  />
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
