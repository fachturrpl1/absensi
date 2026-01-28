"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_AUDIT_LOG, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/pagination-footer"
import { useTimezone } from "@/components/timezone-provider"

const actionLabels: Record<string, string> = {
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    approve: 'Approve',
    reject: 'Reject'
}

const entityLabels: Record<string, string> = {
    timesheet: 'Timesheet',
    expense: 'Expense',
    project: 'Project',
    member: 'Member',
    client: 'Client'
}

export default function AuditLogPage() {
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
        let data = DUMMY_AUDIT_LOG

        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => {
                const date = item.timestamp?.split(' ')[0]
                return date && date >= startStr && date <= endStr
            })
        }

        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.userId === selectedFilter.id)
            }
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.userName.toLowerCase().includes(query) ||
                item.entityName.toLowerCase().includes(query) ||
                (item.changes && item.changes.toLowerCase().includes(query))
            )
        }

        return data
    }, [dateRange, selectedFilter, searchQuery])

    const summaryCards = useMemo(() => {
        const total = filteredData.length
        const creates = filteredData.filter(a => a.action === 'create').length
        const updates = filteredData.filter(a => a.action === 'update').length
        const deletes = filteredData.filter(a => a.action === 'delete').length

        return [
            { label: "Total Actions", value: total },
            { label: "Creates", value: creates },
            { label: "Updates", value: updates },
            { label: "Deletes", value: deletes },
        ]
    }, [filteredData])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Audit log</h1>

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
                            placeholder="Search user, entity, or changes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">User</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Entity Type</th>
                                <th className="p-4">Entity</th>
                                <th className="p-4">Changes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.map((log, idx) => (
                                <tr
                                    key={log.id}
                                    style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                    className="transition-colors custom-hover-row"
                                >
                                    <td className="p-4 text-gray-600 text-xs">{log.timestamp}</td>
                                    <td className="p-4 font-medium text-gray-900">{log.userName}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                            {actionLabels[log.action] || String(log.action)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{entityLabels[log.entityType] || String(log.entityType)}</td>
                                    <td className="p-4 text-gray-600">{log.entityName}</td>
                                    <td className="p-4 text-gray-600 text-xs">{log.changes}</td>
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
