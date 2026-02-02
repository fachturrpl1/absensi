"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_PAYMENTS, DUMMY_PROJECTS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search, Filter, CreditCard, Clock, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { PaginationFooter } from "@/components/pagination-footer"
import { useTimezone } from "@/components/timezone-provider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { PaymentsFilterSidebar } from "@/components/report/PaymentsFilterSidebar"
import { AuditLogAuthorCell } from "@/components/report/AuditLogAuthorCell"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
}

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'Completed':
            return "bg-green-100 text-green-700 border-green-200"
        case 'Pending':
            return "bg-yellow-100 text-yellow-700 border-yellow-200"
        case 'Failed':
            return "bg-red-100 text-red-700 border-red-200"
        default:
            return "bg-gray-100 text-gray-700 border-gray-200"
    }
}

export default function PaymentsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 15),
        endDate: new Date(2026, 0, 30)
    })
    const [page, setPage] = useState(1)
    const pageSize = 10

    // Local Filters
    const [searchQuery, setSearchQuery] = useState("")

    // Sidebar Filters
    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [sidebarFilters, setSidebarFilters] = useState({
        method: "all",
        status: "all",
        project: "all"
    })

    const handleSidebarApply = (filters: { method: string, status: string, project: string }) => {
        setSidebarFilters({
            method: filters.method || "all",
            status: filters.status || "all",
            project: filters.project || "all"
        })
        setFilterSidebarOpen(false)
    }

    const filteredData = useMemo(() => {
        let data = DUMMY_PAYMENTS

        // Date Range Filter
        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            // Safer date comparison
            data = data.filter(item => {
                const itemDate = item.date.substring(0, 10)
                return itemDate >= startStr && itemDate <= endStr
            })
        }

        // Header Member/Team Filter
        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                const selectedMember = DUMMY_MEMBERS.find(m => m.id === selectedFilter.id)
                if (selectedMember) {
                    data = data.filter(item => item.member.name === selectedMember.name)
                }
            } else if (selectedFilter.type === 'teams') {
                // Simple implementation
            }
        }

        // Search Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.member.name.toLowerCase().includes(lowerQuery) ||
                item.notes.toLowerCase().includes(lowerQuery) ||
                (item.project && item.project.toLowerCase().includes(lowerQuery))
            )
        }

        // Sidebar Filters
        if (sidebarFilters.method !== 'all') {
            data = data.filter(item => item.method === sidebarFilters.method)
        }
        if (sidebarFilters.status !== 'all') {
            data = data.filter(item => item.status === sidebarFilters.status)
        }
        if (sidebarFilters.project !== 'all') {
            const selectedProject = DUMMY_PROJECTS.find(p => p.id === sidebarFilters.project)
            if (selectedProject) {
                data = data.filter(item => item.project === selectedProject.name)
            }
        }

        return data
    }, [dateRange, selectedFilter, searchQuery, sidebarFilters])

    // Summary Calculations
    const summaryCards = useMemo(() => {
        const totalPaid = filteredData
            .filter(p => p.status === 'Completed')
            .reduce((sum, p) => sum + p.amount, 0)

        const pendingAmount = filteredData
            .filter(p => p.status === 'Pending')
            .reduce((sum, p) => sum + p.amount, 0)

        const totalHours = filteredData.reduce((sum, p) => sum + p.hours, 0)
        const avgRate = totalHours > 0
            ? filteredData.reduce((sum, p) => sum + (p.rate * p.hours), 0) / totalHours
            : 0

        return [
            {
                label: "Total Paid",
                value: formatCurrency(totalPaid),
                icon: CheckCircle,
                className: "bg-green-50 border-green-200 text-green-700"
            },
            {
                label: "Pending Payments",
                value: formatCurrency(pendingAmount),
                icon: Clock,
                className: "bg-yellow-50 border-yellow-200 text-yellow-700"
            },
            {
                label: "Work Summary",
                value: `${totalHours.toFixed(1)} h`,
                subValue: `Avg Rate: ${formatCurrency(avgRate)}/h`,
                icon: CreditCard,
                className: "bg-blue-50 border-blue-200 text-blue-700"
            },
        ]
    }, [filteredData])

    // Pagination
    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    const handleExport = () => {
        console.log("Exporting Payments Report", filteredData)
    }

    return (
        <div className="px-6 py-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Payments Report</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search notes or members..."
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

            {/* Separated Summary Cards - 3 Distinct Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summaryCards.map((card, idx) => (
                    <div key={idx} className="p-6 bg-white border rounded-xl shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            {card.subValue && (
                                <p className="text-xs text-gray-500 mt-1">{card.subValue}</p>
                            )}
                        </div>
                        <div className={cn("p-2 rounded-lg", card.className)}>
                            <card.icon className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Container */}
            <div className="bg-white border rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4 w-48">Member</th>
                                <th className="p-4 w-40">Project</th>
                                <th className="p-4 w-32">Date Paid</th>
                                <th className="p-4 w-32">Method</th>
                                <th className="p-4 text-right w-24">Hours</th>
                                <th className="p-4 text-right w-24">Rate</th>
                                <th className="p-4 text-right w-32">Amount</th>
                                <th className="p-4 w-32">Status</th>
                                <th className="p-4">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">
                                        No payments found
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((payment) => (
                                    <tr
                                        key={payment.id}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="p-4 align-middle">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="inline-flex cursor-pointer">
                                                        <AuditLogAuthorCell
                                                            author={{
                                                                ...payment.member,
                                                                avatarUrl: payment.member.avatar,
                                                                // Fallback if styling is removed/placeholder
                                                                color: payment.member.color === 'placeholder' ? undefined : payment.member.color
                                                            }}
                                                            showName={true}
                                                            showRing={true}
                                                            avatarClassName="ring-2 ring-white"
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-gray-900 text-white border-0">
                                                    <p>{payment.member.name}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </td>
                                        <td className="p-4 align-middle text-gray-900 font-medium">
                                            {payment.project || "—"}
                                        </td>
                                        <td className="p-4 align-middle text-gray-600">
                                            {format(new Date(payment.date), 'MMM d, yyyy')}
                                        </td>
                                        <td className="p-4 align-middle text-gray-600">
                                            {payment.method}
                                        </td>
                                        <td className="p-4 align-middle text-right text-gray-900">
                                            {payment.hours.toFixed(1)} h
                                        </td>
                                        <td className="p-4 align-middle text-right text-gray-600">
                                            {formatCurrency(payment.rate)}
                                        </td>
                                        <td className="p-4 align-middle text-right font-bold text-gray-900">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                getStatusBadgeColor(payment.status)
                                            )}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-gray-500 truncate max-w-xs">
                                            {payment.notes}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t">
                    <PaginationFooter
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        from={paginatedData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                        to={Math.min(page * pageSize, filteredData.length)}
                        total={filteredData.length}
                        pageSize={pageSize}
                        onPageSizeChange={() => { }}
                        className="bg-transparent shadow-none border-none"
                    />
                </div>
            </div>

            <PaymentsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={handleSidebarApply}
            />
        </div>
    )
}
