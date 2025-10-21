"use client"

import { Bar, BarChart, CartesianGrid, LabelList, Pie, PieChart, YAxis, XAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend } from "@/components/ui/chart"

import {
  attendanceByStatusData,
  attendanceByStatusConfig,
  departmentPerformanceData,
  departmentPerformanceConfig,
} from "./analytics.config"

export function InsightCards() {
  const totalMembers = attendanceByStatusData.reduce((acc, curr) => acc + curr.members, 0)

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-5">
      {/* Attendance by Status Pie Chart */}
      <Card className="col-span-1 xl:col-span-2">
        <CardHeader>
          <CardTitle>Attendance by Status</CardTitle>
        </CardHeader>
        <CardContent className="max-h-48">
          <ChartContainer config={attendanceByStatusConfig} className="size-full">
            <PieChart
              className="m-0"
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={attendanceByStatusData}
                dataKey="members"
                nameKey="status"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                cornerRadius={4}
              >
                <ChartLegend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  content={() => (
                    <ul className="ml-8 flex flex-col gap-3">
                      {attendanceByStatusData.map((item) => (
                        <li key={item.status} className="flex w-40 items-center justify-between">
                          <span className="flex items-center gap-2 text-sm">
                            <span className="size-2.5 rounded-full" style={{ background: item.fill }} />
                            {item.status}
                          </span>
                          <span className="text-sm font-semibold tabular-nums">{item.members}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="gap-2">
          <Button size="sm" variant="outline" className="basis-1/2">
            View Report
          </Button>
          <Button size="sm" variant="outline" className="basis-1/2">
            Export Data
          </Button>
        </CardFooter>
      </Card>

      {/* Department Performance vs Target */}
      <Card className="col-span-1 xl:col-span-3">
        <CardHeader>
          <CardTitle>Department Attendance vs Target</CardTitle>
        </CardHeader>
        <CardContent className="size-full max-h-52">
          <ChartContainer config={departmentPerformanceConfig} className="size-full">
            <BarChart accessibilityLayer data={departmentPerformanceData} layout="vertical">
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="department"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                hide
              />
              <XAxis dataKey="actual" type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Bar stackId="a" dataKey="actual" layout="vertical" fill="var(--color-actual)">
                <LabelList
                  dataKey="department"
                  position="insideLeft"
                  offset={8}
                  className="fill-primary-foreground text-xs"
                />
                <LabelList
                  dataKey="actual"
                  position="insideRight"
                  offset={8}
                  className="fill-primary-foreground text-xs tabular-nums"
                />
              </Bar>
              <Bar
                stackId="a"
                dataKey="remaining"
                layout="vertical"
                fill="var(--color-remaining)"
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="remaining"
                  position="insideRight"
                  offset={8}
                  className="fill-primary-foreground text-xs tabular-nums"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-xs">Average: 90% · 3 departments above target</p>
        </CardFooter>
      </Card>
    </div>
  )
}
