"use client"

import React, { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_JOB_SITE_VISITS } from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, SlidersHorizontal, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { format } from "date-fns"

export default function VisitsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 31)
    })

    // Custom Filters
    const [searchQuery, setSearchQuery] = useState("")

    // Pagination
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Column visibility
    const [visibleCols, setVisibleCols] = useState({
        member: true,
        site: true,
        address: true,
        date: true,
        entry: true,
        exit: true,
        duration: true,
        project: true,
    })

    const toggleCol = (key: keyof typeof visibleCols, value: boolean) => {
        setVisibleCols((prev) => ({ ...prev, [key]: value }))
    }

    // Filter Logic
    const filteredData = useMemo(() => {
        return DUMMY_JOB_SITE_VISITS.filter(item => {
            // Header Filter
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    if (item.memberId !== selectedFilter.id) return false
                } else if (selectedFilter.type === 'teams') {
                    const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                    if (!team || !team.members.includes(item.memberId)) return false
                }
            }

            // Date Range
            if (dateRange.startDate && dateRange.endDate) {
                const visitDate = new Date(item.date)
                if (visitDate < dateRange.startDate || visitDate > dateRange.endDate) return false
            }

            // Search
            if (searchQuery) {
                const lower = searchQuery.toLowerCase()
                const matches =
                    item.memberName.toLowerCase().includes(lower) ||
                    item.siteName.toLowerCase().includes(lower) ||
                    (item.projectName && item.projectName.toLowerCase().includes(lower))
                if (!matches) return false
            }

            return true
        })
    }, [selectedFilter, dateRange, searchQuery])

    // Summary Stats
    const stats = useMemo(() => {
        const totalVisits = filteredData.length
        const totalMinutes = filteredData.reduce((sum, v) => sum + (v.duration || 0), 0)
        const uniqueSites = new Set(filteredData.map(v => v.siteName)).size
        const activeVisits = filteredData.filter(v => !v.exitTime).length

        return { totalVisits, totalMinutes, uniqueSites, activeVisits }
    }, [filteredData])

    // Pagination
    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('job-site-visits'),
            columns: [
                { key: 'memberName', label: 'Member' },
                { key: 'siteName', label: 'Job Site' },
                { key: 'siteAddress', label: 'Address' },
                { key: 'date', label: 'Date' },
                { key: 'entryTime', label: 'Entry' },
                { key: 'exitTime', label: 'Exit' },
                { key: 'duration', label: 'Duration (m)' },
                { key: 'projectName', label: 'Project' },
            ],
            data: filteredData
        })
        toast.success("Exported successfully")
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #f9fafb !important;
                }
            `}</style>
            <div className="sticky top-0 z-20 border-b border-gray-200 bg-white">
                <div className="px-6 py-4">
                    <h1 className="text-xl font-semibold mb-5">Visits</h1>

                    <InsightsHeader
                        selectedFilter={selectedFilter}
                        onSelectedFilterChange={setSelectedFilter}
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        members={DUMMY_MEMBERS}
                        teams={DUMMY_TEAMS}
                        timezone={timezone}
                    >
                        <Button variant="outline" className="h-9" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </InsightsHeader>
                </div>
            </div>

            <main className="flex-1 bg-gray-50/50 p-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Visits", value: stats.totalVisits },
                        { label: "Total Time", value: `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m` },
                        { label: "Unique Sites", value: stats.uniqueSites },
                        { label: "Active Visits", value: stats.activeVisits },
                    ].map((card, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className="text-2xl font-bold mt-1 text-gray-900">
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-4">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search visits..."
                            className="ps-9 pl-9 h-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 bg-white">
                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuCheckboxItem checked={visibleCols.member} onCheckedChange={(v) => toggleCol('member', !!v)}>Member</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.site} onCheckedChange={(v) => toggleCol('site', !!v)}>Job Site</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.address} onCheckedChange={(v) => toggleCol('address', !!v)}>Address</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.date} onCheckedChange={(v) => toggleCol('date', !!v)}>Date</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.entry} onCheckedChange={(v) => toggleCol('entry', !!v)}>Entry</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.exit} onCheckedChange={(v) => toggleCol('exit', !!v)}>Exit</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.duration} onCheckedChange={(v) => toggleCol('duration', !!v)}>Duration</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.project} onCheckedChange={(v) => toggleCol('project', !!v)}>Project</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Table */}
                <div className="bg-white border rounded-lg shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                {visibleCols.member && <th className="p-4 font-semibold">Member</th>}
                                {visibleCols.site && <th className="p-4 font-semibold">Job Site</th>}
                                {visibleCols.address && <th className="p-4 font-semibold">Address</th>}
                                {visibleCols.date && <th className="p-4 font-semibold">Date</th>}
                                {visibleCols.entry && <th className="p-4 font-semibold">Entry</th>}
                                {visibleCols.exit && <th className="p-4 font-semibold">Exit</th>}
                                {visibleCols.duration && <th className="p-4 font-semibold text-right">Duration</th>}
                                {visibleCols.project && <th className="p-4 font-semibold">Project</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        No visits found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors custom-hover-row">
                                        {visibleCols.member && (
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                                                        {row.memberName.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{row.memberName}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.site && <td className="p-4 text-gray-900 font-medium">{row.siteName}</td>}
                                        {visibleCols.address && <td className="p-4 text-gray-500 text-xs max-w-[200px] truncate" title={row.siteAddress}>{row.siteAddress}</td>}
                                        {visibleCols.date && <td className="p-4 text-gray-600">{format(new Date(row.date), 'MMM dd, yyyy')}</td>}
                                        {visibleCols.entry && <td className="p-4 text-gray-600">{row.entryTime}</td>}
                                        {visibleCols.exit && (
                                            <td className="p-4 text-gray-600">
                                                {row.exitTime || (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        On Site
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        {visibleCols.duration && (
                                            <td className="p-4 text-right text-gray-900 font-medium">
                                                {row.duration ? `${Math.floor(row.duration / 60)}h ${row.duration % 60}m` : '-'}
                                            </td>
                                        )}
                                        {visibleCols.project && <td className="p-4 text-gray-600">{row.projectName || '-'}</td>}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="mt-4">
                    <PaginationFooter
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        from={filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                        to={Math.min(page * pageSize, filteredData.length)}
                        total={filteredData.length}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        className="bg-transparent border-none shadow-none"
                    />
                </div>
            </main>
        </div>
    )
}
