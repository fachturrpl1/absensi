'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3 } from 'lucide-react'
import { Tooltip as RechartsTooltip } from 'recharts'


const COLORS = {
  success: '#10B981',
  warning: '#F59E0B',
}

interface Props {
  chartData: any[]
  dateRange: any
  maxAttendance: number
  getFilterLabel: () => string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-bold">{entry.value as number}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function ChartsArea({ chartData, dateRange, maxAttendance, getFilterLabel }: Props) {
  const isToday = dateRange.preset === 'today'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="lg:col-span-4"
    >
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <BarChart3 className="w-5 h-5 text-primary" />
                {isToday ? 'Hourly Attendance' : 'Attendance Trend'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isToday ? 'Check-in patterns throughout the day' : `Attendance patterns for ${getFilterLabel().toLowerCase()}`}
              </CardDescription>
            </div>
            <Badge variant="outline">{getFilterLabel()}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis
                dataKey="label"
                stroke="currentColor"
                opacity={0.5}
                fontSize={12}
                angle={isToday ? -45 : 0}
                textAnchor={isToday ? 'end' : 'middle'}
                height={isToday ? 60 : 30}
                />
                <YAxis
                type="number"
                domain={[0, (maxAttendance || 10) * 1.1]}
                stroke="currentColor"
                opacity={0.5}
                fontSize={12}
                tickFormatter={(value) => Math.floor(value).toString()}
                tickLine={false}
                axisLine={false}
                tickMargin={0}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="present" stroke={COLORS.success} fillOpacity={1} fill="url(#colorPresent)" />
                <Area type="monotone" dataKey="late" stroke={COLORS.warning} fillOpacity={1} fill="url(#colorLate)" />
            </AreaChart>
            </ResponsiveContainer>
        </CardContent>
        </Card>
    </motion.div>
    )
}