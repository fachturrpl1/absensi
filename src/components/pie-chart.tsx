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
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
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
      title="Status Karyawan"
      description="Distribusi status aktif/tidak aktif"
      data={data}
      footerText="Status karyawan saat ini"
      innerRadius={60}
      outerRadius={100}
    />
  )
}

// Specific component for attendance distribution
export function AttendanceDistributionChart({ data }: { data: PieChartData[] }) {
  return (
    <CustomPieChart
      title="Distribusi Kehadiran Hari Ini"
      description="Breakdown kehadiran karyawan hari ini"
      data={data}
      footerText="Data kehadiran real-time"
      innerRadius={50}
      outerRadius={90}
    />
  )
}

// Specific component for employment status
export function EmploymentStatusChart({ data }: { data: PieChartData[] }) {
  return (
    <CustomPieChart
      title="Status Kepegawaian"
      description="Distribusi berdasarkan status kepegawaian"
      data={data}
      footerText="Komposisi karyawan"
      innerRadius={40}
      outerRadius={80}
    />
  )
}
