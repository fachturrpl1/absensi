"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_WORK_SESSIONS, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/pagination-footer"
import { useTimezone } from "@/components/timezone-provider"

export default function WorkSessionsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
        type: "members",
        all: true,
        id: "all"
    })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 19),
        endDate: new Date(2026, 0, 25)
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const pageSize = 10

    // Filter data
    const filteredData = useMemo(() => {
        let data = DUMMY_WORK_SESSIONS || []

        // Filter by date range
        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => item.date >= startStr && item.date <= endStr)
        }

        // Filter by member/team
        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.memberId === selectedFilter.id)
            } else if (selectedFilter.type === 'teams') {
                const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                if (team) {
                    data = data.filter(item => team.members.includes(item.memberId))
                }
            }
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.memberName.toLowerCase().includes(query) ||
                (item.projectName && item.projectName.toLowerCase().includes(query)) ||
                (item.session && item.session.toLowerCase().includes(query))
            )
        }

        return data
    }, [dateRange, selectedFilter, searchQuery])

    // Summary cards
    const summaryCards = useMemo(() => {
        const totalSessions = filteredData.length
        const totalMinutes = filteredData.reduce((sum, s) => sum + s.duration, 0)
        const avgDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0
        const uniqueMembers = new Set(filteredData.map(s => s.memberId)).size

        return [
            { label: "Total Sessions", value: totalSessions },
            { label: "Total Hours", value: (totalMinutes / 60).toFixed(1) + " h" },
            { label: "Avg Duration", value: `${Math.round(avgDuration)} min` },
            { label: "Active Members", value: uniqueMembers },
        ]
    }, [filteredData])

    // Paginated data
    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page, pageSize])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    const handleExport = () => {
        // Export logic here
        console.log('Exporting work sessions data...')
    }

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Work sessions</h1>

            <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={setSelectedFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={DUMMY_MEMBERS}
                teams={DUMMY_TEAMS}
                timezone={timezone}
            >
                <Button
                    variant="outline"
                    className="h-9 text-gray-700 border-gray-300 bg-white hover:bg-gray-50 font-medium"
                    onClick={handleExport}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </InsightsHeader>

            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #d1d5db !important;
                }
            `}</style>

            <div className="mt-6 bg-white border rounded-lg shadow-sm">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-b bg-gray-50/50">
                    {summaryCards.map((card, idx) => (
                        <div key={idx} className="p-4">
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="p-4 border-b">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search member or project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4">Member</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Start Time</th>
                                <th className="p-4">End Time</th>
                                <th className="p-4 text-right">Duration</th>
                                <th className="p-4">Session</th>
                                <th className="p-4">Project</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.map((session, idx) => {
                                const mins = session.duration
                                const hours = Math.floor(mins / 60)
                                const minutes = mins % 60
                                return (
                                    <tr
                                        key={session.id}
                                        style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                        className="transition-colors custom-hover-row"
                                    >
                                        <td className="p-4 font-medium text-gray-900">{session.memberName}</td>
                                        <td className="p-4 text-gray-600">{session.date}</td>
                                        <td className="p-4 text-gray-600">{session.startTime}</td>
                                        <td className="p-4 text-gray-600">{session.endTime}</td>
                                        <td className="p-4 text-right font-medium">{hours}h {minutes}m</td>
                                        <td className="p-4 text-gray-600">{session.session || '-'}</td>
                                        <td className="p-4 text-gray-600">{session.projectName || '-'}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t">
                    <PaginationFooter
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        from={filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                        to={Math.min(page * pageSize, filteredData.length)}
                        total={filteredData.length}
                        pageSize={pageSize}
                        onPageSizeChange={() => { }}
                        className="bg-transparent shadow-none border-none"
                    />
                </div>
            </div>
        </div>
    )
}
