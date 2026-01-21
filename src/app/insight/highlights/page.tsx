"use client"

import { Info, Settings, Menu, ChevronRight, Bell } from "lucide-react"
import { useState, useMemo } from "react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_UNUSUAL_ACTIVITIES, DUMMY_SMART_NOTIFICATIONS, DUMMY_BEHAVIOR_CHANGES } from "@/lib/data/dummy-insights"
import { useTimezone } from "@/components/timezone-provider"
import { InsightsRightSidebar } from "@/components/insights/InsightsRightSidebar"

export default function HighlightsPage() {
    const timezone = useTimezone()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [filterTab, setFilterTab] = useState<"members" | "teams">("members")
    const [filterSearch, setFilterSearch] = useState("")
    const [selectedFilter, setSelectedFilter] = useState<{ type: "members" | "teams"; all: boolean; id?: string }>(
        { type: "members", all: false, id: "m1" }
    )
    const [dropdownOpen, setDropdownOpen] = useState(false)

    // Date range state
    const [dateRangeOpen, setDateRangeOpen] = useState(false)
    const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 6)))
    const [endDate, setEndDate] = useState<Date>(new Date())
    const [tempStartDate, setTempStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 6)))
    const [tempEndDate, setTempEndDate] = useState<Date>(new Date())
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
    const [selectingStart, setSelectingStart] = useState(true)
    const [selectedPreset, setSelectedPreset] = useState<string>('last_7_days')

    // Generate calendar days for a month
    const generateCalendarDays = (month: Date) => {
        const year = month.getFullYear()
        const monthIndex = month.getMonth()
        const firstDay = new Date(year, monthIndex, 1)
        const lastDay = new Date(year, monthIndex + 1, 0)

        let startDay = firstDay.getDay() - 1
        if (startDay < 0) startDay = 6

        const days: { day: number, isCurrentMonth: boolean }[] = []
        const prevMonthLastDay = new Date(year, monthIndex, 0).getDate()

        for (let i = startDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, isCurrentMonth: false })
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ day: i, isCurrentMonth: true })
        }

        const remainingDays = 42 - days.length
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ day: i, isCurrentMonth: false })
        }

        return days
    }

    // Handle date selection
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

    // Check if date is in range
    const isDateInRange = (day: number, month: Date) => {
        const date = new Date(month.getFullYear(), month.getMonth(), day)
        date.setHours(0, 0, 0, 0)
        const start = new Date(tempStartDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(tempEndDate)
        end.setHours(0, 0, 0, 0)
        return date >= start && date <= end
    }

    // Check if date is start or end
    const isStartOrEndDate = (day: number, month: Date) => {
        const date = new Date(month.getFullYear(), month.getMonth(), day)
        date.setHours(0, 0, 0, 0)
        const start = new Date(tempStartDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(tempEndDate)
        end.setHours(0, 0, 0, 0)
        return date.getTime() === start.getTime() || date.getTime() === end.getTime()
    }

    // Date range presets
    const applyDatePreset = (preset: string) => {
        setSelectedPreset(preset)
        const now = new Date()
        let start = new Date()
        let end = new Date()

        switch (preset) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0))
                end = new Date(now.setHours(23, 59, 59, 999))
                break
            case 'yesterday':
                start = new Date(now.setDate(now.getDate() - 1))
                start.setHours(0, 0, 0, 0)
                end = new Date(start)
                end.setHours(23, 59, 59, 999)
                break
            case 'this_week':
                const dayOfWeek = now.getDay()
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday as first day
                start = new Date(now.setDate(now.getDate() - diff))
                start.setHours(0, 0, 0, 0)
                end = new Date()
                break
            case 'last_7_days':
                start = new Date(now.setDate(now.getDate() - 6))
                start.setHours(0, 0, 0, 0)
                end = new Date()
                break
            case 'last_week':
                const lastWeekEnd = new Date(now.setDate(now.getDate() - now.getDay()))
                lastWeekEnd.setHours(23, 59, 59, 999)
                const lastWeekStart = new Date(lastWeekEnd)
                lastWeekStart.setDate(lastWeekStart.getDate() - 6)
                lastWeekStart.setHours(0, 0, 0, 0)
                start = lastWeekStart
                end = lastWeekEnd
                break
            case 'last_2_weeks':
                start = new Date(now.setDate(now.getDate() - 13))
                start.setHours(0, 0, 0, 0)
                end = new Date()
                break
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1)
                end = new Date()
                break
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
                break
        }

        setTempStartDate(start)
        setTempEndDate(end)
    }

    const applyDateRange = () => {
        setStartDate(tempStartDate)
        setEndDate(tempEndDate)
        setDateRangeOpen(false)
    }

    const cancelDateRange = () => {
        setTempStartDate(startDate)
        setTempEndDate(endDate)
        setDateRangeOpen(false)
    }

    // Use dummy data from file
    const demoMembers = useMemo(() => DUMMY_MEMBERS, [])
    const demoTeams = useMemo(() => DUMMY_TEAMS, [])

    const filterLabel = useMemo(() => {
        if (selectedFilter.all) return selectedFilter.type === "members" ? "All Members" : "All Teams"
        if (selectedFilter.type === "members") return demoMembers.find(m => m.id === selectedFilter.id)?.name || "Member"
        return demoTeams.find(t => t.id === selectedFilter.id)?.name || "Team"
    }, [selectedFilter, demoMembers, demoTeams])

    // Filter data based on selected member/team AND date range
    const filteredUnusualActivities = useMemo(() => {
        let filtered = DUMMY_UNUSUAL_ACTIVITIES

        // Filter by member/team
        if (!selectedFilter.all) {
            if (selectedFilter.type === "members" && selectedFilter.id) {
                filtered = filtered.filter(a => a.memberId === selectedFilter.id)
            } else if (selectedFilter.type === "teams" && selectedFilter.id) {
                const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                filtered = filtered.filter(a => team?.members.includes(a.memberId))
            }
        }

        // Filter by date range
        filtered = filtered.filter(a => {
            const activityDate = new Date(a.date)
            return activityDate >= startDate && activityDate <= endDate
        })

        return filtered
    }, [selectedFilter, startDate, endDate])

    const filteredNotifications = useMemo(() => {
        let filtered = DUMMY_SMART_NOTIFICATIONS

        // Filter by member/team
        if (!selectedFilter.all) {
            if (selectedFilter.type === "members" && selectedFilter.id) {
                filtered = filtered.filter(n => n.memberId === selectedFilter.id)
            } else if (selectedFilter.type === "teams" && selectedFilter.id) {
                const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                filtered = filtered.filter(n => team?.members.includes(n.memberId))
            }
        }

        // Filter by date range
        filtered = filtered.filter(n => {
            const notifDate = new Date(n.timestamp)
            return notifDate >= startDate && notifDate <= endDate
        })

        return filtered
    }, [selectedFilter, startDate, endDate])

    const filteredBehaviorChanges = useMemo(() => {
        let filtered = DUMMY_BEHAVIOR_CHANGES

        // Filter by member/team
        if (!selectedFilter.all) {
            if (selectedFilter.type === "members" && selectedFilter.id) {
                filtered = filtered.filter(c => c.memberId === selectedFilter.id)
            } else if (selectedFilter.type === "teams" && selectedFilter.id) {
                const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                filtered = filtered.filter(c => team?.members.includes(c.memberId))
            }
        }

        // Filter by date range
        filtered = filtered.filter(c => {
            const changeDate = new Date(c.detectedAt)
            return changeDate >= startDate && changeDate <= endDate
        })

        return filtered
    }, [selectedFilter, startDate, endDate])
    return (
        <div className="min-h-screen bg-white">
            {/* Page Header */}
            <div className="border-b border-gray-200">
                <div className="py-4">
                    {/* Title */}
                    <h1 className="text-xl font-semibold mb-5">Highlights</h1>

                    {/* Filter Bar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
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
                                        >
                                            Members
                                        </button>
                                        <button
                                            className={`px-3 py-1 rounded-full text-sm border ${filterTab === "teams" ? "bg-zinc-100 border-zinc-900 text-zinc-900" : "bg-white border-gray-300"}`}
                                            onClick={() => { setFilterTab("teams"); setFilterSearch("") }}
                                        >
                                            Teams
                                        </button>
                                    </div>
                                    <div className="mb-3">
                                        <div className="relative">
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
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-auto pt-2">
                                        {/* All Members/Teams Toggle */}
                                        <button
                                            className={`w-full flex items-center gap-2 px-2 py-2 rounded text-sm mb-2 ${(selectedFilter.all && selectedFilter.type === filterTab) ? "bg-zinc-100 text-zinc-900" : "hover:bg-gray-50"}`}
                                            onClick={() => {
                                                setSelectedFilter({ type: filterTab, all: true })
                                                setTimeout(() => setDropdownOpen(false), 100)
                                            }}
                                        >
                                            <div className={`w-3 h-3 rounded-full flex items-center justify-center border-2 transition-all ${(selectedFilter.all && selectedFilter.type === filterTab) ? "border-zinc-900 bg-zinc-900" : "border-gray-400 bg-white"}`}>
                                                {(selectedFilter.all && selectedFilter.type === filterTab) && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                )}
                                            </div>
                                            All {filterTab === "members" ? "Members" : "Teams"}
                                        </button>
                                        <div className="border-t border-gray-200 pt-2" />
                                        {(filterTab === "members" ? demoMembers : demoTeams)
                                            .filter(it => it.name.toLowerCase().includes(filterSearch.toLowerCase()))
                                            .map(it => {
                                                // Determine if this item is selected
                                                // If "All" is selected, show all as selected
                                                // If not "All", check if this specific item matches selectedFilter.id
                                                const isSelected = (selectedFilter.type === filterTab) && 
                                                    (selectedFilter.all || selectedFilter.id === it.id)
                                                
                                                console.log(`Render ${it.name}:`, { isSelected, all: selectedFilter.all, selectedId: selectedFilter.id, itemId: it.id })
                                                
                                                return (
                                                    <button
                                                        key={it.id}
                                                        className={`w-full flex items-center gap-2 px-2 py-2 rounded text-sm ${isSelected ? "bg-zinc-100 text-zinc-900" : "hover:bg-gray-50"}`}
                                                        onClick={() => {
                                                            console.log('Clicked:', it.name, 'Setting filter to:', { type: filterTab, all: false, id: it.id })
                                                            setSelectedFilter({ type: filterTab, all: false, id: it.id })
                                                            setTimeout(() => setDropdownOpen(false), 100)
                                                        }}
                                                    >
                                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center border-2 transition-all ${isSelected ? "border-zinc-900 bg-zinc-900" : "border-gray-400 bg-white"}`}>
                                                            {isSelected && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            )}
                                                        </div>
                                                        {it.name}
                                                    </button>
                                                )
                                            })}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>


                            {/* Date Range Picker */}
                            <DropdownMenu open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                                <DropdownMenuTrigger asChild>
                                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: timezone })} - {endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: timezone })}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-auto p-0">
                                    <div className="flex">
                                        {/* Left Presets */}
                                        <div className="w-40 border-r border-gray-200 p-3 space-y-1">
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'today' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                                                onClick={() => applyDatePreset('today')}
                                            >
                                                Today
                                            </button>
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'yesterday' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                                                onClick={() => applyDatePreset('yesterday')}
                                            >
                                                Yesterday
                                            </button>
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'this_week' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                                                onClick={() => applyDatePreset('this_week')}
                                            >
                                                This week
                                            </button>
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_7_days' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                                                onClick={() => applyDatePreset('last_7_days')}
                                            >
                                                Last 7 days
                                            </button>
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_week' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                                                onClick={() => applyDatePreset('last_week')}
                                            >
                                                Last week
                                            </button>
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_2_weeks' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                                                onClick={() => applyDatePreset('last_2_weeks')}
                                            >
                                                Last 2 weeks
                                            </button>
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'this_month' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                                                onClick={() => applyDatePreset('this_month')}
                                            >
                                                This month
                                            </button>
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${selectedPreset === 'last_month' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                                                onClick={() => applyDatePreset('last_month')}
                                            >
                                                Last month
                                            </button>
                                        </div>

                                        {/* Calendar - Single View */}
                                        <div className="p-4">
                                            <div className="w-64">
                                                <div className="flex items-center justify-between mb-4">
                                                    <button className="p-1 hover:bg-gray-100 rounded" onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <polyline points="15 18 9 12 15 6" />
                                                        </svg>
                                                    </button>
                                                    <span className="font-semibold text-zinc-900">
                                                        {calendarMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <button className="p-1 hover:bg-gray-100 rounded" onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))}>
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
                                                    {generateCalendarDays(calendarMonth).map((dayObj, i) => {
                                                        const isInRange = dayObj.isCurrentMonth && isDateInRange(dayObj.day, calendarMonth)
                                                        const isStartEnd = dayObj.isCurrentMonth && isStartOrEndDate(dayObj.day, calendarMonth)
                                                        return (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleDateClick(dayObj.day, calendarMonth, dayObj.isCurrentMonth)}
                                                                className={`p-2 rounded ${isStartEnd ? 'bg-zinc-900 text-white hover:bg-zinc-800' :
                                                                    isInRange ? 'bg-zinc-100 hover:bg-zinc-200' :
                                                                        dayObj.isCurrentMonth ? 'hover:bg-gray-100' : 'text-gray-400'
                                                                    }`}
                                                            >
                                                                {dayObj.day}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                <div className="text-xs text-center text-gray-500 mt-2">
                                                    {tempStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: timezone })} - {tempEndDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: timezone })}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
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


                            {/* Timezone */}
                            <span className="text-sm text-gray-600">+07 🌐</span>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            <Link href="/insight/smart-notifications">
                                <button className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-md text-sm hover:bg-zinc-50 flex items-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    Smart notifications
                                </button>
                            </Link>
                            <button className="p-2 hover:bg-gray-100 rounded">
                                <Settings className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                className="p-2 hover:bg-gray-100 rounded"
                                onClick={() => setSidebarOpen(o => !o)}
                                aria-expanded={sidebarOpen}
                                aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                            >
                                <Menu className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex">
                {/* Left Content Area */}
                <div className="flex-1 p-6 space-y-6">
                    {/* UNUSUAL ACTIVITY Section */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                    Unusual Activity
                                </h2>
                                <Info className="w-4 h-4 text-gray-400" />
                            </div>
                            <a
                                href="/insight/unusual-activity"
                                className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1 font-medium"
                            >
                                View all
                                <ChevronRight className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                            <div className="p-6">
                                <div className="flex gap-6">
                                    {/* Left Stats Column */}
                                    <div className="space-y-4 min-w-[120px]">
                                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="text-3xl font-bold">{new Set(filteredUnusualActivities.map(a => a.memberId)).size}</div>
                                            <div className="text-sm text-gray-600 mt-1">Members</div>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="text-3xl font-bold">{filteredUnusualActivities.length}</div>
                                            <div className="text-sm text-gray-600 mt-1">Instances</div>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="text-3xl font-bold">{Math.floor(filteredUnusualActivities.reduce((acc, a) => acc + a.duration, 0) / 60)}:{(filteredUnusualActivities.reduce((acc, a) => acc + a.duration, 0) % 60).toString().padStart(2, '0')}</div>
                                            <div className="text-sm text-gray-600 mt-1">Total time (h:m)</div>
                                        </div>
                                    </div>

                                    {/* Right Activity List - Max 4 recent */}
                                    <div className="flex-1">
                                        <div className="space-y-3">
                                            {filteredUnusualActivities.slice(0, 4).map((activity, idx) => (
                                                <div key={idx} className="flex items-start gap-3 text-sm hover:bg-gray-50 p-2 rounded-md -mx-2 transition-colors cursor-pointer">
                                                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${activity.severity === 'highly_unusual' ? 'bg-red-500' :
                                                        activity.severity === 'unusual' ? 'bg-orange-500' :
                                                            'bg-yellow-500'
                                                        }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-medium text-gray-900">{activity.memberName}</span>
                                                            <span className="text-xs text-gray-500 flex-shrink-0">{new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                        <div className="text-gray-600 mt-0.5">
                                                            <span className="font-medium">{activity.activityType}:</span> {activity.description}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Duration: {Math.floor(activity.duration / 60)}h {activity.duration % 60}m
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredUnusualActivities.length === 0 && (
                                                <div className="text-center py-8 text-gray-500">
                                                    No unusual activity detected
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SMART NOTIFICATIONS Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Smart Notifications
                            </h2>
                            <Info className="w-4 h-4 text-gray-400" />
                        </div>

                        <div className="border border-gray-200 rounded-lg p-6">
                            <div className="space-y-3">
                                {filteredNotifications.map((notif) => (
                                    <div key={notif.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-semibold text-sm">{notif.memberName}</span>
                                                    <span className={`px-2 py-1 text-xs rounded ${notif.severity === 'high' ? 'bg-red-100 text-red-700' :
                                                        notif.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>{notif.severity}</span>
                                                </div>
                                                <div className="text-sm text-gray-600 mb-2">{notif.message}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(notif.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                            <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* SIGNIFICANT CHANGES IN BEHAVIOR Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Significant Changes in Behavior
                            </h2>
                            <Info className="w-4 h-4 text-gray-400" />
                        </div>

                        <div className="border border-gray-200 rounded-lg p-6">
                            <div className="space-y-3">
                                {filteredBehaviorChanges.map((change, idx) => (
                                    <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-semibold text-sm">{change.memberName}</span>
                                                    <span className={`px-2 py-1 text-xs rounded ${change.changeType === 'productivity_increase' ? 'bg-green-100 text-green-700' :
                                                        change.changeType === 'productivity_decrease' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>{change.changeType.replace('_', ' ')}</span>
                                                </div>
                                                <div className="text-sm text-gray-600 mb-2">{change.description}</div>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span>Previous: {change.previousValue}</span>
                                                    <span>→</span>
                                                    <span>Current: {change.currentValue}</span>
                                                    <span className={`font-semibold ${change.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
                                                    </span>
                                                    <span>•</span>
                                                    <span>{change.detectedAt}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
                <InsightsRightSidebar
                    open={sidebarOpen}
                    onOpenChange={setSidebarOpen}
                    members={DUMMY_MEMBERS}
                    selectedFilter={selectedFilter as any}
                    onSelectedFilterChange={setSelectedFilter as any}
                />
            </div>
        </div>
    )
}
