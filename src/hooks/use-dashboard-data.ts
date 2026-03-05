'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { fetchDashboardData, type DashboardAttendanceRecord } from '@/utils/dashboard-api'
import type { DateFilterState } from '@/components/attendance/dashboard/date-filter-bar'

export interface DashboardStats {
  totalPresent: number
  totalLate: number
  totalAbsent: number
  onTimeRate: number
  avgWorkHours: number
  totalWorkHoursToday: number
  activeMembers: number
}

interface UseDashboardDataReturn {
  records: DashboardAttendanceRecord[]
  stats: DashboardStats
  chartData: any[]
  statusData: { name: string; value: number; color: string }[]
  isLoading: boolean
  dateRange: DateFilterState
  setDateRange: (range: DateFilterState) => void
}

export function useDashboardData(
  organizationId: number | null,
  isHydrated: boolean
): UseDashboardDataReturn {
  const [dateRange, setDateRange] = useState<DateFilterState>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)
    return { from: today, to: endOfToday, preset: 'today' }
  })

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['dashboard', organizationId, dateRange],
    queryFn: () => fetchDashboardData(organizationId!, dateRange),
    staleTime: 0, // No cache
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto refresh 30s
    refetchOnWindowFocus: true,
    enabled: !!organizationId && isHydrated,
  })

const filteredRecords = useMemo(() => {
  const fromDate = new Date(dateRange.from);
  fromDate.setHours(0, 0, 0, 0);
  
  const toDate = new Date(dateRange.to);
  toDate.setHours(23, 59, 59, 999);
  
  return records.filter(record => {
    if (!record.attendance_date) return false;
    
    // ✅ Parse dengan timezone safety
    const recordDate = new Date(record.attendance_date);
    if (isNaN(recordDate.getTime())) return false;
    
    // ✅ Compare timestamps
    return recordDate.getTime() >= fromDate.getTime() && 
           recordDate.getTime() <= toDate.getTime();
  });
}, [records, dateRange]);


  // Calculate stats
  const stats = useMemo((): DashboardStats => {
    const present = filteredRecords.filter(r => r.status === 'present' || r.status === 'late').length
    const late = filteredRecords.filter(r => r.status === 'late').length
    const absent = filteredRecords.filter(r => r.status === 'absent').length

    const totalWorkMinutes = filteredRecords.reduce((sum, r) => {
      return sum + (r.work_duration_minutes || 0)
    }, 0)
    
    const totalWorkHours = totalWorkMinutes / 60
    const avgHours = filteredRecords.length > 0 ? totalWorkMinutes / filteredRecords.length / 60 : 0

    const uniqueMembers = new Set(
      filteredRecords.filter(r => r.actual_check_in).map(r => r.member_name)
    )

    return {
      totalPresent: present,
      totalLate: late,
      totalAbsent: absent,
      onTimeRate: present > 0 ? ((present - late) / present) * 100 : 0,
      avgWorkHours: avgHours,
      totalWorkHoursToday: totalWorkHours,
      activeMembers: uniqueMembers.size,
    }
  }, [filteredRecords])

  // Chart data
  const chartData = useMemo(() => {
    const isToday = dateRange.preset === 'today'
    
    if (isToday) {
      const hours = Array.from({ length: 24 }, (_, i) => i)
      const hourlyMap: Record<number, any> = {}
      
      hours.forEach(hour => {
        hourlyMap[hour] = { present: 0, late: 0, absent: 0 }
      })

      filteredRecords.forEach(record => {
        if (record.actual_check_in) {
          const checkInDate = new Date(record.actual_check_in)
          const hour = checkInDate.getHours()
          if (hourlyMap[hour]) {
            if (record.status === 'present') hourlyMap[hour].present++
            else if (record.status === 'late') hourlyMap[hour].late++
          }
        }
      })

      return hours.map(hour => ({
        label: `${hour.toString().padStart(2, '0')}:00`,
        present: hourlyMap[hour]?.present || 0,
        late: hourlyMap[hour]?.late || 0,
        absent: hourlyMap[hour]?.absent || 0,
      }))
    }

    // Default: daily data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const daysMap: Record<string, any> = {}
    
    days.forEach(day => {
      daysMap[day] = { present: 0, late: 0, absent: 0 }
    })

    filteredRecords.forEach(record => {
      const date = new Date(record.attendance_date)
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
      
      if (dayName && daysMap[dayName]) {
        if (record.status === 'present') daysMap[dayName].present++
        else if (record.status === 'late') daysMap[dayName].late++
      }
    })

    return days.map(day => ({
      label: day,
      present: daysMap[day]?.present || 0,
      late: daysMap[day]?.late || 0,
      absent: daysMap[day]?.absent || 0,
    }))
  }, [filteredRecords, dateRange.preset])

  const statusData = useMemo(() => [
    { name: 'Present', value: stats.totalPresent, color: '#10B981' },
    { name: 'Late', value: stats.totalLate, color: '#F59E0B' },
    { name: 'Absent', value: stats.totalAbsent, color: '#EF4444' },
  ].filter(item => item.value > 0), [stats])

  return {
    records: filteredRecords,
    stats,
    chartData,
    statusData,
    isLoading,
    dateRange,
    setDateRange,
  }
}
