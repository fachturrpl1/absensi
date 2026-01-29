"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_TIME_OFF_BALANCES, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/pagination-footer"
import { useTimezone } from "@/components/timezone-provider"
import { cn } from "@/lib/utils"

export default function TimeOffBalancesPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 31)
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const pageSize = 10

    const filteredData = useMemo(() => {
        let data = DUMMY_TIME_OFF_BALANCES || []

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

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.memberName.toLowerCase().includes(query) ||
                item.policyName.toLowerCase().includes(query)
            )
        }

        return data
    }, [selectedFilter, searchQuery])

    const summaryCards = useMemo(() => {
        const totalAccrued = filteredData.reduce((sum, t) => sum + t.accrued, 0)
        const totalUsed = filteredData.reduce((sum, t) => sum + t.used, 0)
        const totalPending = filteredData.reduce((sum, t) => sum + t.pending, 0)
        const totalBalance = filteredData.reduce((sum, t) => sum + t.balance, 0)

        return [
            { label: "Total Accrued", value: `${totalAccrued} days` },
            { label: "Total Used", value: `${totalUsed} days` },
            { label: "Pending Requests", value: `${totalPending} days` },
            { label: "Total Balance", value: `${totalBalance} days` },
        ]
    }, [filteredData])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Time off balances</h1>

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
                            placeholder="Search member or policy..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4">Member</th>
                                <th className="p-4">Policy</th>
                                <th className="p-4 text-right">Accrued</th>
                                <th className="p-4 text-right">Used</th>
                                <th className="p-4 text-right">Pending</th>
                                <th className="p-4 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.map((row, idx) => (
                                <tr
                                    key={row.id}
                                    style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                    className="transition-colors custom-hover-row"
                                >
                                    <td className="p-4 font-medium text-gray-900">{row.memberName}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-medium",
                                            row.policyName === 'Annual Leave' ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
                                        )}>
                                            {row.policyName}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">{row.accrued} {row.unit}</td>
                                    <td className="p-4 text-right">{row.used} {row.unit}</td>
                                    <td className="p-4 text-right">
                                        {row.pending > 0 ? (
                                            <span className="text-yellow-600">{row.pending} {row.unit}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={cn(
                                            "font-bold",
                                            row.balance > 5 ? "text-green-600" : row.balance > 2 ? "text-yellow-600" : "text-red-600"
                                        )}>
                                            {row.balance} {row.unit}
                                        </span>
                                    </td>
                                </tr>
                            ))}
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
