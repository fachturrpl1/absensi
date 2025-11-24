"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  FileText,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import { ILeaveRequest } from "@/lib/leave/types";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { useUserStore } from "@/store/user-store";

interface LeaveRequestCardProps {
  request: ILeaveRequest;
  isAdmin?: boolean;
  canApprove?: boolean;
  onUpdate?: () => void;
  onDelete?: (request: ILeaveRequest) => void;
  onApprove?: (request: ILeaveRequest) => void;
  onReject?: (request: ILeaveRequest) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-3 w-3" />;
    case 'approved':
      return <CheckCircle className="h-3 w-3" />;
    case 'rejected':
      return <XCircle className="h-3 w-3" />;
    case 'cancelled':
      return <XCircle className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

export function LeaveRequestCard({
  request,
  isAdmin = false,
  canApprove = false,
  onUpdate,
  onDelete,
  onApprove,
  onReject,
}: LeaveRequestCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUserStore();

  const startDate = new Date(request.start_date);
  const endDate = new Date(request.end_date);
  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Check if current user is the owner of the request
  const isRequestOwner = request.organization_member?.user?.id === user?.id;
  
  const memberName = isAdmin && request.organization_member?.user
    ? `${request.organization_member.user.first_name || ''} ${request.organization_member.user.last_name || ''}`.trim()
    : 'You';

  const handleAction = async (action: () => Promise<void> | void) => {
    setIsLoading(true);
    try {
      await action();
      onUpdate?.();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
      request.status === 'pending' 
        ? 'border-l-yellow-400 bg-yellow-50/30 dark:bg-yellow-950/20 shadow-md' 
        : 'border-l-transparent hover:border-l-primary/50'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {isAdmin && request.organization_member?.user && (
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={request.organization_member.user.profile_photo_url || undefined} 
                />
                <AvatarFallback className="text-xs font-medium">
                  {request.organization_member.user.first_name?.[0]}
                  {request.organization_member.user.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{memberName}</h3>
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-0.5 ${getStatusColor(request.status)}`}
                >
                  <div className="flex items-center gap-1">
                    {getStatusIcon(request.status)}
                    <span className="capitalize">{request.status}</span>
                  </div>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">#{request.request_number}</p>
            </div>
          </div>
          
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Leave Type */}
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{request.leave_type?.name || 'Unknown Type'}</span>
          <Badge variant="secondary" className="text-xs">
            {totalDays} {totalDays === 1 ? 'day' : 'days'}
          </Badge>
        </div>

        <Separator />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Start Date</span>
            </div>
            <p className="text-sm font-medium">
              {format(startDate, 'dd MMM yyyy', { locale: id })}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">End Date</span>
            </div>
            <p className="text-sm font-medium">
              {format(endDate, 'dd MMM yyyy', { locale: id })}
            </p>
          </div>
        </div>

        {/* Reason */}
        {request.reason && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Reason</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {request.reason}
            </p>
          </div>
        )}

        {/* Department (Admin only) */}
        {isAdmin && request.organization_member?.departments && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {request.organization_member.departments.name}
            </span>
          </div>
        )}

        {/* Requested Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Requested {format(new Date(request.requested_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
          </div>
        </div>

        {/* Quick Actions for Pending Requests */}
        {request.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            {canApprove && !isRequestOwner && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleAction(() => onApprove?.(request))}
                  disabled={isLoading}
                  className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white border-green-600"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(() => onReject?.(request))}
                  disabled={isLoading}
                  className="flex-1 h-8 border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {onDelete && isRequestOwner && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete?.(request)}
                disabled={isLoading}
                className="flex-1 h-8 border-orange-600 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
