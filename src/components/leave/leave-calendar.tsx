"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, FileText } from "lucide-react";
import { ILeaveRequest } from "@/lib/leave/types";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<ILeaveRequest[]>([]);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<ILeaveRequest | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  const handleDateClick = (day: Date, dayRequests: ILeaveRequest[]) => {
    if (dayRequests.length > 0) {
      setSelectedDate(day);
      setSelectedRequests(dayRequests);
      setIsDateModalOpen(true);
    }
  };

  const handleLeaveClick = (request: ILeaveRequest) => {
    setSelectedLeaveDetail(request);
    setIsDetailModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return { bg: '#10B981', text: 'white' }; // Green
      case 'pending': return { bg: '#F59E0B', text: 'white' }; // Orange
      case 'rejected': return { bg: '#EF4444', text: 'white' }; // Red
      case 'cancelled': return { bg: '#6B7280', text: 'white' }; // Gray
      default: return { bg: '#6B7280', text: 'white' };
    }
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
                onClick={() => handleDateClick(day, dayRequests)}
                className={cn(
                  "min-h-24 border-r border-b p-2 relative",
                  isWeekendDay && "bg-muted/30",
                  isToday && "bg-primary/5 border-primary",
                  dayRequests.length > 0 && "cursor-pointer hover:bg-muted/50 transition-colors",
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
                  {dayRequests.slice(0, 3).map((request, idx) => {
                    const leaveTypeName = request.leave_type?.name || 'Leave';
                    
                    return (
                      <div
                        key={`${request.id}-${idx}`}
                        className="text-xs p-1 rounded font-medium overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{
                          backgroundColor: request.leave_type?.color_code 
                            ? `${request.leave_type.color_code}20`
                            : '#10B98120',
                          borderLeft: `3px solid ${request.leave_type?.color_code || '#10B981'}`
                        }}
                        title={`${request.organization_member?.user?.first_name} ${request.organization_member?.user?.last_name} - ${request.leave_type?.name}`}
                      >
                        {leaveTypeName}
                      </div>
                    );
                  })}
                  {dayRequests.length > 3 && (
                    <div className="text-xs text-muted-foreground font-medium">
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

      {/* Date Modal - List of Leaves */}
      <Dialog open={isDateModalOpen} onOpenChange={setIsDateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Leaves on {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              {selectedRequests.length} employee{selectedRequests.length > 1 ? 's' : ''} on leave
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => handleLeaveClick(request)}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={request.organization_member?.user?.profile_photo_url || undefined}
                      />
                      <AvatarFallback>
                        {request.organization_member?.user?.first_name?.[0]}
                        {request.organization_member?.user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {request.organization_member?.user?.first_name} {request.organization_member?.user?.last_name}
                        </p>
                        <Badge 
                          variant="outline"
                          style={{
                            borderColor: request.leave_type?.color_code || '#10B981',
                            color: request.leave_type?.color_code || '#10B981'
                          }}
                        >
                          {request.leave_type?.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.organization_member?.departments?.name || 'No Department'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {request.total_days} day{request.total_days > 1 ? 's' : ''}
                        </span>
                        <span>
                          {format(parseISO(request.start_date), 'MMM d')} - {format(parseISO(request.end_date), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal - Leave Details */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedLeaveDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Leave Request Details
                </DialogTitle>
                <DialogDescription>
                  Request ID: <span className="font-semibold">{selectedLeaveDetail.request_number || 'N/A'}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Employee Info */}
                {selectedLeaveDetail.organization_member?.user && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={selectedLeaveDetail.organization_member.user.profile_photo_url || undefined}
                      />
                      <AvatarFallback className="text-lg font-semibold">
                        {selectedLeaveDetail.organization_member.user.first_name?.[0]}
                        {selectedLeaveDetail.organization_member.user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">
                        {selectedLeaveDetail.organization_member.user.first_name} {selectedLeaveDetail.organization_member.user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLeaveDetail.organization_member.departments?.name || 'No Department'}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Leave Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Leave Type</p>
                    <Badge 
                      className="mt-1"
                      style={{
                        backgroundColor: selectedLeaveDetail.leave_type?.color_code || '#10B981',
                        color: 'white'
                      }}
                    >
                      {selectedLeaveDetail.leave_type?.name}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge 
                      className="mt-1"
                      style={{
                        backgroundColor: getStatusColor(selectedLeaveDetail.status).bg,
                        color: getStatusColor(selectedLeaveDetail.status).text,
                        border: 'none'
                      }}
                    >
                      {selectedLeaveDetail.status.charAt(0).toUpperCase() + selectedLeaveDetail.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="mt-1">{format(parseISO(selectedLeaveDetail.start_date), 'MMMM d, yyyy')}</p>
                    {selectedLeaveDetail.start_half_day && (
                      <Badge variant="outline" className="mt-1 text-xs">Half Day</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="mt-1">{format(parseISO(selectedLeaveDetail.end_date), 'MMMM d, yyyy')}</p>
                    {selectedLeaveDetail.end_half_day && (
                      <Badge variant="outline" className="mt-1 text-xs">Half Day</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Days</p>
                    <p className="mt-1 text-lg font-semibold">{selectedLeaveDetail.total_days} day{selectedLeaveDetail.total_days > 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Submitted On</p>
                    <p className="mt-1">{format(parseISO(selectedLeaveDetail.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>

                <Separator />

                {/* Reason */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Reason</p>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm">{selectedLeaveDetail.reason}</p>
                  </div>
                </div>

                {/* Emergency Contact */}
                {selectedLeaveDetail.emergency_contact && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Emergency Contact</p>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm">{selectedLeaveDetail.emergency_contact}</p>
                    </div>
                  </div>
                )}

                {/* Approval Info */}
                {selectedLeaveDetail.status !== 'pending' && (selectedLeaveDetail.approvals?.length || selectedLeaveDetail.approved_by_user) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        {selectedLeaveDetail.status === 'approved' ? 'Approved By' : 'Reviewed By'}
                      </p>
                      
                      {/* Show approvals from leave_approvals table if exists */}
                      {selectedLeaveDetail.approvals && selectedLeaveDetail.approvals.length > 0 ? (
                        selectedLeaveDetail.approvals
                          .filter(approval => approval.status === 'approved' || approval.status === 'rejected')
                          .map((approval, index) => (
                            <div key={approval.id || index} className={index > 0 ? 'mt-3 pt-3 border-t' : ''}>
                              {approval.approver && (
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage 
                                      src={approval.approver.profile_photo_url || undefined}
                                    />
                                    <AvatarFallback className="font-semibold">
                                      {approval.approver.first_name?.[0]}
                                      {approval.approver.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">
                                        {approval.approver.first_name} {approval.approver.last_name}
                                      </p>
                                      <Badge 
                                        variant={approval.status === 'approved' ? 'default' : 'destructive'}
                                        className="text-xs"
                                      >
                                        {approval.status}
                                      </Badge>
                                    </div>
                                    {approval.responded_at && (
                                      <p className="text-xs text-muted-foreground">
                                        on {format(parseISO(approval.responded_at), 'MMM d, yyyy')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                              {approval.comments && (
                                <div className="bg-muted/50 p-3 rounded-lg mt-3">
                                  <p className="text-sm">{approval.comments}</p>
                                </div>
                              )}
                            </div>
                          ))
                      ) : selectedLeaveDetail.approved_by_user ? (
                        /* Fallback: Show approved_by from leave_requests table */
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={selectedLeaveDetail.approved_by_user.profile_photo_url || undefined}
                            />
                            <AvatarFallback className="font-semibold">
                              {selectedLeaveDetail.approved_by_user.first_name?.[0]}
                              {selectedLeaveDetail.approved_by_user.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">
                              {selectedLeaveDetail.approved_by_user.first_name} {selectedLeaveDetail.approved_by_user.last_name}
                            </p>
                            {selectedLeaveDetail.approved_at && (
                              <p className="text-xs text-muted-foreground">
                                on {format(parseISO(selectedLeaveDetail.approved_at), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                      
                      {/* Show approval_note if exists (legacy) */}
                      {selectedLeaveDetail.approval_note && (
                        <div className="bg-muted/50 p-3 rounded-lg mt-3">
                          <p className="text-sm">{selectedLeaveDetail.approval_note}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
