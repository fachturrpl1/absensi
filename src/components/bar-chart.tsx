"use client"

import { memo } from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { useDepartmentMembers } from "@/hooks/use-department-members"

const chartConfig = {
  members: {
    label: "Members",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export const GroupChart = memo(function GroupChart({ organizationId }: { organizationId: string }) {
  // Use React Query instead of useEffect + useState
  const { data: chartData = [], isLoading: loading } = useDepartmentMembers(organizationId)

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
            <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
          Member Distribution
        </CardTitle>
        <CardDescription>Distribution across departments</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          {loading && chartData.length === 0 ? (
            <div className="flex gap-2">
              <div className="w-full h-36 bg-muted animate-pulse rounded" />
            </div>
          ) : (
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="department"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="members" fill="var(--color-members)" radius={8} />
          </BarChart>
          )}
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
        
        </div>
        <div className="text-muted-foreground leading-none">
          Showing Data Distribution Members Per Groups
        </div>
      </CardFooter>
    </Card>
  )
})
