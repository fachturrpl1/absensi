"use client"

import React, { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_INVOICES } from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, SlidersHorizontal, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename, formatCurrencyForExport } from "@/lib/export-utils"
import { format } from "date-fns"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function TeamInvoicesPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 31)
    })

    // Custom Filters
    const [statusFilter, setStatusFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")

    // Pagination
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Column visibility
    const [visibleCols, setVisibleCols] = useState({
        number: true,
        member: true,
        issueDate: true,
        dueDate: true,
        amount: true,
        status: true,
    })

    const toggleCol = (key: keyof typeof visibleCols, value: boolean) => {
        setVisibleCols((prev) => ({ ...prev, [key]: value }))
    }

    // Filter Logic
    const filteredInvoices = useMemo(() => {
        return DUMMY_INVOICES.filter(inv => {
            if (inv.type !== 'team') return false

            // Header Filter (Member/Team)
            let matchesHeader = true
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    matchesHeader = inv.entityId === selectedFilter.id
                } else if (selectedFilter.type === 'teams') {
                    const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                    matchesHeader = team ? team.members.includes(inv.entityId) : false
                }
            }
            if (!matchesHeader) return false

            const matchesStatus = statusFilter === 'all' || inv.status === statusFilter

            // Date Range Filter (Issue Date)
            let matchesDate = true
            if (dateRange.startDate && dateRange.endDate) {
                const invDate = new Date(inv.issueDate)
                matchesDate = invDate >= dateRange.startDate && invDate <= dateRange.endDate
            }

            const searchLower = searchQuery.toLowerCase()
            const matchesSearch =
                inv.invoiceNumber.toLowerCase().includes(searchLower) ||
                inv.entityName.toLowerCase().includes(searchLower)

            return matchesStatus && matchesDate && matchesSearch
        })
    }, [selectedFilter, statusFilter, dateRange, searchQuery])

    // Summary Stats
    const stats = useMemo(() => {
        const total = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0)
        const paid = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
        const outstanding = filteredInvoices.filter(inv => ['sent', 'draft'].includes(inv.status)).reduce((sum, inv) => sum + inv.amount, 0)

        return { total, paid, outstanding, count: filteredInvoices.length }
    }, [filteredInvoices])

    // Pagination
    const totalPages = Math.ceil(filteredInvoices.length / pageSize)
    const paginatedData = filteredInvoices.slice((page - 1) * pageSize, page * pageSize)

    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('team-invoices'),
            columns: [
                { key: 'invoiceNumber', label: 'Invoice #' },
                { key: 'entityName', label: 'Member' },
                { key: 'issueDate', label: 'Issue Date' },
                { key: 'dueDate', label: 'Due Date' },
                { key: 'amount', label: 'Amount', format: (v) => formatCurrencyForExport(v) },
                { key: 'status', label: 'Status' }
            ],
            data: filteredInvoices
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
                    <h1 className="text-xl font-semibold mb-5">Team invoices</h1>

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
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px] h-9 bg-white border-gray-300">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="outline" className="h-9" onClick={handleExport}>
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>

                            <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Invoice
                            </Button>
                        </div>
                    </InsightsHeader>
                </div>
            </div>

            <main className="flex-1 bg-gray-50/50 p-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Invoiced", value: stats.total, color: "text-gray-900" },
                        { label: "Paid", value: stats.paid, color: "text-green-600" },
                        { label: "Outstanding", value: stats.outstanding, color: "text-orange-600" },
                        { label: "Total Invoices", value: stats.count, isCount: true, color: "text-blue-600" }
                    ].map((card, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className={cn("text-2xl font-bold mt-1", card.color)}>
                                {card.isCount ? card.value : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(card.value as number)}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-4">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search invoice # or member..."
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
                            <DropdownMenuCheckboxItem checked={visibleCols.number} onCheckedChange={(v) => toggleCol('number', !!v)}>Invoice #</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.member} onCheckedChange={(v) => toggleCol('member', !!v)}>Member</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.issueDate} onCheckedChange={(v) => toggleCol('issueDate', !!v)}>Issue Date</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.dueDate} onCheckedChange={(v) => toggleCol('dueDate', !!v)}>Due Date</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.amount} onCheckedChange={(v) => toggleCol('amount', !!v)}>Amount</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.status} onCheckedChange={(v) => toggleCol('status', !!v)}>Status</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Table */}
                <div className="bg-white border rounded-lg shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                {visibleCols.number && <th className="p-4 font-semibold">Invoice #</th>}
                                {visibleCols.member && <th className="p-4 font-semibold">Member</th>}
                                {visibleCols.issueDate && <th className="p-4 font-semibold">Issue Date</th>}
                                {visibleCols.dueDate && <th className="p-4 font-semibold">Due Date</th>}
                                {visibleCols.amount && <th className="p-4 font-semibold text-right">Amount</th>}
                                {visibleCols.status && <th className="p-4 font-semibold text-center">Status</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors custom-hover-row">
                                    {visibleCols.number && <td className="p-4 font-medium text-blue-600 hover:underline cursor-pointer">{inv.invoiceNumber}</td>}
                                    {visibleCols.member && (
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                                                    {inv.entityName.charAt(0)}
                                                </div>
                                                <span className="text-gray-900">{inv.entityName}</span>
                                            </div>
                                        </td>
                                    )}
                                    {visibleCols.issueDate && <td className="p-4 text-gray-600">{format(new Date(inv.issueDate), 'MMM dd, yyyy')}</td>}
                                    {visibleCols.dueDate && <td className="p-4 text-gray-600">{format(new Date(inv.dueDate), 'MMM dd, yyyy')}</td>}
                                    {visibleCols.amount && (
                                        <td className="p-4 text-right font-medium text-gray-900">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(inv.amount)}
                                        </td>
                                    )}
                                    {visibleCols.status && (
                                        <td className="p-4 text-center">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                                                inv.status === 'paid' && "bg-green-100 text-green-800",
                                                inv.status === 'sent' && "bg-blue-100 text-blue-800",
                                                inv.status === 'draft' && "bg-gray-100 text-gray-800",
                                            )}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {paginatedData.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No team invoices found.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-4">
                    <PaginationFooter
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        from={filteredInvoices.length > 0 ? (page - 1) * pageSize + 1 : 0}
                        to={Math.min(page * pageSize, filteredInvoices.length)}
                        total={filteredInvoices.length}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        className="bg-transparent border-none shadow-none"
                    />
                </div>
            </main>
        </div>
    )
}
