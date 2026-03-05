"use client"

import { DatePicker, type DateRange } from "@/components/reuseable/date-picker"

interface Props {
  dateRange: DateRange
  onDateRangeChange: (next: DateRange) => void
  timezone?: string
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  timezone,
}: Props) {
  return (
    <DatePicker
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      timezone={timezone}
    />
  )
}
