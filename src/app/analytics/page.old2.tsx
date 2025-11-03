'use client';

/**
 * 🔥 ANALYTICS PAGE WITH COMPREHENSIVE FILTERS
 * 
 * This is a simplified example showing how to integrate the filter system.
 * Copy the relevant parts to your actual analytics/page.tsx
 */

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/utils/supabase/client';
import { format, subDays } from 'date-fns';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPageWithFilters() {
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  
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

  // 🎯 STEP 3: Fetch All Data (once)
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

        // Fetch ALL records (no date filter - we'll filter client-side)
        const { data: records } = await supabase
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
          .order('attendance_date', { ascending: false });

        setAllRecords(records || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply date range filtering
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

  // 🎯 STEP 5: Calculate Metrics from Filtered Data
  const metrics = useMemo(() => {
    const totalRecords = filteredRecords.length;
    if (totalRecords === 0) {
      return {
        productivityScore: 0,
        effectiveHours: 0,
        utilizationRate: 0,
        punctualityIndex: 0,
      };
    }

    const totalWorkMinutes = filteredRecords.reduce((sum, r) => sum + (r.work_duration_minutes || 0), 0);
    const totalScheduledMinutes = totalRecords * 8 * 60;
    const onTimeRecords = filteredRecords.filter(r => (r.late_minutes || 0) === 0).length;
    const effectiveMinutes = filteredRecords.reduce((sum, r) => {
      const work = r.work_duration_minutes || 0;
      const late = r.late_minutes || 0;
      return sum + Math.max(0, work - late);
    }, 0);

    const attendanceRate = (filteredRecords.filter(r => r.status === 'present' || r.status === 'late').length / totalRecords) * 100;
    const punctualityRate = (onTimeRecords / totalRecords) * 100;
    const efficiencyRate = (totalWorkMinutes / totalScheduledMinutes) * 100;
    const productivityScore = Math.round((attendanceRate * 0.4) + (punctualityRate * 0.3) + (efficiencyRate * 0.3));

    return {
      productivityScore,
      effectiveHours: effectiveMinutes / 60 / totalRecords,
      utilizationRate: efficiencyRate,
      punctualityIndex: punctualityRate,
    };
  }, [filteredRecords]);

  // Calculate weekly trend from filtered data
  const weeklyTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayRecords = filteredRecords.filter(r => r.attendance_date === dateStr);
      const dayWorkMinutes = dayRecords.reduce((sum, r) => sum + (r.work_duration_minutes || 0), 0);
      const avgHours = dayRecords.length > 0 ? dayWorkMinutes / dayRecords.length / 60 : 0;
      const productivity = dayRecords.length > 0 ? (dayWorkMinutes / (dayRecords.length * 8 * 60)) * 100 : 0;

      return {
        day: format(date, 'EEE'),
        date: format(date, 'MM/dd'),
        productivity: Math.round(productivity),
        hours: Math.round(avgHours * 10) / 10,
        attendance: dayRecords.filter(r => r.status === 'present' || r.status === 'late').length,
      };
    });
    return last7Days;
  }, [filteredRecords]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500/10';
    if (score >= 75) return 'bg-blue-500/10';
    if (score >= 60) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive productivity insights with advanced filtering
          </p>
        </div>
      </motion.div>

      {/* Date Filter */}
      <DateFilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        className="mb-6"
      />

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRecords.length} records {allRecords.length > 0 && `(${Math.round(filteredRecords.length / allRecords.length * 100)}% of total)`}
      </div>

      {/* Hero Metrics - Using Filtered Data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <div className={`absolute inset-0 ${getScoreBg(metrics.productivityScore)}`} />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
              <Target className={`h-4 w-4 ${getScoreColor(metrics.productivityScore)}`} />
            </CardHeader>
            <CardContent className="relative">
              <div className={`text-3xl font-bold ${getScoreColor(metrics.productivityScore)}`}>
                {metrics.productivityScore}%
              </div>
              <Progress value={metrics.productivityScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Based on attendance, punctuality, and efficiency
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Effective Hours</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{metrics.effectiveHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground mt-2">
                Average per day (excluding late time)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-violet-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{metrics.utilizationRate.toFixed(1)}%</div>
              <Progress value={metrics.utilizationRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Time utilization efficiency
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Punctuality Index</CardTitle>
              <Users className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{metrics.punctualityIndex.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-2">
                On-time arrival rate
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Trend Chart - Using Filtered Data */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Productivity Trend</CardTitle>
          <p className="text-sm text-muted-foreground">Performance over the last 7 days (filtered)</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="productivity"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorProductivity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
