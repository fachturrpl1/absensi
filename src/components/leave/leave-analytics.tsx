"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ILeaveRequest } from "@/lib/leave/types";
import { parseISO, format } from "date-fns";

interface LeaveAnalyticsProps {
  requests: ILeaveRequest[];
  type: 'status' | 'monthly' | 'type' | 'department' | 'detailed';
  loading?: boolean;
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
  statistics 
}: LeaveAnalyticsProps) {
  
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
        color: '#F59E0B'
      },
      { 
        label: 'Approved', 
        count: counts.approved, 
        percentage: total > 0 ? (counts.approved / total * 100).toFixed(1) : '0',
        color: '#10B981'
      },
      { 
        label: 'Rejected', 
        count: counts.rejected, 
        percentage: total > 0 ? (counts.rejected / total * 100).toFixed(1) : '0',
        color: '#EF4444'
      },
      { 
        label: 'Cancelled', 
        count: counts.cancelled, 
        percentage: total > 0 ? (counts.cancelled / total * 100).toFixed(1) : '0',
        color: '#6B7280'
      }
    ];
  }, [requests]);

  // Monthly Trend
  const monthlyData = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    
    requests.forEach(r => {
      const month = format(parseISO(r.requested_at), 'MMM yyyy');
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    
    const sortedMonths = Object.entries(monthCounts)
      .sort((a, b) => {
        const dateA = parseISO(`01 ${a[0]}`);
        const dateB = parseISO(`01 ${b[0]}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-12); // Last 12 months
    
    const maxCount = Math.max(...sortedMonths.map(([, count]) => count), 1);
    
    return sortedMonths.map(([month, count]) => ({
      month,
      count,
      percentage: (count / maxCount * 100).toFixed(1)
    }));
  }, [requests]);

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
    const maxCount = Math.max(...Object.values(deptCounts), 1);
    
    return Object.entries(deptCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : '0',
        barPercentage: (count / maxCount * 100).toFixed(1)
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
    const maxCount = Math.max(...statusData.map(d => d.count), 1);
    
    return (
      <div className="space-y-4">
        {statusData.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color }}
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
                className="h-full transition-all duration-500"
                style={{
                  width: `${(item.count / maxCount * 100).toFixed(1)}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Monthly Trend Chart
  if (type === 'monthly') {
    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-2 h-48">
          {monthlyData.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex items-end justify-center h-full">
                <div
                  className="w-full bg-primary rounded-t transition-all duration-500 hover:opacity-80"
                  style={{ height: `${item.percentage}%` }}
                  title={`${item.month}: ${item.count} requests`}
                />
              </div>
              <div className="text-xs text-muted-foreground text-center rotate-45 origin-left">
                {item.month.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
        {monthlyData.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No data available
          </p>
        )}
      </div>
    );
  }

  // Leave Type Distribution
  if (type === 'type') {
    return (
      <div className="space-y-4">
        {typeData.map((item) => (
          <div key={item.code} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{item.count}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        ))}
        {typeData.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No leave types data available
          </p>
        )}
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
                style={{ width: `${item.barPercentage}%` }}
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

  // Detailed Analytics
  if (type === 'detailed' && statistics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-3xl font-bold">{statistics.totalRequests}</p>
              <div className="flex gap-2 text-xs">
                <span className="text-yellow-600">
                  {statistics.pendingRequests} pending
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-green-600">
                  {statistics.approvedRequests} approved
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <p className="text-3xl font-bold">
                {statistics.totalRequests > 0 
                  ? ((statistics.approvedRequests / statistics.totalRequests) * 100).toFixed(0)
                  : 0}%
              </p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${statistics.totalRequests > 0 
                      ? ((statistics.approvedRequests / statistics.totalRequests) * 100).toFixed(0)
                      : 0}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Rejection Rate</p>
              <p className="text-3xl font-bold">
                {statistics.totalRequests > 0 
                  ? ((statistics.rejectedRequests / statistics.totalRequests) * 100).toFixed(0)
                  : 0}%
              </p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{
                    width: `${statistics.totalRequests > 0 
                      ? ((statistics.rejectedRequests / statistics.totalRequests) * 100).toFixed(0)
                      : 0}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Employees on Leave</p>
              <p className="text-3xl font-bold">{statistics.employeesOnLeave}</p>
              <p className="text-xs text-muted-foreground">
                Out of {statistics.totalEmployees} total employees
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Upcoming Leaves</p>
              <p className="text-3xl font-bold">{statistics.upcomingLeaves}</p>
              <p className="text-xs text-muted-foreground">
                In the next 30 days
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Average Leave Days</p>
              <p className="text-3xl font-bold">{statistics.averageLeaveDays}</p>
              <p className="text-xs text-muted-foreground">
                Per request
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="text-center text-muted-foreground py-8">
      No data available
    </div>
  );
}
