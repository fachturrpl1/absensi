"use client"

import { Info, ChevronRight } from "lucide-react"
import { useState, useMemo } from "react"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_UNUSUAL_ACTIVITIES, DUMMY_SMART_NOTIFICATIONS, DUMMY_BEHAVIOR_CHANGES } from "@/lib/data/dummy-data"
import { useTimezone } from "@/components/timezone-provider"
import { InsightsRightSidebar } from "@/components/insights/InsightsRightSidebar"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { DateRange, SelectedFilter } from "@/components/insights/types"

export default function HighlightsPage() {
    const timezone = useTimezone()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // Shared State with consistent types
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: false, id: "m1" })

    // Default date range: Last 7 days
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 6)
        start.setHours(0, 0, 0, 0)
        return { startDate: start, endDate: end }
    })

    // Use dummy data
    const demoMembers = useMemo(() => DUMMY_MEMBERS, [])
    const demoTeams = useMemo(() => DUMMY_TEAMS, [])

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
            return activityDate >= dateRange.startDate && activityDate <= dateRange.endDate
        })

        return filtered
    }, [selectedFilter, dateRange])

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
            return notifDate >= dateRange.startDate && notifDate <= dateRange.endDate
        })

        return filtered
    }, [selectedFilter, dateRange])

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
            return changeDate >= dateRange.startDate && changeDate <= dateRange.endDate
        })

        return filtered
    }, [selectedFilter, dateRange])

    return (
        <div className="min-h-screen bg-white">
            {/* Page Header */}
            <div className="border-b border-gray-200">
                <div className="py-4 px-6">
                    {/* Title */}
                    <h1 className="text-xl font-semibold mb-5">Highlights</h1>

                    {/* Filter Bar (Delegated to InsightsHeader) */}
                    <InsightsHeader
                        selectedFilter={selectedFilter}
                        onSelectedFilterChange={setSelectedFilter}
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        members={demoMembers}
                        teams={demoTeams}
                        sidebarOpen={sidebarOpen}
                        onToggleSidebar={() => setSidebarOpen(o => !o)}
                        timezone={timezone}
                    />
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
                    members={demoMembers}
                    teams={demoTeams}
                    selectedFilter={selectedFilter}
                    onSelectedFilterChange={setSelectedFilter}
                />
            </div>
        </div>
    )
}
