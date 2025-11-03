"use client"

import { Clock } from "lucide-react"
import { Funnel, FunnelChart, LabelList } from "recharts"
import { cn } from "@/lib/utils"

import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

import { attendancePipelineData, attendancePipelineConfig, attendanceByDepartmentData, attendanceActionItems } from "./analytics.config"

export function OperationalCards() {
  const totalAttendance = attendanceByDepartmentData.reduce((sum, dept) => sum + dept.attendance, 0)
  const avgAttendance = Math.round(totalAttendance / attendanceByDepartmentData.length)

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-3">
      {/* Attendance Pipeline (Funnel) */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="size-full">
          <ChartContainer config={attendancePipelineConfig} className="size-full">
            <FunnelChart margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <Funnel className="stroke-card stroke-2" dataKey="value" data={attendancePipelineData}>
                <LabelList className="fill-foreground stroke-0" dataKey="stage" position="right" offset={10} />
                <LabelList className="fill-foreground stroke-0" dataKey="value" position="left" offset={10} />
              </Funnel>
            </FunnelChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-xs">Completion rate: 61.2% · Trend stable</p>
        </CardFooter>
      </Card>

      {/* Attendance by Department */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance by Department</CardTitle>
          <CardDescription className="font-medium tabular-nums">{avgAttendance}% Average</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {attendanceByDepartmentData.map((dept) => (
              <div key={dept.department} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dept.department}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold tabular-nums">{dept.attendance}%</span>
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        dept.isPositive ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {dept.growth}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={dept.attendance} />
                  <span className="text-muted-foreground text-xs font-medium tabular-nums">{dept.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-muted-foreground flex justify-between gap-1 text-xs">
            <span>{attendanceByDepartmentData.length} departments tracked</span>
            <span>•</span>
            <span>{attendanceByDepartmentData.filter((d) => d.isPositive).length} departments growing</span>
          </div>
        </CardFooter>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {attendanceActionItems.map((item) => (
              <li key={item.id} className="space-y-2 rounded-md border px-3 py-2">
                <div className="flex items-center gap-2">
                  <Checkbox defaultChecked={item.checked} />
                  <span className="text-sm font-medium">{item.title}</span>
                  <span
                    className={cn(
                      "w-fit rounded-md px-2 py-1 text-xs font-medium",
                      item.priority === "High" && "bg-red-500/20 text-red-600",
                      item.priority === "Medium" && "bg-yellow-500/20 text-yellow-600",
                      item.priority === "Low" && "bg-green-500/20 text-green-600"
                    )}
                  >
                    {item.priority}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs font-medium">{item.desc}</div>
                <div className="flex items-center gap-1">
                  <Clock className="text-muted-foreground size-3" />
                  <span className="text-muted-foreground text-xs font-medium">{item.due}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
