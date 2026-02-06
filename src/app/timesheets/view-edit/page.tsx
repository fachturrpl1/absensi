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
import { Download, Search, Filter, Plus, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/tables/pagination-footer"

import { toast } from "sonner"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { TimesheetsFilterSidebar } from "@/components/timesheets/TimesheetsFilterSidebar"
import { EditTimeEntryDialog } from "@/components/timesheets/EditTimeEntryDialog"
import { Checkbox } from "@/components/ui/checkbox"



const getProjectInitial = (name: string) => name.charAt(0).toUpperCase()

const getClientName = (projectId: string) => {
    const project = DUMMY_PROJECTS.find(p => p.id === projectId)
    return project?.clientName || "No Client"
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
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

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

    const [visibleCols] = useState({
        checkbox: true,
        project: true,
        activity: true,
        idle: true,
        manual: true,
        duration: true,
        source: true,
        time: true,
        actions: true
    })

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

    const toggleRow = (id: string) => {
        const newSelected = new Set(selectedRows)
        if (newSelected.has(id)) newSelected.delete(id)
        else newSelected.add(id)
        setSelectedRows(newSelected)
    }

    const toggleAll = () => {
        if (selectedRows.size === paginatedData.length) {
            setSelectedRows(new Set())
        } else {
            setSelectedRows(new Set(paginatedData.map(d => d.id)))
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
                                {visibleCols.checkbox && (
                                    <th className="p-3 w-10">
                                        <Checkbox
                                            checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                                            onCheckedChange={toggleAll}
                                        />
                                    </th>
                                )}
                                {visibleCols.project && <th className="p-3 font-semibold text-gray-900">Project</th>}
                                {visibleCols.activity && <th className="p-3 font-semibold text-gray-900">Activity</th>}
                                {visibleCols.idle && <th className="p-3 font-semibold text-gray-900">Idle</th>}
                                {visibleCols.manual && <th className="p-3 font-semibold text-gray-900">Manual</th>}
                                {visibleCols.duration && <th className="p-3 font-semibold text-gray-900">Duration</th>}
                                {visibleCols.source && <th className="p-3 font-semibold text-gray-900">Source</th>}
                                {visibleCols.time && <th className="p-3 font-semibold text-gray-900">Time</th>}
                                {visibleCols.actions && <th className="p-3 font-semibold text-gray-900 text-right">Actions</th>}
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
                                    <tr key={row.id} className="hover:bg-gray-100 even:bg-gray-50 transition-colors group">
                                        {visibleCols.checkbox && (
                                            <td className="p-4">
                                                <Checkbox
                                                    checked={selectedRows.has(row.id)}
                                                    onCheckedChange={() => toggleRow(row.id)}
                                                />
                                            </td>
                                        )}
                                        {visibleCols.project && (
                                            <td className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                        {getProjectInitial(row.projectName)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 text-[15px]">{row.projectName}</span>
                                                        <span className="text-xs uppercase text-gray-500 font-semibold tracking-wide my-0.5">{getClientName(row.projectId)}</span>
                                                        <span className="text-sm font-bold text-gray-900 mt-0.5">{row.taskName || "No to-do"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.activity && (
                                            <td className="p-4 align-top pt-6">
                                                <span className="text-gray-900">{row.activityPct}%</span>
                                            </td>
                                        )}
                                        {visibleCols.idle && (
                                            <td className="p-4 align-top pt-6">
                                                <span className="text-gray-900">{row.isIdle ? '100%' : '0%'}</span>
                                            </td>
                                        )}
                                        {visibleCols.manual && (
                                            <td className="p-4 align-top pt-6">
                                                <span className="text-gray-900">{row.source === 'manual' ? '100%' : '0%'}</span>
                                            </td>
                                        )}
                                        {visibleCols.duration && (
                                            <td className="p-4 align-top pt-6">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-blue-500 font-medium">{row.duration}</span>
                                                    <span className="text-gray-900 font-bold">$</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.source && (
                                            <td className="p-4 align-top pt-6">
                                                <span className="text-gray-900">{row.source.charAt(0).toUpperCase() + row.source.slice(1)}</span>
                                            </td>
                                        )}
                                        {visibleCols.time && (
                                            <td className="p-4 align-top pt-6">
                                                <span className="text-blue-500 hover:underline cursor-pointer">
                                                    {row.startTime} - {row.endTime}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.actions && (
                                            <td className="p-4 align-top pt-6 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
