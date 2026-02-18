"use client"

import React, { useState, useMemo, useEffect } from "react"

import { format } from "date-fns"
import {
    DUMMY_MEMBERS,
    DUMMY_TEAMS,
    DUMMY_PROJECTS,
    DUMMY_CLIENTS,
    DUMMY_TASKS,
    DUMMY_TIME_ENTRIES,
    type TimeEntry
} from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, Search, Filter, ChevronDown, ChevronRight, Pencil, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

import { toast } from "sonner"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { TimesheetsFilterSidebar } from "@/components/timesheets/TimesheetsFilterSidebar"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { DateRangePicker } from "@/components/insights/DateRangePicker"

import { Checkbox } from "@/components/ui/checkbox"
import { EditTimeEntryDialog } from "@/components/timesheets/EditTimeEntryDialog"
import { SplitTimeEntryDialog } from "@/components/timesheets/SplitTimeEntryDialog"
import { DeleteTimeEntryDialog } from "@/components/timesheets/DeleteTimeEntryDialog"
import { AddTimeEntryDialog } from "@/components/timesheets/AddTimeEntryDialog"

import { QuickEditTimeDialog } from "@/components/timesheets/QuickEditTimeDialog"

const getProjectInitial = (name: string) => name.charAt(0).toUpperCase()

const findProject = (id: string, name: string) => DUMMY_PROJECTS.find(p => p.id === id || p.name === name)

const getClientName = (projectId: string, projectName: string) => {
    const project = findProject(projectId, projectName)
    if (!project?.clientId) return "No Client"
    return DUMMY_CLIENTS.find(c => c.id === project.clientId)?.name || "No Client"
}

