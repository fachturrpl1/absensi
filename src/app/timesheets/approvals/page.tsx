"use client"

import React, { useState, useMemo, useEffect } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_TIMESHEET_APPROVALS } from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, Search, Filter, CheckCircle2, XCircle, Eye, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { format } from "date-fns"
import { TimesheetApprovalsFilterSidebar } from "@/components/report/TimesheetApprovalsFilterSidebar"
import { ApprovalDetailDialog } from "@/components/timesheets/approvals/ApprovalDetailDialog"
import { ActionConfirmDialog } from "@/components/timesheets/approvals/ActionConfirmDialog"
import type { TimesheetApproval } from "@/lib/data/dummy-data"

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Approved</span>
        case 'submitted':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>
        case 'open':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Open</span>
        case 'rejected':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Rejected</span>
        default:
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">{status}</span>
    }
}

export default function TimesheetApprovalsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 31)
    })

    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    // Data State
    const [approvals, setApprovals] = useState<TimesheetApproval[]>([])
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

    // UI State
    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [sidebarFilters, setSidebarFilters] = useState({
        memberId: "all",
        status: "all"
    })

    // Dialog States
    // Dialog States
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [actionDialogOpen, setActionDialogOpen] = useState(false)
    const [actionMode, setActionMode] = useState<'approve' | 'reject'>('approve')
    const [activeApproval, setActiveApproval] = useState<TimesheetApproval | null>(null)
    const [isBulkAction, setIsBulkAction] = useState(false)

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [visibleCols] = useState({
        checkbox: true,
        member: true,
        dateRange: true,
        totalHours: true,
        status: true,
        notes: true,
        actions: true
    })

    useEffect(() => {
        // Initialize with dummy data
        setApprovals(DUMMY_TIMESHEET_APPROVALS)
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    const filteredData = useMemo(() => {
        return approvals.filter(item => {
            // Header Filter
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    if (item.memberId !== selectedFilter.id) return false
                }
            }

            // Sidebar Filters
            if (sidebarFilters.memberId !== 'all' && item.memberId !== sidebarFilters.memberId) return false
            if (sidebarFilters.status !== 'all' && item.status !== sidebarFilters.status) return false

            // Date Range Filter (Check if range overlaps)
            if (dateRange.startDate && dateRange.endDate) {
                const itemStart = new Date(item.dateStart)
                const itemEnd = new Date(item.dateEnd)
                if (itemEnd < dateRange.startDate || itemStart > dateRange.endDate) return false
            }

            if (searchQuery) {
                const lower = searchQuery.toLowerCase()
                if (!item.memberName.toLowerCase().includes(lower) &&
                    (!item.comments || !item.comments.toLowerCase().includes(lower))) return false
            }

            return true
        })
    }, [approvals, selectedFilter, sidebarFilters, dateRange, searchQuery])

    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

    // Selection Handlers
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

    // Action Handlers
    // Action Handlers
    const handleApproveClick = (id: string) => {
        const approval = approvals.find(a => a.id === id)
        if (approval) {
            setActiveApproval(approval)
            setActionMode('approve')
            setIsBulkAction(false)
            setActionDialogOpen(true)
        }
    }

    const handleRejectClick = (approval: TimesheetApproval) => {
        setActiveApproval(approval)
        setActionMode('reject')
        setIsBulkAction(false)
        setActionDialogOpen(true)
    }

    const handleConfirmAction = (reason: string) => {
        const newStatus = actionMode === 'approve' ? 'approved' : 'rejected'
        const successConfig = actionMode === 'approve'
            ? { status: 'approved', approvalDate: new Date().toISOString(), comments: reason }
            : { status: 'rejected', comments: reason }

        if (isBulkAction) {
            setApprovals(prev => prev.map(a => selectedRows.has(a.id) ? { ...a, ...successConfig } as TimesheetApproval : a))
            toast.success(`${selectedRows.size} timesheets ${newStatus}`)
            setSelectedRows(new Set())
        } else if (activeApproval) {
            setApprovals(prev => prev.map(a => a.id === activeApproval.id ? { ...a, ...successConfig } as TimesheetApproval : a))
            toast.success(`Timesheet ${newStatus}`)
        }
        setDetailDialogOpen(false)
        setActionDialogOpen(false)
    }

    const handleBulkApprove = () => {
        setActionMode('approve')
        setIsBulkAction(true)
        setActionDialogOpen(true)
    }

    const handleBulkRejectClick = () => {
        setActionMode('reject')
        setIsBulkAction(true)
        setActionDialogOpen(true)
    }

    const handleViewDetails = (approval: TimesheetApproval) => {
        setActiveApproval(approval)
        setDetailDialogOpen(true)
    }

    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('timesheet-approvals'),
            columns: [
                { key: 'memberName', label: 'Member' },
                { key: 'dateStart', label: 'Start Date' },
                { key: 'dateEnd', label: 'End Date' },
                { key: 'totalHours', label: 'Total Hours' },
                { key: 'status', label: 'Status' },
                { key: 'approver', label: 'Approver' },
                { key: 'comments', label: 'Comments' }
            ],
            data: filteredData
        })
        toast.success("Exported successfully")
    }

    const summaryCards = useMemo(() => {
        const submitted = approvals.filter(i => i.status === 'submitted').length
        const approved = approvals.filter(i => i.status === 'approved').length
        const rejected = approvals.filter(i => i.status === 'rejected').length
        const open = approvals.filter(i => i.status === 'open').length
        return [
            { label: "Submitted", value: submitted },
            { label: "Approved", value: approved },
            { label: "Rejected", value: rejected },
            { label: "Open (Draft)", value: open },
        ]
    }, [approvals])

    return (
        <div className="px-6 pb-6 space-y-6">
            <h1 className="text-xl font-semibold">Timesheet Approvals</h1>

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
                    {selectedRows.size > 0 && (
                        <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4">
                            <span className="text-sm text-muted-foreground mr-2">{selectedRows.size} selected</span>
                            <Button size="sm" onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700 text-white border-green-700">
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={handleBulkRejectClick}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                            <div className="h-6 w-px bg-gray-200 mx-2" />
                        </div>
                    )}

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
                        className="h-9 text-gray-700 border-gray-300 bg-white hover:bg-gray-50 hover:cursor-pointer font-medium"
                        onClick={() => setFilterSidebarOpen(true)}
                    >
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>

                    <Button variant="outline" className="h-9 hover:cursor-pointer" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>

                    <Button variant="outline" className="h-9 hover:cursor-pointer">
                        <Link href="/settings/timesheets">
                            <Settings className="w-5 h-5" />
                        </Link>
                    </Button>
                </div>
            </InsightsHeader>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border rounded-lg shadow-sm bg-white">
                {summaryCards.map((card, idx) => (
                    <div key={idx} className="p-4">
                        <p className="text-sm font-medium text-gray-500">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    </div>
                ))}
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
                                {visibleCols.member && <th className="p-3 pl-4 font-semibold">Member</th>}
                                {visibleCols.dateRange && <th className="p-3 font-semibold">Period</th>}
                                {visibleCols.totalHours && <th className="p-3 font-semibold">Total Hours</th>}
                                {visibleCols.status && <th className="p-3 font-semibold">Status</th>}
                                {visibleCols.notes && <th className="p-3 font-semibold">Reason</th>}
                                {visibleCols.actions && <th className="p-3 font-semibold text-center">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No approvals found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-100 even:bg-gray-50 transition-colors">
                                        {visibleCols.checkbox && (
                                            <td className="p-3">
                                                <Checkbox
                                                    checked={selectedRows.has(row.id)}
                                                    onCheckedChange={() => toggleRow(row.id)}
                                                />
                                            </td>
                                        )}
                                        {visibleCols.member && (
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-bold">
                                                        {row.memberName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{row.memberName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.dateRange && (
                                            <td className="p-4 text-gray-600">
                                                {format(new Date(row.dateStart), 'MMM dd')} - {format(new Date(row.dateEnd), 'MMM dd, yyyy')}
                                            </td>
                                        )}
                                        {visibleCols.totalHours && <td className="p-4 text-gray-900 font-mono font-bold">{row.totalHours}</td>}
                                        {visibleCols.status && <td className="p-4">{getStatusBadge(row.status)}</td>}
                                        {visibleCols.notes && <td className="p-4 text-sm text-gray-500 italic max-w-xs truncate" title={row.comments}>{row.comments || "-"}</td>}

                                        {visibleCols.actions && (
                                            <td className="p-4 text-left">
                                                <div className="flex items-left gap-2 hover:cursor-pointer">
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(row)}>
                                                        <Eye className="w-4 h-4 mr-1" /> View
                                                    </Button>
                                                    {row.status === 'submitted' && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="hover:cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApproveClick(row.id)} title="Approve">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="hover:cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRejectClick(row)} title="Reject">
                                                                <XCircle className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
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

            <TimesheetApprovalsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                members={DUMMY_MEMBERS}
                onApply={setSidebarFilters}
            />

            <ApprovalDetailDialog
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                approval={activeApproval}
                onApprove={handleApproveClick}
                onReject={() => activeApproval && handleRejectClick(activeApproval)}
            />

            <ActionConfirmDialog
                open={actionDialogOpen}
                onOpenChange={setActionDialogOpen}
                onConfirm={handleConfirmAction}
                mode={actionMode}
            />
        </div >
    )
}
