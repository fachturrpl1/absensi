"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ILeaveRequest } from "@/lib/leave/types";
import { parseISO, format, subDays, subMonths, subYears, startOfYear, endOfYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Area, AreaChart, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface LeaveAnalyticsProps {
  requests: ILeaveRequest[];
  type: 'status' | 'monthly' | 'type' | 'department' | 'detailed';
  loading?: boolean;
  periodFilter?: '7days' | '1week' | 'thisweek' | '30days' | '1month' | 'thismonth' | 'lastyear' | 'thisyear';
  chartType?: 'donut' | 'pie' | 'bar';
  statistics?: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalMembers: number;
    membersOnLeave: number;
    upcomingLeaves: number;
    averageLeaveDays: number;
  } | null;
}

export function LeaveAnalytics({ 
  requests, 
  type, 
  loading = false,
  periodFilter = 'thisyear',
  chartType = 'donut',
  statistics 
}: LeaveAnalyticsProps) {
  
  // Filter requests based on period
  const filteredRequests = useMemo(() => {
    if (type !== 'monthly' && type !== 'type') return requests;
    
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
        color: 'hsl(45 93% 58%)', // Yellow/Amber - consistent color
        darkColor: 'hsl(45 93% 68%)'
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
    
    // Use filteredRequests for type distribution when type is 'type'
    const requestsToUse = type === 'type' ? filteredRequests : requests;
    
    requestsToUse.forEach(r => {
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
  }, [requests, filteredRequests, type]);

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

  // Color mapping for consistent colors
  const getColorForName = (name: string): string => {
    const colorMap: Record<string, string> = {
      'Pending': '#EAB308', // Yellow
      'Approved': '#22C55E', // Green  
      'Rejected': '#EF4444', // Red
      'Cancelled': '#6B7280', // Gray
      'Sick': '#EF4444', // Red for Sick
      'Annual': '#22C55E', // Green for Annual
      'Personal': '#3B82F6', // Blue for Personal
      'Maternity': '#EC4899', // Pink for Maternity
      'Paternity': '#8B5CF6', // Purple for Paternity
    };
    return colorMap[name] || '#10B981'; // Default green
  };

  // Custom Tooltip Component for better dark mode support
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 min-w-[160px]">
          {label && <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm mb-2">{label}</p>}
          {payload.map((entry: any, index: number) => {
            // Get color from multiple sources with fallback
            const dotColor = entry.color || entry.fill || entry.payload?.fill || getColorForName(entry.name) || '#10B981';
            
            return (
              <div key={index} className="flex items-center justify-between gap-3 text-sm py-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ 
                      backgroundColor: dotColor,
                      border: `2px solid ${dotColor}`,
                      boxShadow: `0 0 0 1px rgba(255,255,255,0.3)`
                    }}
                  />
                  </div>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{entry.name}</span>
                <div className="flex items-center">
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">{entry.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Helper function to render chart based on chartType
  const renderChart = (data: any[], colors: string[], chartType: string) => {
    const chartData = data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length],
      color: colors[index % colors.length] // Add explicit color property
    }));

    const chartContent = (() => {
      switch (chartType) {
      case 'pie':
        return (
          <div className="w-full h-[200px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  paddingAngle={2}
                  dataKey="count"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />}
                  wrapperStyle={{ outline: 'none' }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'bar':
        return (
          <div className="w-full h-[200px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  domain={[0, 'dataMax']}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  wrapperStyle={{ outline: 'none' }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'donut':
      default:
        return (
          <div className="w-full h-[200px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="75%"
                  paddingAngle={2}
                  dataKey="count"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />}
                  wrapperStyle={{ outline: 'none' }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      }
    })();

    return (
      <div 
        key={chartType}
        className="animate-in fade-in-0 zoom-in-95 duration-500"
      >
        {chartContent}
      </div>
    );
  };

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
    
    // Prepare data for chart
    const chartData = statusData.map(item => ({
      name: item.label,
      count: item.count,
      percentage: parseFloat(item.percentage)
    }));

    const colors = [
      'hsl(45 93% 58%)', // Yellow for Pending
      'hsl(142.1 76.2% 36.3%)', // Green for Approved  
      'hsl(0 84.2% 60.2%)', // Red for Rejected
      'hsl(215 16% 47%)' // Gray for Cancelled
    ];

    return (
      <div className="space-y-4">
        {/* Chart */}
        <div>
          {renderChart(chartData, colors, chartType)}
        </div>
        
        {/* Legend */}
        <div className="space-y-2">
          {statusData.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded ${
                    item.label === 'Pending' ? 'bg-yellow-500 dark:bg-yellow-400' :
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
          ))}
        </div>
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
        color: "hsl(45 93% 58%)", // Yellow/Amber - consistent color
      },
      cancelled: {
        label: "Cancelled",
        color: "hsl(215 16% 47%)", // Gray
      },
    };
    
    return (
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
          <defs>
            <linearGradient id="fillApproved" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.4} />
              <stop offset="50%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillRejected" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(0 84.2% 60.2%)" stopOpacity={0.4} />
              <stop offset="50%" stopColor="hsl(0 84.2% 60.2%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(0 84.2% 60.2%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillPending" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(45 93% 58%)" stopOpacity={0.4} />
              <stop offset="50%" stopColor="hsl(45 93% 58%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(45 93% 58%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillCancelled" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(215 16% 47%)" stopOpacity={0.4} />
              <stop offset="50%" stopColor="hsl(215 16% 47%)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(215 16% 47%)" stopOpacity={0.02} />
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
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
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
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Area 
            type="natural" 
            dataKey="approved" 
            stroke="hsl(142.1 76.2% 36.3%)" 
            strokeWidth={2.5}
            fill="url(#fillApproved)"
            fillOpacity={1}
            connectNulls={true}
            isAnimationActive={true}
            animationDuration={800}
          />
          <Area 
            type="natural" 
            dataKey="rejected" 
            stroke="hsl(0 84.2% 60.2%)" 
            strokeWidth={2.5}
            fill="url(#fillRejected)"
            fillOpacity={1}
            connectNulls={true}
            isAnimationActive={true}
            animationDuration={1000}
          />
          <Area 
            type="natural" 
            dataKey="pending" 
            stroke="hsl(45 93% 58%)" 
            strokeWidth={2.5}
            fill="url(#fillPending)"
            fillOpacity={1}
            connectNulls={true}
            isAnimationActive={true}
            animationDuration={1200}
          />
          <Area 
            type="natural" 
            dataKey="cancelled" 
            stroke="hsl(215 16% 47%)" 
            strokeWidth={2.5}
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

    // Prepare data for chart
    const chartData = typeData.map(item => ({
      name: item.name,
      count: item.count,
      percentage: parseFloat(item.percentage)
    }));

    const colors = typeData.map(item => item.color);

    return (
      <div className="space-y-4">
        {/* Chart */}
        <div>
          {renderChart(chartData, colors, chartType)}
        </div>
        
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
        count: statistics.pendingRequests,
        percentage: pendingRate
      },
      {
        name: "Approved",
        count: statistics.approvedRequests,
        percentage: approvalRate
      },
      {
        name: "Rejected",
        count: statistics.rejectedRequests,
        percentage: rejectionRate
      },
      {
        name: "Cancelled",
        count: cancelledCount,
        percentage: cancelledRate
      }
    ];

    const colors = [
      "#EAB308", // Yellow - consistent color
      "#10B981", // Green
      "#EF4444", // Red
      "#6B7280"  // Gray
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
        {/* Chart */}
        <div>
          {renderChart(chartData, colors, chartType)}
        </div>
        
        {/* Legend */}
        <div className="space-y-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index] }}
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

  return (
    <div className="text-center text-muted-foreground py-8">
      No data available
    </div>
  );
}
