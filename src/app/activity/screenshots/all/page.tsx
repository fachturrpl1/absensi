"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { InsightsRightSidebar } from "@/components/insights/InsightsRightSidebar"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_SCREENSHOTS, getScreenshotsByMemberAndDateRange } from "@/lib/data/dummy-data"
import { ScreenshotCard } from "@/components/activity/ScreenshotCard"

export default function AllScreenshotsPage() {
  const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
    type: "members",
    all: false,
    id: "m1"
  })

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
    endDate: new Date(),
  })

  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Filter screenshots based on selected member/team and date range
  const filteredScreenshots = useMemo(() => {
    if (selectedFilter.all) {
      return DUMMY_SCREENSHOTS.filter(s => {
        const screenshotDate = new Date(s.date)
        return screenshotDate >= dateRange.startDate && screenshotDate <= dateRange.endDate
      })
    }

    if (selectedFilter.type === "members" && selectedFilter.id) {
      return getScreenshotsByMemberAndDateRange(selectedFilter.id, dateRange.startDate, dateRange.endDate)
    }

    if (selectedFilter.type === "teams" && selectedFilter.id) {
      const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
      if (!team) return []

      return DUMMY_SCREENSHOTS.filter(s => {
        const screenshotDate = new Date(s.date)
        const inDateRange = screenshotDate >= dateRange.startDate && screenshotDate <= dateRange.endDate
        const inTeam = team.members.includes(s.memberId)
        return inDateRange && inTeam
      })
    }

    return []
  }, [selectedFilter, dateRange])

  // Group screenshots by hour blocks
  const groupedScreenshots = useMemo(() => {
    const groups: { [key: string]: typeof filteredScreenshots } = {}

    filteredScreenshots.forEach(screenshot => {
      const hour = new Date(screenshot.timestamp).getHours()
      const hourBlock = `${hour}:00`
      if (!groups[hourBlock]) {
        groups[hourBlock] = []
      }
      groups[hourBlock].push(screenshot)
    })

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filteredScreenshots])

  // Calculate total worked time
  const totalWorkedMinutes = useMemo(() => {
    return filteredScreenshots.reduce((sum, s) => sum + (s.noActivity ? 0 : s.minutes), 0)
  }, [filteredScreenshots])

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="flex flex-1 flex-col overflow-hidden">
        <InsightsHeader
          selectedFilter={selectedFilter}
          onSelectedFilterChange={setSelectedFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          members={DUMMY_MEMBERS}
          teams={DUMMY_TEAMS}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8">
            <div className="space-y-6">
              {/* Stats Summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex gap-6">
                  <div className="flex flex-1 flex-col justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Worked time</p>
                    <h2 className="text-5xl font-semibold text-slate-900">{formatTime(totalWorkedMinutes)}</h2>
                  </div>
                  <div className="flex flex-1 flex-col justify-between border-l border-slate-200 pl-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Screenshots</p>
                    <span className="text-3xl font-semibold text-slate-700">{filteredScreenshots.length}</span>
                  </div>
                </div>
              </div>

              {/* Screenshots Grid */}
              {groupedScreenshots.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <p className="text-slate-500">No screenshots found for the selected criteria</p>
                </div>
              ) : (
                groupedScreenshots.map(([hourBlock, screenshots]) => {
                  const blockMinutes = screenshots.reduce((sum, s) => sum + (s.noActivity ? 0 : s.minutes), 0)
                  const nextHour = parseInt(hourBlock) + 1

                  return (
                    <div key={hourBlock} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-medium">
                          {hourBlock} - {nextHour}:00
                        </span>
                        <span className="text-slate-400">
                          Total time worked: {formatTime(blockMinutes)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                        {screenshots.map((screenshot) => (
                          <ScreenshotCard key={screenshot.id} screenshot={screenshot} />
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </main>

          <InsightsRightSidebar
            open={sidebarOpen}
            onOpenChange={setSidebarOpen}
            members={DUMMY_MEMBERS}
            selectedFilter={selectedFilter}
            onSelectedFilterChange={setSelectedFilter}
          />
        </div>
      </div>
    </div>
  )
}