const getTaskName = (taskId?: string, taskName?: string) => {
    if (taskName) return taskName
    if (taskId) return DUMMY_TASKS.find(t => t.id === taskId)?.title
    return "No to-do"
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

    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [quickEditDialogOpen, setQuickEditDialogOpen] = useState(false)
    const [splitTimeEntryDialogOpen, setSplitTimeEntryDialogOpen] = useState(false)
    const [deleteEntryDialogOpen, setDeleteEntryDialogOpen] = useState(false)
    const [addDialogOpen, setAddDialogOpen] = useState(false)

    const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
    const [activeQuickEditEntry, setActiveQuickEditEntry] = useState<TimeEntry | null>(null)

    const [data, setData] = useState<TimeEntry[]>([])
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

    const toggleGroup = (date: string) => {
        const newCollapsed = new Set(collapsedGroups)
        if (newCollapsed.has(date)) newCollapsed.delete(date)
        else newCollapsed.add(date)
        setCollapsedGroups(newCollapsed)
    }

    useEffect(() => {
        setData(DUMMY_TIME_ENTRIES)

        setDateRange({
            startDate: new Date(2026, 1, 1),
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
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    if (item.memberId !== selectedFilter.id) return false
                } else if (selectedFilter.type === 'teams') {
                    const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                    if (!team || !team.members.includes(item.memberId)) return false
                }
            }

            if (sidebarFilters.memberId !== 'all' && item.memberId !== sidebarFilters.memberId) return false
            if (sidebarFilters.projectId !== 'all' && item.projectId !== sidebarFilters.projectId) return false
            if (sidebarFilters.source !== 'all' && item.source !== sidebarFilters.source) return false
            if (sidebarFilters.status !== 'all' && item.status !== sidebarFilters.status) return false

            if (dateRange.startDate && dateRange.endDate) {
                const itemDate = new Date(item.date)
                if (itemDate < dateRange.startDate || itemDate > dateRange.endDate) return false
            }

            if (searchQuery) {
                const lower = searchQuery.toLowerCase()
                if (!item.memberName.toLowerCase().includes(lower) &&
                    !item.projectName.toLowerCase().includes(lower) &&
                    (!item.notes || !item.notes.toLowerCase().includes(lower))
                ) return false
            }

            return true
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [selectedFilter, sidebarFilters, dateRange, searchQuery, data])

    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

    const handleBulkExport = () => {
        const selectedData = filteredData.filter(item => selectedRows.has(item.id))

        exportToCSV({
            filename: generateFilename('selected-timesheets'),
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
            data: selectedData
        })
        toast.success(`Exported ${selectedData.length} entries`)
        setSelectedRows(new Set())
    }
    const handleEdit = (entry: TimeEntry) => {
        setActiveEntry(entry)
        setEditDialogOpen(true)
    }

    const handleSplitTime = (entry: TimeEntry) => {
        setActiveEntry(entry)
        setSplitTimeEntryDialogOpen(true)
    }

    const handleDeleteEntryClick = (entry: TimeEntry) => {
        setActiveEntry(entry)
        setDeleteEntryDialogOpen(true)
    }

    const onConfirmDelete = () => {
        if (activeEntry) {
            setData(prev => prev.filter(i => i.id !== activeEntry.id))
            toast.success("Time entry deleted")
        }
    }

    // Main Edit Save (General)
    const handleSaveEntry = (entry: Partial<TimeEntry>) => {
        if (activeEntry) {
            setData(prev => prev.map(item => item.id === activeEntry.id ? { ...item, ...entry } as TimeEntry : item))
            toast.success("Time entry updated")
        }
    }

    const handleQuickEditSave = (entry: Partial<TimeEntry>) => {
        if (activeQuickEditEntry) {
            setData(prev => prev.map(item => item.id === activeQuickEditEntry.id ? { ...item, ...entry } as TimeEntry : item))
            toast.success("Time entry updated")
            setActiveQuickEditEntry(null)
        }
    }

    const handleQuickEdit = (entry: TimeEntry) => {
        setActiveQuickEditEntry(entry)
        setQuickEditDialogOpen(true)
    }

    const handleAddEntry = (entry: Partial<TimeEntry>) => {
        const newEntry = {
            id: Math.random().toString(),
            memberName: DUMMY_MEMBERS.find(m => m.id === entry.memberId)?.name || "Unknown",
            projectName: DUMMY_PROJECTS.find(p => p.id === entry.projectId)?.name || "Unknown",
            taskName: DUMMY_TASKS.find(t => t.id === entry.taskId)?.title,
            ...entry
        } as TimeEntry
        setData(prev => [newEntry, ...prev])
        toast.success("Time entry added")
    }

    const onSplitTimeSave = (originalId: string, entry1: Partial<TimeEntry>, entry2: Partial<TimeEntry>) => {
        const newEntry1 = { ...activeEntry!, ...entry1, id: `te-${Date.now()}-1` } as TimeEntry
        const newEntry2 = { ...activeEntry!, ...entry2, id: `te-${Date.now()}-2` } as TimeEntry

        setData(prev => {
            const list = prev.filter(i => i.id !== originalId)
            return [...list, newEntry1, newEntry2]
        })
        toast.success("Time entry split successfully")
    }



    const toggleRow = (id: string) => {
        const newSelected = new Set(selectedRows)
        if (newSelected.has(id)) newSelected.delete(id)
        else newSelected.add(id)
        setSelectedRows(newSelected)
    }

    const toggleGroupSelection = (date: string, currentRows: TimeEntry[]) => {
        const dateRows = currentRows.filter(r => r.date === date)
        const allSelected = dateRows.every(r => selectedRows.has(r.id))

        const newSelected = new Set(selectedRows)
        if (allSelected) {
            dateRows.forEach(r => newSelected.delete(r.id))
        } else {
            dateRows.forEach(r => newSelected.add(r.id))
        }
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
        <div className="px-6 pb-6 space-y-3">
            <h1 className="text-xl font-semibold">View & Edit Timesheets</h1>
            <div className="w-full md:w-1/2 lg:w-1/3">
                <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    timezone={timezone}
                />
            </div>

            <div className="w-full md:w-64 space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MEMBERS</label>
                    <button
                        onClick={() => setSelectedFilter({ type: "members", all: true, id: "all" })}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                    </button>
                </div>
                <SearchableSelect
                    value={selectedFilter.id === 'all' || !selectedFilter.id ? "" : selectedFilter.id}
                    onValueChange={(val) => setSelectedFilter({ type: "members", all: !val, id: val || "all" })}
                    options={DUMMY_MEMBERS.map(m => ({ value: m.id, label: m.name }))}
                    placeholder="Select members"
                    searchPlaceholder="Search members..."
                    className="w-full"
                />
            </div>

            {/* Toolbar: Search, Filter, Add */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex w-full md:w-64">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search..."
                                className="pl-9 h-10 bg-white w-full rounded-r-none border-r-0 focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            className="h-10 rounded-l-none border-l-0 px-3 bg-gray-50 text-gray-600 hover:bg-gray-100"
                            onClick={() => setFilterSidebarOpen(true)}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-9" onClick={() => setAddDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Time
                    </Button>
                </div>
            </div>

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
                                {visibleCols.actions && <th className="p-3 font-semibold text-gray-900">Actions</th>}
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
                                paginatedData.map((row, index) => {
                                    const showHeader = index === 0 || row.date !== paginatedData[index - 1]?.date
                                    const isCollapsed = collapsedGroups.has(row.date)
                                    const groupRows = paginatedData.filter(r => r.date === row.date)
                                    const isGroupSelected = groupRows.length > 0 && groupRows.every(r => selectedRows.has(r.id))
                                    const isGroupIndeterminate = groupRows.some(r => selectedRows.has(r.id)) && !isGroupSelected

                                    return (
                                        <React.Fragment key={row.id}>
                                            {showHeader && (
                                                <tr
                                                    className="bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => toggleGroup(row.date)}
                                                >
                                                    <td colSpan={10} className="p-3 font-semibold text-gray-900">
                                                        <div className="flex items-center gap-2">
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <Checkbox
                                                                    checked={isGroupSelected || (isGroupIndeterminate ? "indeterminate" : false)}
                                                                    onCheckedChange={() => toggleGroupSelection(row.date, paginatedData)}
                                                                />
                                                            </div>
                                                            {isCollapsed ? (
                                                                <ChevronRight className="w-4 h-4 text-gray-500" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                                            )}
                                                            {format(new Date(row.date), 'EEE, dd MMM yyyy')}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {!isCollapsed && (
                                                <tr className="hover:bg-gray-100 even:bg-gray-50 transition-colors group">
                                                    {visibleCols.checkbox && (
                                                        <td className="p-3">
                                                            <Checkbox
                                                                checked={selectedRows.has(row.id)}
                                                                onCheckedChange={() => toggleRow(row.id)}
                                                            />
                                                        </td>
                                                    )}
                                                    {visibleCols.project && (
                                                        <td className="p-3">
                                                            <div className="flex items-start gap-3">
                                                                <Link href={`/projects/${row.projectId}`}>
                                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0 hover:bg-gray-200 cursor-pointer transition-colors">
                                                                        {getProjectInitial(row.projectName)}
                                                                    </div>
                                                                </Link>
                                                                <div className="flex flex-col">
                                                                    <Link href={`/projects/${row.projectId}`} className="font-bold text-gray-900 hover:text-blue-500 hover:underline cursor-pointer text-sm">
                                                                        {row.projectName}
                                                                    </Link>
                                                                    <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wide">
                                                                        {getClientName(row.projectId, row.projectName)}
                                                                    </span>
                                                                    <Link
                                                                        href={`/projects/tasks/list?project=${encodeURIComponent(row.projectName)}&q=${encodeURIComponent(getTaskName(row.taskId, row.taskName) || "")}`}
                                                                        className="text-xs font-medium text-gray-700 hover:text-blue-500 hover:underline cursor-pointer"
                                                                    >
                                                                        {getTaskName(row.taskId, row.taskName)}
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleCols.activity && (
                                                        <td className="p-3">
                                                            <span className="text-gray-900">{row.activityPct}%</span>
                                                        </td>
                                                    )}
                                                    {visibleCols.idle && (
                                                        <td className="p-3">
                                                            <span className="text-gray-900">{row.isIdle ? '100%' : '0%'}</span>
                                                        </td>
                                                    )}
                                                    {visibleCols.manual && (
                                                        <td className="p-3">
                                                            <span className="text-gray-900">{row.source === 'manual' ? '100%' : '0%'}</span>
                                                        </td>
                                                    )}
                                                    {visibleCols.duration && (
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-1">
                                                                <span
                                                                    className="text-gray-900 hover:text-blue-500 hover:underline cursor-pointer"
                                                                    onClick={() => handleQuickEdit(row)}
                                                                >
                                                                    {row.duration}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleCols.source && (
                                                        <td className="p-3">
                                                            <span className="text-gray-900">{row.source.charAt(0).toUpperCase() + row.source.slice(1)}</span>
                                                        </td>
                                                    )}
                                                    {visibleCols.time && (
                                                        <td className="p-3">
                                                            <span
                                                                className="text-gray-900 hover:text-blue-500 hover:underline cursor-pointer"
                                                                onClick={() => handleQuickEdit(row)}
                                                            >
                                                                {row.startTime} - {row.endTime}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleCols.actions && (
                                                        <td className="p-3">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                                        <Pencil className="h-3 w-3" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleEdit(row)}>
                                                                        Edit time entry
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleSplitTime(row)}>
                                                                        Split time entry
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleDeleteEntryClick(row)} className="text-red-600">
                                                                        Delete this entry
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    )}
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })
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
                initialData={activeEntry}
                onSave={handleSaveEntry}
            />

            <SplitTimeEntryDialog
                open={splitTimeEntryDialogOpen}
                onOpenChange={setSplitTimeEntryDialogOpen}
                initialData={activeEntry}
                projects={DUMMY_PROJECTS}
                tasks={DUMMY_TASKS}
                onSave={onSplitTimeSave}
            />

            <AddTimeEntryDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSave={handleAddEntry}
            />

            <QuickEditTimeDialog
                open={quickEditDialogOpen}
                onOpenChange={setQuickEditDialogOpen}
                initialData={activeQuickEditEntry}
                onSave={handleQuickEditSave}
            />

            <DeleteTimeEntryDialog
                open={deleteEntryDialogOpen}
                onOpenChange={setDeleteEntryDialogOpen}
                onConfirm={onConfirmDelete}
            />

            {selectedRows.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border shadow-lg rounded-full px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-4 z-50 animate-in slide-in-from-bottom-5 max-w-[calc(100vw-2rem)] overflow-x-auto">
                    <span className="text-sm font-medium text-gray-900 border-r pr-3 sm:pr-4 whitespace-nowrap">
                        {selectedRows.size} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="default" onClick={handleBulkExport} className="h-8 cursor-pointer px-2 sm:px-3">
                            <Download className="w-4 h-4 mr-0 sm:mr-2" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 ml-2 rounded-full hover:bg-gray-100"
                        onClick={() => setSelectedRows(new Set())}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}
