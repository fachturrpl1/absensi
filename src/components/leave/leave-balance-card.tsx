"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LeaveBalanceWithType } from "@/lib/leave/types";
import { Calendar, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface LeaveBalanceCardProps {
  balances: LeaveBalanceWithType[];
  loading?: boolean;
}

export function LeaveBalanceCard({ balances, loading }: LeaveBalanceCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
          <CardDescription>No leave balance available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Leave balances will appear here once initialized.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Leave Balance - {new Date().getFullYear()}
        </CardTitle>
        <CardDescription>Your current leave allocation and usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {balances.map((balance) => {
          const totalAllocated = balance.entitled_days + balance.carried_forward_days;
          const percentageRemaining = totalAllocated > 0 
            ? (balance.remaining_days / totalAllocated) * 100 
            : 0;

          return (
            <div key={balance.id} className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: balance.leave_type.color_code || '#10B981' }}
                  />
                  <h4 className="font-semibold">{balance.leave_type.name}</h4>
                </div>
                <Badge 
                  variant={balance.remaining_days < 3 ? "destructive" : "secondary"}
                  className="font-mono"
                >
                  {balance.remaining_days}/{totalAllocated} days
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress 
                  value={percentageRemaining} 
                  className="h-2"
                  style={{
                    ['--progress-background' as any]: balance.leave_type.color_code || '#10B981'
                  }}
                />
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span className="font-medium">{balance.entitled_days}</span>
                    <span className="text-muted-foreground">entitled</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="font-medium">{balance.used_days}</span>
                    <span className="text-muted-foreground">used</span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-600">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{balance.pending_days}</span>
                    <span className="text-muted-foreground">pending</span>
                  </div>
                </div>
              </div>

              {/* Carried Forward */}
              {balance.carried_forward_days > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="font-mono">
                    +{balance.carried_forward_days} carried forward
                  </Badge>
                </div>
              )}
            </div>
          );
        })}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Allocated</p>
              <p className="text-2xl font-bold">
                {balances.reduce((sum, b) => sum + b.entitled_days + b.carried_forward_days, 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Remaining</p>
              <p className="text-2xl font-bold text-green-600">
                {balances.reduce((sum, b) => sum + b.remaining_days, 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
