"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { departmentStatsData } from "./analytics-config"

export function DepartmentPerformance() {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Department Performance</CardTitle>
        <CardDescription>On-time attendance by department</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {departmentStatsData.map((dept, i) => {
          const variance = dept.onTime - dept.target
          const isAboveTarget = variance >= 0

          return (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{dept.dept}</span>
                  <Badge variant="outline" className={`text-xs ${isAboveTarget ? "border-slate-300" : "border-slate-300"}`}>
                    {isAboveTarget ? "+" : ""}{variance}%
                  </Badge>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{dept.onTime}%</span>
              </div>
              <div className="space-y-1">
                <Progress
                  value={dept.onTime}
                  className="h-2 bg-slate-200 dark:bg-slate-800"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Target: {dept.target}%</span>
                  <span>{isAboveTarget ? "Above" : "Below"} target</span>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
