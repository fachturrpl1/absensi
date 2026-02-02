"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { DUMMY_AUDIT_LOGS, type AuditLogEntry } from "@/lib/data/dummy-audit"
import { Button } from "@/components/ui/button"
import { Download, Search, ChevronDown, ChevronRight } from "lucide-react"
import { format, parseISO } from "date-fns"
import { PaginationFooter } from "@/components/pagination-footer"
import { useTimezone } from "@/components/timezone-provider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function AuditLogPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 25), // Adjusted default start
        endDate: new Date(2026, 0, 30) // Adjusted default end
    })
    const [page, setPage] = useState(1)
    const pageSize = 20

    // Local Filters
    const [searchQuery, setSearchQuery] = useState("")

    // Expanded Groups State
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    const filteredData = useMemo(() => {
        let data = DUMMY_AUDIT_LOGS

        // Date Range
        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => item.date >= startStr && item.date <= endStr)
        }

        // Global Author Filter (using InsightsHeader selection)
        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.author.name === DUMMY_MEMBERS.find(m => m.id === selectedFilter.id)?.name)
            }
        }

        // Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.author.name.toLowerCase().includes(lowerQuery) ||
                item.details.toLowerCase().includes(lowerQuery) ||
                item.object.toLowerCase().includes(lowerQuery) ||
                item.id.toLowerCase().includes(lowerQuery)
            )
        }

        return data
    }, [dateRange, selectedFilter, searchQuery])

    // Grouping Logic
    const groupedData = useMemo(() => {
        const groups: Record<string, AuditLogEntry[]> = {}
        filteredData.forEach(item => {
            if (!groups[item.date]) {
                groups[item.date] = []
            }
            groups[item.date]!.push(item)
        })
        return groups
    }, [filteredData])

    // Sort Dates Descending
    const sortedDates = useMemo(() => {
        return Object.keys(groupedData).sort((a, b) => b.localeCompare(a))
    }, [groupedData])

    // Initialize all groups as expanded when data changes
    useMemo(() => {
        const initialExpanded: Record<string, boolean> = {}
        sortedDates.forEach(date => {
            initialExpanded[date] = true
        })
        setExpandedGroups(prev => Object.keys(prev).length === 0 ? initialExpanded : prev)
    }, [sortedDates])

    const toggleGroup = (date: string) => {
        setExpandedGroups(prev => ({ ...prev, [date]: !prev[date] }))
    }

    const handleExport = () => {
        // Simplified Export Logic
        alert("Exporting data...")
    }

    const getActionBadgeColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'added':
            case 'created':
                return "bg-green-100 text-green-700 border-green-200"
            case 'updated':
            case 'modified':
                return "bg-purple-100 text-purple-700 border-purple-200"
            case 'deleted':
            case 'removed':
                return "bg-red-100 text-red-700 border-red-200"
            default:
                return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    return (
        <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-xl font-semibold">Audit log</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search members or event details"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 ps-9 h-9 bg-white"
                        />
                    </div>
                </div>
            </div>

            <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={setSelectedFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={DUMMY_MEMBERS}
                teams={DUMMY_TEAMS}
                timezone={timezone}
            >
                <div className="flex gap-2">
                    <Button variant="outline" className="h-9" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        
                        Export
                    </Button>
                </div>
            </InsightsHeader>

            <div className="mt-4 flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 h-8 font-normal">
                    <div className="flex items-center gap-2">
                        <span className="flex flex-col gap-[2px]">
                            <div className="h-[2px] w-3 bg-blue-600 rounded-full"></div>
                            <div className="h-[2px] w-2 bg-blue-600 rounded-full"></div>
                            <div className="h-[2px] w-1 bg-blue-600 rounded-full"></div>
                        </span>
                        Group by Date
                    </div>
                </Button>
            </div>

            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                        <tr>
                            <th className="p-4 w-40">Date & Logs</th>
                            <th className="p-4 w-48">Author</th>
                            <th className="p-4 w-32">Time</th>
                            <th className="p-4 w-32">Action</th>
                            <th className="p-4 w-40">Object</th>
                            <th className="p-4 w-48">Member</th>
                            <th className="p-4">Detail</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedDates.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">
                                    No logs found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            sortedDates.map(date => (
                                <>
                                    <tr key={date} className="bg-gray-50/50 hover:bg-gray-50 cursor-pointer" onClick={() => toggleGroup(date)}>
                                        <td colSpan={7} className="p-3">
                                            <div className="flex items-center gap-2 font-medium text-gray-900">
                                                {expandedGroups[date] ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                {format(parseISO(date), 'EEE, MMM d, yyyy')}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedGroups[date] && groupedData[date] && groupedData[date]!.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="p-4 align-top">
                                                <span className="text-xs font-mono text-gray-500 group-hover:text-blue-600 transition-colors">{item.id}</span>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className={cn("text-xs text-white", item.author.color || "bg-gray-400")}>
                                                            {item.author.initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-gray-900">{item.author.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top text-gray-600 whitespace-nowrap">
                                                {item.time}
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                    getActionBadgeColor(item.action)
                                                )}>
                                                    {item.action}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top text-gray-900">
                                                {item.object}
                                            </td>
                                            <td className="p-4 align-top">
                                                {item.members && item.members.length > 0 ? (
                                                    <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all">
                                                        {item.members.map((member, mIdx) => (
                                                            <div key={mIdx} className="relative group/member cursor-help">
                                                                <Avatar className="h-8 w-8 ring-2 ring-white">
                                                                    <AvatarFallback className={cn("text-[10px] text-white", member.color || "bg-gray-400")}>
                                                                        {member.initials}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/member:block px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-10">
                                                                    {member.name}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top text-gray-600">
                                                {item.details}
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4">
                <PaginationFooter
                    page={page}
                    totalPages={Math.ceil(sortedDates.length / pageSize)}
                    onPageChange={setPage}
                    from={1}
                    to={filteredData.length}
                    total={filteredData.length}
                    pageSize={pageSize}
                    onPageSizeChange={() => { }}
                    className="bg-transparent shadow-none border-none justify-end"
                />
            </div>
        </div>
    )
}
