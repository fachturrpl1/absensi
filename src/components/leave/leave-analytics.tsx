"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ILeaveRequest } from "@/lib/leave/types";
import { parseISO, format, subDays, subMonths, subYears, startOfYear, endOfYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Area, AreaChart, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface LeaveAnalyticsProps {
  requests: ILeaveRequest[];
  type: 'status' | 'monthly' | 'type' | 'department' | 'detailed';
  loading?: boolean;
  periodFilter?: '7days' | '1week' | 'thisweek' | '30days' | '1month' | 'thismonth' | 'lastyear' | 'thisyear';
  statistics?: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalEmployees: number;
    employeesOnLeave: number;
    upcomingLeaves: number;
    averageLeaveDays: number;
  } | null;
}

export function LeaveAnalytics({ 
  requests, 
  type, 
  loading = false,
  periodFilter = 'thisyear',
  statistics 
}: LeaveAnalyticsProps) {
  
  // Filter requests based on period
  const filteredRequests = useMemo(() => {
    if (type !== 'monthly') return requests;
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    
    switch (periodFilter) {
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '1week':
        startDate = subDays(now, 7);
        break;
      case 'thisweek':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      case '1month':
        startDate = subMonths(now, 1);
        break;
      case 'thismonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'lastyear':
        startDate = subYears(now, 1);
        break;
      case 'thisyear':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfYear(now);
    }
    
    return requests.filter(r => {
      const requestDate = parseISO(r.requested_at);
      return isWithinInterval(requestDate, { start: startDate, end: endDate });
    });
  }, [requests, periodFilter, type]);
  
  // Status Distribution
  const statusData = useMemo(() => {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    };
    
    requests.forEach(r => {
      if (r.status in counts) {
        counts[r.status as keyof typeof counts]++;
      }
    });
    
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
    
    return [
      { 
        label: 'Pending', 
        count: counts.pending, 
        percentage: total > 0 ? (counts.pending / total * 100).toFixed(1) : '0',
        color: 'hsl(38 92% 50%)', // Orange - better visibility in dark mode
        darkColor: 'hsl(38 92% 60%)'
      },
      { 
        label: 'Approved', 
        count: counts.approved, 
        percentage: total > 0 ? (counts.approved / total * 100).toFixed(1) : '0',
        color: 'hsl(142.1 76.2% 36.3%)', // Green
        darkColor: 'hsl(142.1 76.2% 50%)'
      },
      { 
        label: 'Rejected', 
        count: counts.rejected, 
        percentage: total > 0 ? (counts.rejected / total * 100).toFixed(1) : '0',
        color: 'hsl(0 84.2% 60.2%)', // Red
        darkColor: 'hsl(0 84.2% 70%)'
      },
      { 
        label: 'Cancelled', 
        count: counts.cancelled, 
        percentage: total > 0 ? (counts.cancelled / total * 100).toFixed(1) : '0',
        color: 'hsl(215 16% 47%)', // Gray
        darkColor: 'hsl(215 16% 65%)'
      }
    ];
  }, [requests]);

  // Monthly Trend with status breakdown
  const monthlyData = useMemo(() => {
    if (type !== 'monthly') return [];
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let dateFormat = 'MMM yyyy';
    
    // Determine date range and format based on period filter
    switch (periodFilter) {
      case '7days':
      case '1week':
        startDate = subDays(now, 6); // Last 7 days including today
        dateFormat = 'EEE, MMM d';
        break;
      case 'thisweek':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
        dateFormat = 'EEE, MMM d';
        break;
      case '30days':
        startDate = subDays(now, 29); // Last 30 days including today
        dateFormat = 'MMM d';
        break;
      case '1month':
        startDate = subMonths(now, 1);
        dateFormat = 'MMM d';
        break;
      case 'thismonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        dateFormat = 'MMM d';
        break;
      case 'lastyear':
        startDate = subYears(now, 1);
        dateFormat = 'MMM yyyy';
        break;
      case 'thisyear':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        dateFormat = 'MMM yyyy';
        break;
      default:
        startDate = startOfYear(now);
        dateFormat = 'MMM yyyy';
    }
    
    // Generate all dates in range
    const allDates: Date[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      allDates.push(new Date(currentDate));
      
      // Increment based on format
      if (dateFormat.includes('EEE') || dateFormat === 'MMM d') {
        currentDate = subDays(currentDate, -1); // Add 1 day
      } else {
        currentDate = subMonths(currentDate, -1); // Add 1 month
      }
    }
    
    // Count requests by date and status
    const dateCounts: Record<string, { approved: number; rejected: number; pending: number; cancelled: number }> = {};
    
    filteredRequests.forEach(r => {
      const requestDate = parseISO(r.requested_at);
      const dateLabel = format(requestDate, dateFormat);
      
      if (!dateCounts[dateLabel]) {
        dateCounts[dateLabel] = { approved: 0, rejected: 0, pending: 0, cancelled: 0 };
      }
      
      if (r.status === 'approved') {
        dateCounts[dateLabel].approved += 1;
      } else if (r.status === 'rejected') {
        dateCounts[dateLabel].rejected += 1;
      } else if (r.status === 'pending') {
        dateCounts[dateLabel].pending += 1;
      } else if (r.status === 'cancelled') {
        dateCounts[dateLabel].cancelled += 1;
      }
    });
    
    // Map all dates to data points (including 0 counts)
    return allDates.map(date => {
      const dateLabel = format(date, dateFormat);
      const counts = dateCounts[dateLabel] || { approved: 0, rejected: 0, pending: 0, cancelled: 0 };
      return {
        month: dateLabel,
        approved: counts.approved,
        rejected: counts.rejected,
        pending: counts.pending,
        cancelled: counts.cancelled,
        total: counts.approved + counts.rejected + counts.pending + counts.cancelled
      };
    });
  }, [filteredRequests, type, periodFilter]);

  // Leave Type Distribution
  const typeData = useMemo(() => {
    const typeCounts: Record<string, { count: number; color: string; name: string }> = {};
    
    requests.forEach(r => {
      if (r.leave_type) {
        const key = r.leave_type.code;
        if (!typeCounts[key]) {
          typeCounts[key] = {
            count: 0,
            color: r.leave_type.color_code || '#10B981',
            name: r.leave_type.name
          };
        }
        typeCounts[key].count++;
      }
    });
    
    const total = Object.values(typeCounts).reduce((sum, val) => sum + val.count, 0);
    
    return Object.entries(typeCounts)
      .map(([code, data]) => ({
        code,
        name: data.name,
        count: data.count,
        percentage: total > 0 ? (data.count / total * 100).toFixed(1) : '0',
        color: data.color
      }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  // Department Distribution
  const departmentData = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    
    requests.forEach(r => {
      if (r.organization_member?.departments) {
        const dept = r.organization_member.departments.name;
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      }
    });
    
    const total = Object.values(deptCounts).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(deptCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Status Distribution Chart
  if (type === 'status') {
    const hasData = requests.length > 0;
    
    if (!hasData) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-3 bg-muted rounded-full mb-3">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">No data available</p>
          <p className="text-xs text-muted-foreground mt-1">Create a leave request to see statistics</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {statusData.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded ${
                    item.label === 'Pending' ? 'bg-orange-500 dark:bg-orange-400' :
                    item.label === 'Approved' ? 'bg-green-600 dark:bg-green-500' :
                    item.label === 'Rejected' ? 'bg-red-500 dark:bg-red-400' :
                    'bg-gray-500 dark:bg-gray-400'
                  }`}
                />
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{item.count}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  item.label === 'Pending' ? 'bg-orange-500 dark:bg-orange-400' :
                  item.label === 'Approved' ? 'bg-green-600 dark:bg-green-500' :
                  item.label === 'Rejected' ? 'bg-red-500 dark:bg-red-400' :
                  'bg-gray-500 dark:bg-gray-400'
                }`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Monthly Trend Chart
  if (type === 'monthly') {
    if (monthlyData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-3 bg-muted rounded-full mb-3">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">No data available</p>
          <p className="text-xs text-muted-foreground mt-1">Leave trends will appear here once requests are made</p>
        </div>
      );
    }
    
    // Calculate max value for Y-axis
    const maxValue = Math.max(...monthlyData.map(d => d.total), 0);
    const yAxisMax = maxValue > 10 ? Math.ceil(maxValue / 10) * 10 : 10;
    
    // Chart config for shadcn with 4 status lines
    const chartConfig = {
      approved: {
        label: "Approved",
        color: "hsl(142.1 76.2% 36.3%)", // Green
      },
      rejected: {
        label: "Rejected",
        color: "hsl(0 84.2% 60.2%)", // Red
      },
      pending: {
        label: "Pending",
        color: "hsl(38 92% 50%)", // Orange/Amber
      },
      cancelled: {
        label: "Cancelled",
        color: "hsl(215 16% 47%)", // Gray
      },
    };
    
    return (
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillApproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillRejected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0 84.2% 60.2%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(0 84.2% 60.2%)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillCancelled" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(215 16% 47%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(215 16% 47%)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false}
            className="stroke-muted"
          />
          <XAxis 
            dataKey="month" 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            domain={[0, yAxisMax]}
            ticks={Array.from({ length: Math.min(yAxisMax, 10) + 1 }, (_, i) => i)}
            allowDecimals={false}
          />
          <ChartTooltip 
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area 
            type="monotone" 
            dataKey="approved" 
            stroke="hsl(142.1 76.2% 36.3%)" 
            strokeWidth={2}
            fill="url(#fillApproved)"
            fillOpacity={1}
            connectNulls={true}
            isAnimationActive={true}
            animationDuration={800}
          />
          <Area 
            type="monotone" 
            dataKey="rejected" 
            stroke="hsl(0 84.2% 60.2%)" 
            strokeWidth={2}
            fill="url(#fillRejected)"
            fillOpacity={1}
            connectNulls={true}
            isAnimationActive={true}
            animationDuration={1000}
          />
          <Area 
            type="monotone" 
            dataKey="pending" 
            stroke="hsl(38 92% 50%)" 
            strokeWidth={2}
            fill="url(#fillPending)"
            fillOpacity={1}
            connectNulls={true}
            isAnimationActive={true}
            animationDuration={1200}
          />
          <Area 
            type="monotone" 
            dataKey="cancelled" 
            stroke="hsl(215 16% 47%)" 
            strokeWidth={2}
            fill="url(#fillCancelled)"
            fillOpacity={1}
            connectNulls={true}
            isAnimationActive={true}
            animationDuration={1400}
          />
        </AreaChart>
      </ChartContainer>
    );
  }

  // Leave Type Distribution - Donut Chart
  if (type === 'type') {
    if (typeData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-3 bg-muted rounded-full mb-3">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">No data available</p>
          <p className="text-xs text-muted-foreground mt-1">Leave type distribution will appear here</p>
        </div>
      );
    }

    const chartData = typeData.map(item => ({
      name: item.name,
      value: item.count,
      color: item.color
    }));

    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => [`${value} requests`, 'Count']}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="space-y-2">
          {typeData.map((item) => (
            <div key={item.code} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{item.count}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Department Distribution
  if (type === 'department') {
    return (
      <div className="space-y-4">
        {departmentData.map((item) => (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{item.count}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
        {departmentData.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No department data available
          </p>
        )}
      </div>
    );
  }

  // Detailed Analytics - Donut Chart
  if (type === 'detailed' && statistics) {
    const approvalRate = statistics.totalRequests > 0 
      ? Number(((statistics.approvedRequests / statistics.totalRequests) * 100).toFixed(1))
      : 0;
    const rejectionRate = statistics.totalRequests > 0 
      ? Number(((statistics.rejectedRequests / statistics.totalRequests) * 100).toFixed(1))
      : 0;
    const pendingRate = statistics.totalRequests > 0 
      ? Number(((statistics.pendingRequests / statistics.totalRequests) * 100).toFixed(1))
      : 0;
    
    // Calculate cancelled rate (total - approved - rejected - pending)
    const cancelledCount = statistics.totalRequests - statistics.approvedRequests - statistics.rejectedRequests - statistics.pendingRequests;
    const cancelledRate = statistics.totalRequests > 0 
      ? Number(((cancelledCount / statistics.totalRequests) * 100).toFixed(1))
      : 0;

    const chartData = [
      {
        name: "Pending",
        value: statistics.pendingRequests,
        percentage: pendingRate,
        color: "#F59E0B" // Orange
      },
      {
        name: "Approved",
        value: statistics.approvedRequests,
        percentage: approvalRate,
        color: "#10B981" // Green
      },
      {
        name: "Rejected",
        value: statistics.rejectedRequests,
        percentage: rejectionRate,
        color: "#EF4444" // Red
      },
      {
        name: "Cancelled",
        value: cancelledCount,
        percentage: cancelledRate,
        color: "#6B7280" // Gray
      }
    ];

    if (statistics.totalRequests === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-3 bg-muted rounded-full mb-3">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">No data available</p>
          <p className="text-xs text-muted-foreground mt-1">Request statistics will appear here</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number, name: string, props) => {
                const percentage = (props as { payload?: { percentage?: number } })?.payload?.percentage || 0;
                return [`${value} requests (${percentage}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{item.value}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center text-muted-foreground py-8">
      No data available
    </div>
  );
}
