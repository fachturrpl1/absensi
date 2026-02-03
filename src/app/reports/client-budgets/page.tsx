"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_CLIENT_BUDGETS, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { useTimezone } from "@/components/providers/timezone-provider"
import { cn } from "@/lib/utils"

export default function ClientBudgetsPage() {
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
        let data = DUMMY_CLIENT_BUDGETS

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.clientName.toLowerCase().includes(query)
            )
        }

        return data
    }, [selectedFilter, searchQuery])

    const summaryCards = useMemo(() => {
        const totalClients = filteredData.length
        const totalBudget = filteredData.reduce((sum, c) => sum + c.totalBudget, 0)
        const totalSpent = filteredData.reduce((sum, c) => sum + c.spentBudget, 0)
        const atRiskOrOver = filteredData.filter(c => c.status !== 'on_track').length

        return [
            { label: "Total Clients", value: totalClients },
            { label: "Total Budget", value: `$${totalBudget.toLocaleString()}` },
            { label: "Total Spent", value: `$${totalSpent.toLocaleString()}` },
            { label: "At Risk / Over", value: atRiskOrOver },
        ]
    }, [filteredData])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Client Budgets</h1>

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
                            placeholder="Search client..."
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
                                <th className="p-4">Client</th>
                                <th className="p-4 text-center">Active Projects</th>
                                <th className="p-4 text-right">Total Budget</th>
                                <th className="p-4 text-right">Spent</th>
                                <th className="p-4 text-right">Remaining</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Progress</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.map((row, idx) => {
                                let statusColor = "text-green-600 bg-green-50"
                                if (row.status === 'at_risk') statusColor = "text-yellow-600 bg-yellow-50"
                                if (row.status === 'over_budget') statusColor = "text-red-600 bg-red-50"

                                return (
                                    <tr
                                        key={row.id}
                                        style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                        className="transition-colors custom-hover-row"
                                    >
                                        <td className="p-4 font-medium text-gray-900">{row.clientName}</td>
                                        <td className="p-4 text-center">{row.projectCount}</td>
                                        <td className="p-4 text-right font-medium">{row.currency} {row.totalBudget.toLocaleString()}</td>
                                        <td className="p-4 text-right">{row.currency} {row.spentBudget.toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <span className={cn(
                                                "font-medium",
                                                row.remainingBudget < 0 ? "text-red-600" : "text-green-600"
                                            )}>
                                                {row.currency} {row.remainingBudget.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium uppercase", statusColor)}>
                                                {row.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            row.progress > 100 ? "bg-red-500" : row.progress > 80 ? "bg-yellow-500" : "bg-green-500"
                                                        )}
                                                        style={{ width: `${Math.min(row.progress, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500">{row.progress.toFixed(0)}%</span>
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
