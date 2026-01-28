"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_PENDING_REQUESTS, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/pagination-footer"
import { useTimezone } from "@/components/timezone-provider"
import { cn } from "@/lib/utils"

const requestTypeLabels: Record<string, string> = {
    annual_leave: 'Annual Leave',
    sick_leave: 'Sick Leave',
    overtime: 'Overtime',
    permission: 'Permission'
}

export default function TimeOffTransactionsPage() {
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
        let data = DUMMY_PENDING_REQUESTS || []

        // Filter by date range
        if (dateRange.startDate && dateRange.endDate) {
            const startStr = dateRange.startDate.toISOString().slice(0, 10)
            const endStr = dateRange.endDate.toISOString().slice(0, 10)
            data = data.filter(item => item.requestDate >= startStr && item.requestDate <= endStr)
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

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.memberName.toLowerCase().includes(query) ||
                (item.notes && item.notes.toLowerCase().includes(query))
            )
        }

        return data
    }, [dateRange, selectedFilter, searchQuery])

    const summaryCards = useMemo(() => {
        const total = filteredData.length
        const pending = filteredData.filter(r => r.status === 'pending').length
        const approved = filteredData.filter(r => r.status === 'approved').length
        const rejected = filteredData.filter(r => r.status === 'rejected').length

        return [
            { label: "Total Requests", value: total },
            { label: "Pending", value: pending },
            { label: "Approved", value: approved },
            { label: "Rejected", value: rejected },
        ]
    }, [filteredData])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Time off transactions</h1>

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
                            placeholder="Search member..."
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
                                <th className="p-4">Type</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Notes</th>
                                <th className="p-4 text-center">Status</th>
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
                                            row.requestType === 'annual_leave' && "bg-blue-100 text-blue-800",
                                            row.requestType === 'sick_leave' && "bg-orange-100 text-orange-800",
                                            row.requestType === 'overtime' && "bg-purple-100 text-purple-800",
                                            row.requestType === 'permission' && "bg-gray-100 text-gray-800",
                                        )}>
                                            {requestTypeLabels[row.requestType] || String(row.requestType)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{row.requestDate}</td>
                                    <td className="p-4 text-gray-600 max-w-xs truncate">{row.notes || '-'}</td>
                                    <td className="p-4 text-center">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                            row.status === 'approved' && "bg-green-100 text-green-800",
                                            row.status === 'pending' && "bg-yellow-100 text-yellow-800",
                                            row.status === 'rejected' && "bg-red-100 text-red-800",
                                        )}>
                                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
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
