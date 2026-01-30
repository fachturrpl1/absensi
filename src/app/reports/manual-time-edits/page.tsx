"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_MANUAL_EDITS, DUMMY_MEMBERS, DUMMY_TEAMS, type ManualEditEntry } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Info, Search } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/pagination-footer"
import { useTimezone } from "@/components/timezone-provider"
import { exportToCSV, generateFilename, type ExportColumn } from "@/lib/export-utils"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ManualTimeEditsPage() {
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
    const [activeTab, setActiveTab] = useState<'me' | 'all'>('all')
    const pageSize = 10

    // Filter Logic
    const filteredData = useMemo(() => {
        let data = DUMMY_MANUAL_EDITS

        // Date Range Filter
        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => item.date >= startStr && item.date <= endStr)
        }

        // Member Filter
        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.memberId === selectedFilter.id)
            }
        }

        // Search Filter (Member Name, Note, Project)
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter((item: ManualEditEntry) =>
                item.memberName.toLowerCase().includes(query) ||
                item.reason.toLowerCase().includes(query) ||
                item.projectName.toLowerCase().includes(query) ||
                item.action.toLowerCase().includes(query) ||
                (item.taskName && item.taskName.toLowerCase().includes(query))
            )
        }

        // Tab Filter (Me vs All - Mocking 'Me' as 'm1' for now)
        if (activeTab === 'me') {
            const currentUserId = 'm1' // Assume logged in user is m1
            data = data.filter((item: ManualEditEntry) => item.memberId === currentUserId)
        }

        // Sort by changedAt descending
        return data.sort((a: ManualEditEntry, b: ManualEditEntry) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    }, [dateRange, selectedFilter, searchQuery, activeTab])

    // Summary Statistics
    const summaryCards = useMemo(() => {
        const uniqueMembers = new Set(filteredData.map(e => e.memberId)).size

        // Parse time changes (e.g., "-0:30:00" or "+1:00:00")
        let addedMinutes = 0
        let removedMinutes = 0

        filteredData.forEach((entry: ManualEditEntry) => {
            const isPositive = entry.timeChange.startsWith('+')
            const timeStr = entry.timeChange.replace(/[+-]/, '')
            const parts = timeStr.split(':').map(Number)
            const hours = parts[0] || 0
            const mins = parts[1] || 0
            const totalMins = (hours * 60) + mins

            if (isPositive) addedMinutes += totalMins
            else removedMinutes += totalMins
        })

        const formatDuration = (totalMins: number) => {
            const h = Math.floor(totalMins / 60)
            const m = totalMins % 60
            return `${h}:${m.toString().padStart(2, '0')}:00`
        }

        return [
            { label: "AFFECTED MEMBERS", value: uniqueMembers, color: "text-gray-600" },
            { label: "HOURS ADDED", value: formatDuration(addedMinutes), color: "text-gray-600" },
            { label: "HOURS DELETED", value: formatDuration(removedMinutes), color: "text-gray-600" } // Green as per screenshot for deleted? Or Red? Screenshot shows green.
        ]
    }, [filteredData])

    // Pagination
    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page])
    const totalPages = Math.ceil(filteredData.length / pageSize)

    // Grouping by Date for Display
    const groupedData = useMemo(() => {
        const groups: { [key: string]: ManualEditEntry[] } = {}
        paginatedData.forEach((item: ManualEditEntry) => {
            if (!groups[item.date]) groups[item.date] = []
            groups[item.date]!.push(item)
        })
        return groups
    }, [paginatedData])

    const handleExport = () => {
        const columns: ExportColumn[] = [
            { label: 'Member', key: 'memberName' },
            { label: 'Project', key: 'projectName' },
            { label: 'Task', key: 'taskName' },
            { label: 'Action', key: 'action' },
            { label: 'Time Span', key: 'timeSpan' },
            { label: 'Time Change', key: 'timeChange' },
            { label: 'Reason', key: 'reason' },
            { label: 'Changed By', key: 'changedByName' },
            { label: 'Changed At', key: 'changedAt' },
            { label: 'Date', key: 'date' }
        ]
        const filename = generateFilename('manual-time-edits')
        exportToCSV({ data: filteredData, columns, filename })
        toast.success('Manual Edit Report exported successfully')
    }

    const getActionColor = (action: string) => {
        switch (action) {
            case 'Add': return 'bg-green-100 text-green-700'
            case 'Edit': return 'bg-blue-100 text-blue-700'
            case 'Delete': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Manual time edits report</h1>

            <div className="flex items-center space-x-4 mb-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'me' | 'all')}>
                    <TabsList>
                        <TabsTrigger value="me">ME</TabsTrigger>
                        <TabsTrigger value="all">ALL</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={setSelectedFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={DUMMY_MEMBERS}
                teams={DUMMY_TEAMS}
                timezone={timezone}
                hideFilter // Hide default filter if custom one needed, but we used standard
            >
                <>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search action, member..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 ps-9 w-[250px]"
                        />
                    </div>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </>
            </InsightsHeader>

            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 divide-x border rounded-lg bg-white mb-6 shadow-sm">
                {summaryCards.map((card, idx) => (
                    <div key={idx} className="p-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{card.label}</p>
                        <p className={`text-3xl font-light ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Table Container */}
            <div className="bg-white border rounded-lg shadow-sm">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                    <div className="text-sm font-medium text-gray-900">
                        SMK 100 Brantas <span className="text-gray-500 font-normal">Asia - Bangkok</span>
                    </div>{/*jangan tambah button send, schedule, export*/}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">Member</th>
                                <th className="px-4 py-3 font-medium">Project</th>
                                <th className="px-4 py-3 font-medium">Task</th>
                                <th className="px-4 py-3 font-medium">Action</th>
                                <th className="px-4 py-3 font-medium">Time Span</th>
                                <th className="px-4 py-3 font-medium">Time change</th>
                                <th className="px-4 py-3 font-medium">Reason</th>
                                <th className="px-4 py-3 font-medium">Changed by</th>
                                <th className="px-4 py-3 font-medium text-right">Changed at</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Object.entries(groupedData).flatMap(([date, items]) => [
                                /* Date Group Header Row */
                                <tr key={`header-${date}`} className="bg-gray-50/50">
                                    <td colSpan={9} className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
                                        Changes made {format(new Date(date), 'EEE, MMM d, yyyy')}
                                    </td>
                                </tr>,
                                /* Items Rows */
                                ...items.map((item: ManualEditEntry) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs shrink-0">
                                                    {item.memberName.charAt(0)}
                                                </div>
                                                <span className="font-medium truncate max-w-[120px]" title={item.memberName}>{item.memberName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 truncate max-w-[120px]" title={item.projectName}>
                                            {item.projectName}
                                        </td>
                                        <td className="px-4 py-3 truncate max-w-[120px] text-gray-500" title={item.taskName || ''}>
                                            {item.taskName || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(item.action)}`}>
                                                {item.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                            {item.timeSpan || '-'}
                                        </td>
                                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                                            {item.timeChange}
                                            <Info className="w-3 h-3 inline ml-1 text-gray-400 cursor-help" />
                                        </td>
                                        <td className="px-4 py-3 truncate max-w-[150px] text-gray-500" title={item.reason}>
                                            {item.reason}
                                        </td>
                                        <td className="px-4 py-3 truncate max-w-[120px]">
                                            {item.changedByName}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                                            {format(new Date(item.changedAt), 'h:mm a')}
                                        </td>
                                    </tr>
                                ))
                            ])}

                            {Object.keys(groupedData).length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">
                                        No manual edits found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t">
                    <PaginationFooter
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        from={filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                        to={Math.min(page * pageSize, filteredData.length)}
                        total={filteredData.length}
                        pageSize={pageSize}
                        onPageSizeChange={() => { }}
                        className="bg-transparent shadow-none border-none p-0"
                    />
                </div>
            </div>
        </div>
    )
}
