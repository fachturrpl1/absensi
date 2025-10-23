"use client"

import { TrendingUp } from "lucide-react"
import { Cell, LabelList, Pie, PieChart, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// use simple animate-pulse for loading
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface PieChartData {
  name: string
  value: number
  color: string
}

interface CustomPieChartProps {
  title: string
  description: string
  data: PieChartData[]
  footerText?: string
  showLabel?: boolean
  innerRadius?: number
  outerRadius?: number
}

export function CustomPieChart({ 
  title, 
  description, 
  data, 
  footerText,
  showLabel = true,
  innerRadius = 60,
  outerRadius = 100
}: CustomPieChartProps) {
  // Create chart config from data
  const chartConfig: ChartConfig = data.reduce((config, item, index) => {
    config[item.name.toLowerCase().replace(/\s+/g, '_')] = {
      label: item.name,
      color: item.color,
    }
    return config
  }, {} as ChartConfig)

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="flex flex-col border-0 shadow-lg overflow-hidden">
      <CardHeader className="items-center pb-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 mb-2">
          <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          {data.length === 0 ? (
            <div className="w-full h-44 bg-muted animate-pulse rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  {showLabel && (
                    <LabelList
                      dataKey="value"
                      className="fill-background"
                      stroke="none"
                      fontSize={12}
                      formatter={(value: number) => 
                        total > 0 ? `${((value / total) * 100).toFixed(0)}%` : '0%'
                      }
                    />
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </CardContent>
      {footerText && (
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            {footerText}
            <TrendingUp className="h-4 w-4" />
          </div>
        </CardFooter>
      )}
      
      {/* Legend */}
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="grid grid-cols-2 gap-2 w-full">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}

// Specific component for member status distribution
export function MemberStatusChart({ data }: { data: PieChartData[] }) {
  return (
    <CustomPieChart
      title="Employee Status"
      description="Distribution of active versus inactive employees"
      data={data}
      footerText="Current employee status"
      innerRadius={60}
      outerRadius={100}
    />
  )
}

// Specific component for attendance distribution
export function AttendanceDistributionChart({ data }: { data: PieChartData[] }) {
  return (
    <CustomPieChart
      title="Today's Attendance Distribution"
      description="Breakdown of employee attendance today"
      data={data}
      footerText="Real-time attendance data"
      innerRadius={50}
      outerRadius={90}
    />
  )
}

// Specific component for employment status
export function EmploymentStatusChart({ data }: { data: PieChartData[] }) {
  return (
    <CustomPieChart
      title="Employment Status"
      description="Distribution by employment classification"
      data={data}
      footerText="Employee composition"
      innerRadius={40}
      outerRadius={80}
    />
  )
}
