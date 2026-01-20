"use client"
import { useEffect, useMemo, useState } from "react"
import { Menu } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { DateRange, FilterTab, PickerItem, SelectedFilter } from "./types"

interface Props {
  selectedFilter: SelectedFilter
  onSelectedFilterChange: (next: SelectedFilter) => void

  dateRange: DateRange
  onDateRangeChange: (next: DateRange) => void

  members: PickerItem[]
  teams: PickerItem[]

  sidebarOpen?: boolean
  onToggleSidebar?: () => void

  timezone?: string
}

export function InsightsHeader({
  selectedFilter,
  onSelectedFilterChange,
  dateRange,
  onDateRangeChange,
  members,
  teams,
  sidebarOpen,
  onToggleSidebar,
  timezone,
}: Props) {
  // STATE UNTUK KALENDER
  const [tempStartDate, setTempStartDate] = useState<Date>(dateRange.startDate)
  const [tempEndDate, setTempEndDate] = useState<Date>(dateRange.endDate)
  const [leftMonth, setLeftMonth] = useState<Date>(new Date(dateRange.startDate))
  const [rightMonth, setRightMonth] = useState<Date>(new Date(new Date(dateRange.startDate).setMonth(new Date(dateRange.startDate).getMonth() + 1)))
  const [selectingStart, setSelectingStart] = useState(true)
  const [filterTab, setFilterTab] = useState<FilterTab>("members")
  const [filterSearch, setFilterSearch] = useState("")
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>("last_7_days")

  // STATE UNTUK FILTER MEMBER/TEAM (pending sebelum di-apply)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [tempFilter, setTempFilter] = useState<SelectedFilter>(selectedFilter)

  const filterLabel = useMemo(() => {
    if (selectedFilter.all) return selectedFilter.type === "members" ? "All Members" : "All Teams"
    const source = selectedFilter.type === "members" ? members : teams
    return source.find(x => x.id === selectedFilter.id)?.name || (selectedFilter.type === "members" ? "Member" : "Team")
  }, [selectedFilter, members, teams])

  // date display helper
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: timezone || "UTC" })

  // timezone offset (e.g. +07, -05, +05:30)
  const tzOffset = useMemo((): string => {
    if (!timezone) return ""
    try {
      const now = new Date()
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "short" }).formatToParts(now)
      const name = parts.find(p => p.type === "timeZoneName")?.value ?? ""
      const m = name.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/)
      if (m) {
        const raw = m[1] ?? ""
        const sign = raw.startsWith("-") ? "-" : "+"
        let hours = raw.replace(/[+-]/, "")
        if (hours.length === 0) hours = "00"
        else if (hours.length === 1) hours = `0${hours}`
        const minutes = m[2] ?? "00"
        return minutes !== "00" ? `${sign}${hours}:${minutes}` : `${sign}${hours}`
      }
    } catch { }
    return ""
  }, [timezone])

  useEffect(() => {
    if (dateRangeOpen) {
      setTempStartDate(dateRange.startDate)
      setTempEndDate(dateRange.endDate)
      // pastikan pasangan bulan berdampingan
      const lm = new Date(dateRange.startDate)
      const rm = new Date(lm)
      rm.setMonth(rm.getMonth() + 1)
      setLeftMonth(lm)
      setRightMonth(rm)
      setSelectingStart(true)
    }
  }, [dateRangeOpen, dateRange])

  // Sync tempFilter when dropdown opens
  useEffect(() => {
    if (filterDropdownOpen) {
      setTempFilter(selectedFilter)
      setFilterTab(selectedFilter.type)
      setFilterSearch("")
    }
  }, [filterDropdownOpen, selectedFilter])

  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0)
    let startDay = firstDay.getDay() - 1
    if (startDay < 0) startDay = 6
    const days: { day: number; isCurrentMonth: boolean }[] = []
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) days.push({ day: prevMonthLastDay - i, isCurrentMonth: false })
    for (let i = 1; i <= lastDay.getDate(); i++) days.push({ day: i, isCurrentMonth: true })
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) days.push({ day: i, isCurrentMonth: false })
    return days
  }

  const handleDateClick = (day: number, month: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return
    const selectedDate = new Date(month.getFullYear(), month.getMonth(), day)
    selectedDate.setHours(0, 0, 0, 0)
    if (selectingStart) {
      setTempStartDate(selectedDate)
      setTempEndDate(selectedDate)
      setSelectingStart(false)
    } else {
      if (selectedDate < tempStartDate) {
        setTempEndDate(tempStartDate)
        setTempStartDate(selectedDate)
      } else {
        setTempEndDate(selectedDate)
      }
      setSelectingStart(true)
    }
  }

  const isDateInRange = (day: number, month: Date) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    date.setHours(0, 0, 0, 0)
    const start = new Date(tempStartDate); start.setHours(0, 0, 0, 0)
    const end = new Date(tempEndDate); end.setHours(0, 0, 0, 0)
    return date >= start && date <= end
  }

  const isStartOrEndDate = (day: number, month: Date) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    date.setHours(0, 0, 0, 0)
    const start = new Date(tempStartDate); start.setHours(0, 0, 0, 0)
    const end = new Date(tempEndDate); end.setHours(0, 0, 0, 0)
    return date.getTime() === start.getTime() || date.getTime() === end.getTime()
  }

  // Navigasi bulan kiri/kanan (jaga bersebelahan)
  const moveLeftMonth = (delta: number) => {
    const lm = new Date(leftMonth)
    lm.setMonth(lm.getMonth() + delta)
    const rm = new Date(lm); rm.setMonth(rm.getMonth() + 1)
    setLeftMonth(lm); setRightMonth(rm)
  }
  const moveRightMonth = (delta: number) => {
    const rm = new Date(rightMonth)
    rm.setMonth(rm.getMonth() + delta)
    const lm = new Date(rm); lm.setMonth(lm.getMonth() - 1)
    setLeftMonth(lm); setRightMonth(rm)
  }

  const applyDateRange = () => {
    onDateRangeChange({ startDate: tempStartDate, endDate: tempEndDate })
    setDateRangeOpen(false)
  }
  const cancelDateRange = () => {
    setTempStartDate(dateRange.startDate)
    setTempEndDate(dateRange.endDate)
    setDateRangeOpen(false)
  }

  const applyFilter = () => {
    onSelectedFilterChange(tempFilter)
    setFilterDropdownOpen(false)
  }

  const cancelFilter = () => {
    setTempFilter(selectedFilter)
    setFilterDropdownOpen(false)
  }

  // presets (mengikuti pola highlights: update temp state + highlight, commit saat Apply)
  const applyPreset = (preset: string) => {
    setSelectedPreset(preset)
    const now = new Date()
    let start = new Date()
    let end = new Date()

    switch (preset) {
      case "today": {
        start = new Date(now)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "yesterday": {
        start = new Date(now)
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end = new Date(start)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "this_week": {
        const dayOfWeek = now.getDay()
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Senin awal minggu
        start = new Date(now)
        start.setDate(start.getDate() - diff)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "last_7_days": {
        start = new Date(now)
        start.setDate(start.getDate() - 6)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "last_week": {
        const lastWeekEnd = new Date(now)
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay())
        lastWeekEnd.setHours(23, 59, 59, 999)
        const lastWeekStart = new Date(lastWeekEnd)
        lastWeekStart.setDate(lastWeekStart.getDate() - 6)
        lastWeekStart.setHours(0, 0, 0, 0)
        start = lastWeekStart
        end = lastWeekEnd
        break
      }
      case "last_2_weeks": {
        start = new Date(now)
        start.setDate(start.getDate() - 13)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "this_month": {
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "last_month": {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        start.setHours(0, 0, 0, 0)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        end.setHours(23, 59, 59, 999)
        break
      }
    }

    // Update tanggal sementara, biar user bisa review di kalender lalu Apply/Cancel
    setTempStartDate(start)
    setTempEndDate(end)

    // Jaga tampilan kalender tetap relevan
    const lm = new Date(start)
    const rm = new Date(lm); rm.setMonth(rm.getMonth() + 1)
    setLeftMonth(lm)
    setRightMonth(rm)
    setSelectingStart(true)
  }

  const source = filterTab === "members" ? members : teams
  const filtered = source.filter(it => it.name.toLowerCase().includes(filterSearch.toLowerCase()))

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        {/* Members/Teams filter */}
        <DropdownMenu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 min-w-[150px] text-left">
              {filterLabel}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 p-3">
            <div className="flex items-center gap-2 mb-3">
              <button
                className={`px-3 py-1 rounded-full text-sm border ${filterTab === "members" ? "bg-zinc-100 border-zinc-900 text-zinc-900" : "bg-white border-gray-300"}`}
                onClick={() => { setFilterTab("members"); setFilterSearch("") }}
              >Members</button>
              <button
                className={`px-3 py-1 rounded-full text-sm border ${filterTab === "teams" ? "bg-zinc-100 border-zinc-900 text-zinc-900" : "bg-white border-gray-300"}`}
                onClick={() => { setFilterTab("teams"); setFilterSearch("") }}
              >Teams</button>
            </div>

            <div className="mb-3 relative">
              <Input
                placeholder="Search items"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="pr-8"
              />
              {filterSearch && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setFilterSearch("")}
                  aria-label="Clear"
                >×</button>
              )}
            </div>

            <div className="max-h-64 overflow-auto">


              {filtered.map(it => {
                const isActive = !tempFilter.all && tempFilter.type === filterTab && tempFilter.id === it.id
                return (
                  <button
                    key={it.id}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded text-sm ${isActive ? "bg-zinc-100 text-zinc-900" : "hover:bg-gray-50"}`}
                    onClick={() => setTempFilter({ type: filterTab, all: false, id: it.id })}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full border ${isActive ? "bg-zinc-900 border-zinc-900" : "border-gray-400"}`} />
                    {it.name}
                  </button>
                )
              })}
            </div>

            {/* Apply/Cancel Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium" onClick={applyFilter}>
                Apply
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50" onClick={cancelFilter}>
                Cancel
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date range */}
        <DropdownMenu open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
          <DropdownMenuTrigger asChild>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {fmt(dateRange.startDate)} - {fmt(dateRange.endDate)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-auto p-0">
            <div className="flex">
              <div className="w-40 border-r border-gray-200 p-3 space-y-1">
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'today' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                  onClick={() => applyPreset("today")}
                >Today</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'yesterday' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                  onClick={() => applyPreset("yesterday")}
                >Yesterday</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'this_week' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                  onClick={() => applyPreset("this_week")}
                >This week</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_7_days' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                  onClick={() => applyPreset("last_7_days")}
                >Last 7 days</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_week' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                  onClick={() => applyPreset("last_week")}
                >Last week</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_2_weeks' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                  onClick={() => applyPreset("last_2_weeks")}
                >Last 2 weeks</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'this_month' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                  onClick={() => applyPreset("this_month")}
                >This month</button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_month' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                  onClick={() => applyPreset("last_month")}
                >Last month</button>
              </div>
              {/* Right Calendar (Dual months) */}
              <div className="p-4">
                {timezone && (
                  <div className="flex justify-end mb-2">
                    <span className="text-xs text-gray-500">
                      {timezone}{tzOffset ? ` (${tzOffset})` : ""} 🌐
                    </span>
                  </div>
                )}
                <div className="flex gap-4">
                  {/* Left Month */}
                  <div className="w-64">
                    <div className="flex items-center justify-between mb-4">
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={() => moveLeftMonth(-1)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <span className="font-semibold text-zinc-900">
                        {leftMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={() => moveLeftMonth(1)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                      <div className="font-semibold p-1 text-zinc-900">Mo</div>
                      <div className="font-semibold p-1 text-zinc-900">Tu</div>
                      <div className="font-semibold p-1 text-zinc-900">We</div>
                      <div className="font-semibold p-1 text-zinc-900">Th</div>
                      <div className="font-semibold p-1 text-zinc-900">Fr</div>
                      <div className="font-semibold p-1 text-zinc-900">Sa</div>
                      <div className="font-semibold p-1 text-zinc-900">Su</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                      {generateCalendarDays(leftMonth).map((d, i) => {
                        const inRange = d.isCurrentMonth && isDateInRange(d.day, leftMonth)
                        const isEdge = d.isCurrentMonth && isStartOrEndDate(d.day, leftMonth)
                        return (
                          <button
                            key={i}
                            onClick={() => handleDateClick(d.day, leftMonth, d.isCurrentMonth)}
                            className={`p-2 rounded ${isEdge ? "bg-zinc-900 text-white hover:bg-zinc-800" :
                              inRange ? "bg-zinc-100 hover:bg-zinc-200" :
                                d.isCurrentMonth ? "hover:bg-gray-100" : "text-gray-400"}`}
                          >
                            {d.day}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right Month */}
                  <div className="w-64">
                    <div className="flex items-center justify-between mb-4">
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={() => moveRightMonth(-1)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <span className="font-semibold text-zinc-900">
                        {rightMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={() => moveRightMonth(1)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                      <div className="font-semibold p-1 text-zinc-900">Mo</div>
                      <div className="font-semibold p-1 text-zinc-900">Tu</div>
                      <div className="font-semibold p-1 text-zinc-900">We</div>
                      <div className="font-semibold p-1 text-zinc-900">Th</div>
                      <div className="font-semibold p-1 text-zinc-900">Fr</div>
                      <div className="font-semibold p-1 text-zinc-900">Sa</div>
                      <div className="font-semibold p-1 text-zinc-900">Su</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                      {generateCalendarDays(rightMonth).map((d, i) => {
                        const inRange = d.isCurrentMonth && isDateInRange(d.day, rightMonth)
                        const isEdge = d.isCurrentMonth && isStartOrEndDate(d.day, rightMonth)
                        return (
                          <button
                            key={i}
                            onClick={() => handleDateClick(d.day, rightMonth, d.isCurrentMonth)}
                            className={`p-2 rounded ${isEdge ? "bg-zinc-900 text-white hover:bg-zinc-800" :
                              inRange ? "bg-zinc-100 hover:bg-zinc-200" :
                                d.isCurrentMonth ? "hover:bg-gray-100" : "text-gray-400"}`}
                          >
                            {d.day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer tanggal terpilih + aksi */}
                <div className="text-xs text-center text-gray-500 mt-2">
                  {fmt(tempStartDate)} - {fmt(tempEndDate)}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium" onClick={applyDateRange}>
                    Apply
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50" onClick={cancelDateRange}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Timezone label opsional */}
        {timezone && (
          <div className="flex justify-end mb-2">
            <span className="text-xs text-gray-500">
              {timezone}{tzOffset ? ` (${tzOffset})` : ""} 🌐
            </span>
          </div>
        )}
      </div>

      {/* Right cluster (ikon dsb) */}
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button
            className="p-2 hover:bg-gray-100 rounded"
            onClick={onToggleSidebar}
            aria-expanded={typeof sidebarOpen === "boolean" ? sidebarOpen : undefined}
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  )
}