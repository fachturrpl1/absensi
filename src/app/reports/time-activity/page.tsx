"use client"

import React, { useState } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { InsightsRightSidebar } from "@/components/insights/InsightsRightSidebar"
import { DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"

export default function TimeActivityPage() {
    // State
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2025, 0, 20),
        endDate: new Date(2025, 0, 21),
    })

    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
        type: 'members',
        all: false,
        id: 'm1',
    })

    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    // Derived state
    const selectedMember = selectedFilter.type === 'members'
        ? DUMMY_MEMBERS.find(m => m.id === selectedFilter.id)
        : undefined

    const handleFilterChange = (filter: SelectedFilter) => {
        setSelectedFilter(filter)
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={handleFilterChange}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={DUMMY_MEMBERS}
                teams={DUMMY_TEAMS}
                />

                <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    <div className="max-w-[1600px] mx-auto space-y-6">
                        {/* Placeholder for future Time & Activity content */}
                        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg border-muted">
                            <h3 className="text-lg font-medium">Time & Activity Report</h3>
                            <p className="text-muted-foreground mt-2">
                                Activity data for {selectedFilter.type === 'members' ? selectedMember?.name : 'Team'} will appear here.
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            <InsightsRightSidebar
                open={isSidebarOpen}
                onOpenChange={setIsSidebarOpen}
                members={DUMMY_MEMBERS}
                selectedFilter={selectedFilter}
                onSelectedFilterChange={handleFilterChange}
            />
        </div>
    )
}
