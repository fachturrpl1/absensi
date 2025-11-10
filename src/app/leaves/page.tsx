"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, FileText, Clock } from "lucide-react";
import { LeaveBalanceCard } from "@/components/leave/leave-balance-card";
import { getMyLeaveBalance, getMyLeaveRequests } from "@/action/leaves";
import { LeaveBalanceWithType } from "@/lib/leave/types";
import { formatLeaveDateRange, getStatusColor } from "@/lib/leave/utils";
import Link from "next/link";
import { format, parseISO } from "date-fns";

import { logger } from '@/lib/logger';
export default function LeavesPage() {
  const [balances, setBalances] = useState<LeaveBalanceWithType[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [balanceResult, requestsResult] = await Promise.all([
        getMyLeaveBalance(),
        getMyLeaveRequests()
      ]);

      if (balanceResult.success && balanceResult.data) {
        setBalances(balanceResult.data as any);
      }

      if (requestsResult.success && requestsResult.data) {
        setRequests(requestsResult.data);
      }
    } catch (error) {
      logger.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Leaves</h1>
            <p className="text-muted-foreground">
              Manage your leave requests and view your balance
            </p>
          </div>
          <Link href="/leaves/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Request Leave
            </Button>
          </Link>
        </div>

        {/* Balance Card */}
        <LeaveBalanceCard balances={balances} loading={loading} />

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Leave Requests
            </CardTitle>
            <CardDescription>View and manage your leave requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No leave requests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first leave request
                </p>
                <Link href="/leaves/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Request Leave
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/leaves/${request.id}`}
                    className="block"
                  >
                    <div className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: request.leave_type?.color_code || '#10B981' }}
                            />
                            <h4 className="font-semibold">{request.leave_type?.name}</h4>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatLeaveDateRange(
                                request.start_date,
                                request.end_date,
                                request.start_half_day,
                                request.end_half_day
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {request.total_days} day{request.total_days !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {request.reason}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{format(parseISO(request.requested_at), 'MMM d, yyyy')}</p>
                          <p className="text-xs">{request.request_number}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
