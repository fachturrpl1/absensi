"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { ILeaveRequest } from "@/lib/leave/types";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  isWeekend,
  parseISO,
  isWithinInterval
} from "date-fns";
import { cn } from "@/lib/utils";

interface LeaveCalendarProps {
  requests: ILeaveRequest[];
  loading?: boolean;
}

export function LeaveCalendar({ requests, loading = false }: LeaveCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay();
  
  // Create array of days including padding
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Add padding days from previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of current month
    daysInMonth.forEach(day => {
      days.push(day);
    });
    
    return days;
  }, [daysInMonth, firstDayOfWeek]);

  // Group requests by date
  const requestsByDate = useMemo(() => {
    const map = new Map<string, ILeaveRequest[]>();
    
    requests.forEach(request => {
      if (request.status !== 'approved') return;
      
      const start = parseISO(request.start_date);
      const end = parseISO(request.end_date);
      
      daysInMonth.forEach(day => {
        if (isWithinInterval(day, { start, end })) {
          const dateKey = format(day, 'yyyy-MM-dd');
          const existing = map.get(dateKey) || [];
          map.set(dateKey, [...existing, request]);
        }
      });
    });
    
    return map;
  }, [requests, daysInMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-24 border-r border-b bg-muted/30"
                />
              );
            }

            const dateKey = format(day, 'yyyy-MM-dd');
            const dayRequests = requestsByDate.get(dateKey) || [];
            const isToday = isSameDay(day, new Date());
            const isWeekendDay = isWeekend(day);

            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-24 border-r border-b p-2 relative",
                  isWeekendDay && "bg-muted/30",
                  isToday && "bg-primary/5 border-primary",
                  "last:border-r-0"
                )}
              >
                {/* Date Number */}
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday && "text-primary font-bold",
                  isWeekendDay && "text-muted-foreground"
                )}>
                  {format(day, 'd')}
                </div>

                {/* Leave Indicators */}
                <div className="space-y-1">
                  {dayRequests.slice(0, 3).map((request, idx) => (
                    <div
                      key={`${request.id}-${idx}`}
                      className="text-xs p-1 rounded truncate"
                      style={{
                        backgroundColor: request.leave_type?.color_code 
                          ? `${request.leave_type.color_code}20`
                          : '#10B98120',
                        borderLeft: `3px solid ${request.leave_type?.color_code || '#10B981'}`
                      }}
                      title={`${request.organization_member?.user?.first_name} ${request.organization_member?.user?.last_name} - ${request.leave_type?.name}`}
                    >
                      {request.organization_member?.user?.first_name?.[0]}{request.organization_member?.user?.last_name?.[0]}
                    </div>
                  ))}
                  {dayRequests.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayRequests.length - 3} more
                    </div>
                  )}
                </div>

                {/* Today Indicator */}
                {isToday && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/5 border border-primary" />
          <span className="text-muted-foreground">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/30" />
          <span className="text-muted-foreground">Weekend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B98120', borderLeft: '3px solid #10B981' }} />
          <span className="text-muted-foreground">Leave Day</span>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Employees on Leave This Month</p>
              <p className="text-2xl font-bold">
                {new Set(
                  requests
                    .filter(r => r.status === 'approved')
                    .filter(r => {
                      const start = parseISO(r.start_date);
                      const end = parseISO(r.end_date);
                      return daysInMonth.some(day => 
                        isWithinInterval(day, { start, end })
                      );
                    })
                    .map(r => r.organization_member_id)
                ).size}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Leave Days</p>
              <p className="text-2xl font-bold">
                {requests
                  .filter(r => r.status === 'approved')
                  .filter(r => {
                    const start = parseISO(r.start_date);
                    const end = parseISO(r.end_date);
                    return daysInMonth.some(day => 
                      isWithinInterval(day, { start, end })
                    );
                  })
                  .reduce((sum, r) => sum + (r.total_days || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
