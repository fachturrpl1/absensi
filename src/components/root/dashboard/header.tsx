'use client'
import { format } from 'date-fns'
import { DateFilterBar } from '@/components/attendance/dashboard/date-filter-bar'

interface Props {
  dateRange: any
  setDateRange: (range: any) => void
  getFilterLabel: () => string
  orgName?: string
  currentTime?: Date | null
  isClient?: boolean
}

export function DashboardHeader({ 
  dateRange, 
  setDateRange, 
  orgName, 
  currentTime,
  isClient 
}: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard{orgName && ` - ${orgName}`}
        </h1>
        {isClient && currentTime && (
          <p className="text-muted-foreground text-sm mt-1">
            {format(currentTime, 'EEEE, MMMM dd, yyyy • HH:mm:ss')}
          </p>
        )}
      </div>
      <DateFilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
    </div>
  )
}
