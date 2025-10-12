"use client"

import { useEffect, useState } from "react"
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

import { getDepartmentMembersByOrganization } from "@/action/members"

const chartConfig = {
  members: {
    label: "Members",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function GroupChart({ organizationId }: { organizationId: string }) {
  const [chartData, setChartData] = useState<{ department: string; members: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const res = await getDepartmentMembersByOrganization(organizationId)
      if (res.success) {
        setChartData(res.data)
        setLoading(false)
      }
    }
    fetchData()
  }, [organizationId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Distribution</CardTitle>
        <CardDescription>Per Group</CardDescription>
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
}
