"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_MEMBER_LIMITS, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/pagination-footer"
import { useTimezone } from "@/components/timezone-provider"
import { cn } from "@/lib/utils"

export default function WeeklyLimitsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 19),
        endDate: new Date(2026, 0, 25)
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const pageSize = 10

    const filteredData = useMemo(() => {
        let data = DUMMY_MEMBER_LIMITS

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

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item => item.memberName.toLowerCase().includes(query))
        }

        return data
    }, [selectedFilter, searchQuery])

    const summaryCards = useMemo(() => {
        const totalMembers = filteredData.length
        const overLimit = filteredData.filter(m => m.weeklyUsed > m.weeklyLimit).length
        const avgUsage = totalMembers > 0 ? filteredData.reduce((sum, m) => sum + (m.weeklyUsed / m.weeklyLimit * 100), 0) / totalMembers : 0
        const totalHours = filteredData.reduce((sum, m) => sum + m.weeklyUsed, 0)

        return [
            { label: "Total Members", value: totalMembers },
            { label: "Over Limit", value: overLimit },
            { label: "Avg Usage", value: avgUsage.toFixed(0) + "%" },
            { label: "Total Hours", value: totalHours.toFixed(1) + " h" },
        ]
    }, [filteredData])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Weekly limits</h1>

            <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={setSelectedFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={DUMMY_MEMBERS}
                teams={DUMMY_TEAMS}
                timezone={timezone}
            >
                <Button variant="outline" className="h-9">
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
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-b bg-gray-50/50">
                    {summaryCards.map((card, idx) => (
                        <div key={idx} className="p-4">
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-b">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search member..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-9 pl-9"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4">Member</th>
                                <th className="p-4 text-right">Weekly Limit</th>
                                <th className="p-4 text-right">Hours Used</th>
                                <th className="p-4 text-right">Remaining</th>
                                <th className="p-4 text-center">Usage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.map((row, idx) => {
                                const remaining = row.weeklyLimit - row.weeklyUsed
                                const usage = (row.weeklyUsed / row.weeklyLimit) * 100
                                return (
                                    <tr
                                        key={row.id}
                                        style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                        className="transition-colors custom-hover-row"
                                    >
                                        <td className="p-4 font-medium text-gray-900">{row.memberName}</td>
                                        <td className="p-4 text-right">{row.weeklyLimit} h</td>
                                        <td className="p-4 text-right">{row.weeklyUsed.toFixed(1)} h</td>
                                        <td className="p-4 text-right">
                                            <span className={cn(
                                                "font-medium",
                                                remaining < 0 ? "text-red-600" : "text-green-600"
                                            )}>
                                                {remaining >= 0 ? `${remaining.toFixed(1)} h` : `${Math.abs(remaining).toFixed(1)} h over`}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            usage > 100 ? "bg-red-500" : usage > 80 ? "bg-yellow-500" : "bg-green-500"
                                                        )}
                                                        style={{ width: `${Math.min(usage, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500">{usage.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

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
