"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Briefcase,
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  ChevronRight,
  ChevronDown,
  Loader2
} from "lucide-react";
import { ILeaveRequest } from "@/lib/leave/types";
import { formatLeaveDateRange, getStatusColor } from "@/lib/leave/utils";
import { approveLeaveRequest, rejectLeaveRequest } from "@/action/admin-leaves";
import { useOrgStore } from "@/store/org-store";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeaveRequestListProps {
  requests: ILeaveRequest[];
  loading?: boolean;
  isAdmin?: boolean;
  canApprove?: boolean;
  onUpdate?: () => void;
  compact?: boolean;
  onViewAll?: () => void;
  hideExpandButton?: boolean;
}

export function LeaveRequestList({
  requests,
  loading = false,
  isAdmin = false,
  canApprove = false,
  onUpdate,
  compact = false,
  hideExpandButton = false
}: LeaveRequestListProps) {
  const [selectedRequest, setSelectedRequest] = useState<ILeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const { organizationId } = useOrgStore();

  const toggleExpanded = (requestId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const handleAction = (request: ILeaveRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionReason("");
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType || !organizationId) return;

    setActionLoading(true);
    try {
      let result;
      
      if (actionType === 'approve') {
        result = await approveLeaveRequest(
          organizationId,
          selectedRequest.id,
          actionReason || undefined
        );
      } else {
        if (!actionReason.trim()) {
          toast.error("Please provide a reason for rejection");
          setActionLoading(false);
          return;
        }
        result = await rejectLeaveRequest(
          organizationId,
          selectedRequest.id,
          actionReason
        );
      }

      if (result.success) {
        toast.success(
          actionType === 'approve' 
            ? "Leave request approved" 
            : "Leave request rejected"
        );
        setSelectedRequest(null);
        setActionType(null);
        setActionReason("");
        onUpdate?.();
      } else {
        toast.error(result.message || "Action failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No leave requests</h3>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "No leave requests to review at this time"
            : "You haven't made any leave requests yet"
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id} className={cn(
            "transition-colors",
            request.status === 'pending' && "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Avatar (Admin View) */}
                {isAdmin && request.organization_member?.user && (
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={request.organization_member.user.profile_photo_url || undefined} 
                    />
                    <AvatarFallback>
                      {request.organization_member.user.first_name?.[0]}
                      {request.organization_member.user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Main Content */}
                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isAdmin && request.organization_member?.user && (
                          <h4 className="font-semibold">
                            {request.organization_member.user.first_name} {request.organization_member.user.last_name}
                          </h4>
                        )}
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: request.leave_type?.color_code || '#10B981' }}
                        />
                        <span className="font-medium">{request.leave_type?.name}</span>
                        <Badge className={cn(
                          "gap-1",
                          getStatusColor(request.status)
                        )}>
                          {getStatusIcon(request.status)}
                          {request.status}
                        </Badge>
                      </div>
                      
                      {/* Employee Info (Admin View) */}
                      {isAdmin && request.organization_member && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {request.organization_member.employee_id && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {request.organization_member.employee_id}
                            </div>
                          )}
                          {request.organization_member.departments && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {request.organization_member.departments.name}
                            </div>
                          )}
                          {request.organization_member.positions && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {request.organization_member.positions.title}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions & Request Info */}
                    <div className="flex items-center gap-3">
                      {/* Approve/Reject Buttons */}
                      {canApprove && request.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-950"
                            onClick={() => handleAction(request, 'approve')}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950"
                            onClick={() => handleAction(request, 'reject')}
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {/* Request Number & Date */}
                      <div className="text-right text-sm text-muted-foreground">
                        <p className="font-mono text-xs">{request.request_number}</p>
                        <p>{format(parseISO(request.requested_at), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date Range & Duration */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {formatLeaveDateRange(
                          request.start_date,
                          request.end_date,
                          request.start_half_day,
                          request.end_half_day
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {request.total_days} day{request.total_days !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Reason - Only show preview when not expanded */}
                  {!compact && !expandedItems.has(request.id) && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {request.reason}
                    </p>
                  )}

                  {/* Expanded Details */}
                  {expandedItems.has(request.id) && (
                    <div className="space-y-3 pt-3 border-t border-muted">
                      {/* Full Reason */}
                      <div>
                        <h5 className="text-sm font-medium mb-1">Reason for Leave:</h5>
                        <p className="text-sm text-muted-foreground">
                          {request.reason}
                        </p>
                      </div>

                      {/* Emergency Contact */}
                      {request.emergency_contact && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Emergency Contact:</h5>
                          <p className="text-sm text-muted-foreground">
                            {request.emergency_contact}
                          </p>
                        </div>
                      )}

                      {/* Request Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium mb-1">Request Details:</h5>
                          <div className="space-y-1 text-muted-foreground">
                            <p>Request Number: <span className="font-mono">{request.request_number}</span></p>
                            <p>Requested: {format(parseISO(request.requested_at), 'PPP')}</p>
                            {request.start_half_day && <p>• Starts at noon (half day)</p>}
                            {request.end_half_day && <p>• Ends at noon (half day)</p>}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium mb-1">Leave Type Info:</h5>
                          <div className="space-y-1 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: request.leave_type?.color_code || '#10B981' }}
                              />
                              <span>{request.leave_type?.name}</span>
                            </div>
                            {request.leave_type?.description && (
                              <p className="text-xs">{request.leave_type.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Details */}
                  {request.status === 'approved' && request.approved_at && (
                    <p className="text-xs text-green-600">
                      Approved on {format(parseISO(request.approved_at), 'MMM d, yyyy')}
                      {request.approval_note && ` - ${request.approval_note}`}
                    </p>
                  )}
                  {request.status === 'rejected' && request.rejected_reason && (
                    <p className="text-xs text-red-600">
                      Rejected: {request.rejected_reason}
                    </p>
                  )}
                  {request.status === 'cancelled' && request.cancellation_reason && (
                    <p className="text-xs text-gray-600">
                      Cancelled: {request.cancellation_reason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Expand/Collapse Button */}
                  {!hideExpandButton && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleExpanded(request.id)}
                      className="h-8 w-8 p-0 hover:bg-muted"
                    >
                      {expandedItems.has(request.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog 
        open={!!selectedRequest && !!actionType} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setActionType(null);
            setActionReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </DialogTitle>
            <DialogDescription asChild>
              {selectedRequest && (
                <div className="space-y-2 mt-2">
                  <div>
                    <strong>Employee:</strong> {selectedRequest.organization_member?.user?.first_name} {selectedRequest.organization_member?.user?.last_name}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedRequest.leave_type?.name}
                  </div>
                  <div>
                    <strong>Duration:</strong> {selectedRequest.total_days} day{selectedRequest.total_days !== 1 ? 's' : ''}
                  </div>
                  <div>
                    <strong>Dates:</strong> {formatLeaveDateRange(
                      selectedRequest.start_date,
                      selectedRequest.end_date,
                      selectedRequest.start_half_day,
                      selectedRequest.end_half_day
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                {actionType === 'approve' ? 'Comments (Optional)' : 'Reason for Rejection *'}
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  actionType === 'approve' 
                    ? "Add any comments for the employee..."
                    : "Please provide a reason for rejection..."
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setActionReason("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleConfirmAction}
              disabled={actionLoading || (actionType === 'reject' && !actionReason.trim())}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
