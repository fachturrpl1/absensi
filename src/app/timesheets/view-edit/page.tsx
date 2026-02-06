"use client"

import React, { useState, useMemo, useEffect } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import {
    DUMMY_MEMBERS,
    DUMMY_TEAMS,
    DUMMY_PROJECTS,
    DUMMY_TIME_ENTRIES,
    type TimeEntry
} from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, SlidersHorizontal, Search, Filter, Plus, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { format } from "date-fns"
import { TimesheetsFilterSidebar } from "@/components/timesheets/TimesheetsFilterSidebar"
import { EditTimeEntryDialog } from "@/components/timesheets/EditTimeEntryDialog"



const getStatusBadge = (status?: string) => {
    if (!status) return null
    switch (status) {
        case 'approved':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Approved</span>
        case 'pending':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Pending</span>
        case 'rejected':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Rejected</span>
        default:
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">{status}</span>
    }
}

export default function ViewEditTimesheetsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(),
        endDate: new Date()
    })

    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    // Sidebar State
    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [sidebarFilters, setSidebarFilters] = useState({
        memberId: "all",
        projectId: "all",
        source: "all",
        status: "all"
    })

    // Dialog State
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
    const [data, setData] = useState<TimeEntry[]>([])

    // Load Initial Data
    useEffect(() => {
        // Simulate fetch
        setData(DUMMY_TIME_ENTRIES)

        setDateRange({
            startDate: new Date(2026, 1, 1), // Feb 2026
            endDate: new Date(2026, 1, 28)
        })
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [visibleCols, setVisibleCols] = useState({
        member: true,
        date: true,
        times: true,
        duration: true,
        project: true,
        source: true,
        activity: true,
        notes: true,
        status: true,
        actions: true
    })

    const toggleCol = (key: keyof typeof visibleCols, value: boolean) => {
        setVisibleCols((prev) => ({ ...prev, [key]: value }))
    }

    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Header Filter
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    if (item.memberId !== selectedFilter.id) return false
                } else if (selectedFilter.type === 'teams') {
                    const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                    if (!team || !team.members.includes(item.memberId)) return false
                }
            }

            // Sidebar Filters
            if (sidebarFilters.memberId !== 'all' && item.memberId !== sidebarFilters.memberId) return false
            if (sidebarFilters.projectId !== 'all' && item.projectId !== sidebarFilters.projectId) return false
            if (sidebarFilters.source !== 'all' && item.source !== sidebarFilters.source) return false
            if (sidebarFilters.status !== 'all' && item.status !== sidebarFilters.status) return false


            // Date Range
            if (dateRange.startDate && dateRange.endDate) {
                const itemDate = new Date(item.date)
                if (itemDate < dateRange.startDate || itemDate > dateRange.endDate) return false
            }

            // Search
            if (searchQuery) {
                const lower = searchQuery.toLowerCase()
                if (!item.memberName.toLowerCase().includes(lower) &&
                    !item.projectName.toLowerCase().includes(lower) &&
                    (!item.notes || !item.notes.toLowerCase().includes(lower))
                ) return false
            }

            return true
        })
    }, [selectedFilter, sidebarFilters, dateRange, searchQuery, data])

    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('timesheets'),
            columns: [
                { key: 'memberName', label: 'Member' },
                { key: 'date', label: 'Date' },
                { key: 'startTime', label: 'Start Time' },
                { key: 'endTime', label: 'End Time' },
                { key: 'duration', label: 'Duration' },
                { key: 'projectName', label: 'Project' },
                { key: 'taskName', label: 'Task' },
                { key: 'source', label: 'Source' },
                { key: 'activityPct', label: 'Activity %' },
                { key: 'notes', label: 'Notes' },
                { key: 'status', label: 'Status' }
            ],
            data: filteredData
        })
        toast.success("Exported successfully")
    }

    const handleAdd = () => {
        setEditingEntry(null)
        setEditDialogOpen(true)
    }

    const handleEdit = (entry: TimeEntry) => {
        setEditingEntry(entry)
        setEditDialogOpen(true)
    }

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this time entry?")) {
            setData(prev => prev.filter(i => i.id !== id))
            toast.success("Time entry deleted")
        }
    }

    const handleSaveEntry = (entry: Partial<TimeEntry>) => {
        if (editingEntry) {
            // Edit
            setData(prev => prev.map(item => item.id === editingEntry.id ? { ...item, ...entry } as TimeEntry : item))
            toast.success("Time entry updated")
        } else {
            // Add
            const newEntry: TimeEntry = {
                id: `te-${Date.now()}`,
                memberId: entry.memberId!,
                memberName: DUMMY_MEMBERS.find(m => m.id === entry.memberId)?.name || 'Unknown',
                date: entry.date!,
                startTime: entry.startTime!,
                endTime: entry.endTime!,
                duration: "00:00:00", // Would calculate real duration here
                totalHours: 0,
                projectId: entry.projectId!,
                projectName: DUMMY_PROJECTS.find(p => p.id === entry.projectId)?.name || 'Unknown',
                source: entry.source as any || 'manual',
                activityPct: 0,
                notes: entry.notes,
                status: 'pending'
            }
            setData(prev => [newEntry, ...prev])
            toast.success("Time entry added")
        }
    }

    return (
        <div className="px-6 pb-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">View & Edit Timesheets</h1>
                <Button onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" /> Add Time
                </Button>
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
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search..."
                            className="pl-9 h-10 bg-white max-w-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        className="h-9 text-gray-700 border-gray-300 bg-white hover:bg-gray-50 font-medium"
                        onClick={() => setFilterSidebarOpen(true)}
                    >
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 bg-white text-gray-700 border-gray-300">
                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuCheckboxItem checked={visibleCols.member} onCheckedChange={(v) => toggleCol('member', !!v)}>Member</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.date} onCheckedChange={(v) => toggleCol('date', !!v)}>Date</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.times} onCheckedChange={(v) => toggleCol('times', !!v)}>Times</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.duration} onCheckedChange={(v) => toggleCol('duration', !!v)}>Duration</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.project} onCheckedChange={(v) => toggleCol('project', !!v)}>Project</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.source} onCheckedChange={(v) => toggleCol('source', !!v)}>Source</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.activity} onCheckedChange={(v) => toggleCol('activity', !!v)}>Activity</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.notes} onCheckedChange={(v) => toggleCol('notes', !!v)}>Notes</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.status} onCheckedChange={(v) => toggleCol('status', !!v)}>Status</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.actions} onCheckedChange={(v) => toggleCol('actions', !!v)}>Actions</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" className="h-9" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </InsightsHeader>

            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                            <tr>
                                {visibleCols.member && <th className="p-3 pl-4 font-semibold">Member</th>}
                                {visibleCols.date && <th className="p-3 font-semibold">Date</th>}
                                {visibleCols.times && <th className="p-3 font-semibold">Time</th>}
                                {visibleCols.duration && <th className="p-3 font-semibold">Duration</th>}
                                {visibleCols.project && <th className="p-3 font-semibold">Project/Task</th>}
                                {visibleCols.source && <th className="p-3 font-semibold">Source</th>}
                                {visibleCols.activity && <th className="p-3 font-semibold">Activity</th>}
                                {visibleCols.notes && <th className="p-3 font-semibold">Notes</th>}
                                {visibleCols.status && <th className="p-3 font-semibold">Status</th>}
                                {visibleCols.actions && <th className="p-3 pr-4 font-semibold text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-gray-500">No time entries found.</td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 even:bg-white bg-white transition-colors">
                                        {visibleCols.member && (
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                                                        {row.memberName.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{row.memberName}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.date && <td className="p-4 text-gray-600">{format(new Date(row.date), 'MMM dd, yyyy')}</td>}
                                        {visibleCols.times && (
                                            <td className="p-4 text-gray-900 font-mono">
                                                {row.startTime} - {row.endTime}
                                            </td>
                                        )}
                                        {visibleCols.duration && <td className="p-4 text-gray-900 font-bold">{row.duration}</td>}
                                        {visibleCols.project && (
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900">{row.projectName}</div>
                                                {row.taskName && <div className="text-xs text-gray-500">{row.taskName}</div>}
                                            </td>
                                        )}
                                        {visibleCols.source && (
                                            <td className="p-4">
                                                <span className="capitalize text-gray-900 font-medium">{row.source}</span>
                                            </td>
                                        )}
                                        {visibleCols.activity && (
                                            <td className="p-4">
                                                {row.source === 'manual' ? (
                                                    <span className="text-gray-400">-</span>
                                                ) : (
                                                    <span className={`font-mono ${row.activityPct < 30 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {row.activityPct}%
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        {visibleCols.notes && <td className="p-4 text-gray-500 italic max-w-xs truncate" title={row.notes}>{row.notes}</td>}
                                        {visibleCols.status && <td className="p-4">{getStatusBadge(row.status)}</td>}
                                        {visibleCols.actions && (
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600" onClick={() => handleEdit(row)}>
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600" onClick={() => handleDelete(row.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
                    isLoading={isLoading}
                />
            </div>

            <TimesheetsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                members={DUMMY_MEMBERS}
                projects={DUMMY_PROJECTS}
                onApply={setSidebarFilters}
            />

            <EditTimeEntryDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                initialData={editingEntry}
                onSave={handleSaveEntry}
            />
        </div>
    )
}
