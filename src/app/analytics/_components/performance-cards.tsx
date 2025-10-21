"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { TrendingUp, AlertCircle } from "lucide-react"
import { AttendanceByGroupTable } from "@/components/attendance-by-group-table/attendance-by-group-table"
import MemberPerformanceRadar from "@/components/charts/member-performance-radar"
import { CustomerInsights } from "@/components/customer-insights"

type PerformanceCardsProps = {
  groupData?: any[]
}

export function PerformanceCards({ groupData = [] }: PerformanceCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs lg:grid-cols-3">
      {/* Department Performance */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Attendance by Department
            </CardTitle>
            <CardDescription>Department-wise performance metrics</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AttendanceByGroupTable data={groupData} isLoading={false} />
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            View Detailed Report
          </Button>
        </CardFooter>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Key Metrics
            </CardTitle>
            <CardDescription>Quick overview</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg Attendance</span>
              <span className="text-lg font-bold tabular-nums">87%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full w-[87%] rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">On-Time Rate</span>
              <span className="text-lg font-bold tabular-nums">92%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full w-[92%] rounded-full bg-blue-500" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Leave Approvals</span>
              <span className="text-lg font-bold tabular-nums">78%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full w-[78%] rounded-full bg-purple-500" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Last updated: Today</p>
        </CardFooter>
      </Card>

      {/* Team Performance */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Overall attendance metrics</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <MemberPerformanceRadar performance={{ counts: { present: 0, late: 0, absent: 0, excused: 0 } }} />
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle>Insights</CardTitle>
            <CardDescription>Recommendations</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="max-h-64 overflow-y-auto">
          <CustomerInsights />
        </CardContent>
      </Card>
    </div>
  )
}
