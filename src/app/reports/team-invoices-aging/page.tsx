"use client"

import React, { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_INVOICES } from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/pagination-footer"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTimezone } from "@/components/timezone-provider"
import { exportToCSV, generateFilename, formatCurrencyForExport } from "@/lib/export-utils"

export default function TeamInvoicesAgingPage() {
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

    // Agregasi Data
    const agingData = useMemo(() => {
        const teamInvoices = DUMMY_INVOICES.filter(inv => inv.type === 'team')

        // Filter Header (Member/Team) - This filters the invoices BEFORE aggregation? 
        // Or filters the resulting members?
        // Let's filter source invoices first, then aggregate.
        // Actually, for "Aging by Member", we should aggregate all invoices for the relevant members.

        const filteredSource = teamInvoices.filter(inv => {
            // Header Filter
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    if (inv.entityId !== selectedFilter.id) return false
                } else if (selectedFilter.type === 'teams') {
                    const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                    if (!team || !team.members.includes(inv.entityId)) return false
                }
            }
            return true
        })

        // Group by team member
        const memberMap: Record<string, {
            entityName: string
            current: number
            days30: number
            days60: number
            days90: number
            total: number
        }> = {}

        filteredSource.forEach(inv => {
            if (!memberMap[inv.entityId]) {
                memberMap[inv.entityId] = {
                    entityName: inv.entityName,
                    current: 0,
                    days30: 0,
                    days60: 0,
                    days90: 0,
                    total: 0,
                }
            }

            const entry = memberMap[inv.entityId]!

            // Simulate aging based on status
            if (inv.status === 'sent' || inv.status === 'draft') {
                entry.current += inv.amount
            } else if (inv.status === 'overdue') { // Assuming team invoices can be overdue or just unpaid
                // Distribute overdue amounts across aging buckets (Mock logic)
                // NOTE: Real logic would check Due Date vs Current Date
                const daysOverdue = Math.floor(Math.random() * 120)
                if (daysOverdue < 30) {
                    entry.current += inv.amount
                } else if (daysOverdue < 60) {
                    entry.days30 += inv.amount
                } else if (daysOverdue < 90) {
                    entry.days60 += inv.amount
                } else {
                    entry.days90 += inv.amount
                }
            }
            entry.total = entry.current + entry.days30 + entry.days60 + entry.days90
        })

        let aggregated = Object.entries(memberMap)
            .filter(([_, data]) => data.total > 0)
            .map(([id, data]) => ({ id, ...data }))

        // Search Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            aggregated = aggregated.filter(item => item.entityName.toLowerCase().includes(lowerQuery))
        }

        return aggregated
    }, [selectedFilter, searchQuery])

    // Totals
    const totals = useMemo(() => {
        return agingData.reduce((acc, member) => ({
            current: acc.current + member.current,
            days30: acc.days30 + member.days30,
            days60: acc.days60 + member.days60,
            days90: acc.days90 + member.days90,
            total: acc.total + member.total,
        }), { current: 0, days30: 0, days60: 0, days90: 0, total: 0 })
    }, [agingData])

    // Pagination
    const totalPages = Math.ceil(agingData.length / pageSize)
    const paginatedData = agingData.slice((page - 1) * pageSize, page * pageSize)

    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('team-invoices-aging'),
            columns: [
                { key: 'entityName', label: 'Team Member' },
                { key: 'current', label: 'Current', format: (v) => formatCurrencyForExport(v) },
                { key: 'days30', label: '1-30 Days', format: (v) => formatCurrencyForExport(v) },
                { key: 'days60', label: '31-60 Days', format: (v) => formatCurrencyForExport(v) },
                { key: 'days90', label: '61-90+ Days', format: (v) => formatCurrencyForExport(v) },
                { key: 'total', label: 'Total Outstanding', format: (v) => formatCurrencyForExport(v) },
            ],
            data: agingData
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
            <div className="border-b border-gray-200 bg-white">
                <div className="px-6 py-4">
                    <h1 className="text-xl font-semibold mb-5">Team invoices aging</h1>

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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    {[
                        { label: "Current", value: totals.current, color: "text-gray-900" },
                        { label: "1-30 Days", value: totals.days30, color: "text-yellow-600" },
                        { label: "31-60 Days", value: totals.days60, color: "text-orange-600" },
                        { label: "61-90+ Days", value: totals.days90, color: "text-red-600" },
                        { label: "Total Outstanding", value: totals.total, color: "text-gray-900", bold: true }
                    ].map((card, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className={cn("text-xl font-bold mt-1", card.color, card.bold && "text-2xl")}>
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(card.value)}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-4">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search member..."
                            className="pl-9 h-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border rounded-lg shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold">Team Member</th>
                                <th className="p-4 font-semibold text-right">Current</th>
                                <th className="p-4 font-semibold text-right">1-30 Days</th>
                                <th className="p-4 font-semibold text-right">31-60 Days</th>
                                <th className="p-4 font-semibold text-right">61-90+ Days</th>
                                <th className="p-4 font-semibold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No data found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 transition-colors custom-hover-row">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                                                    {member.entityName.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{member.entityName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-gray-600">{member.current > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(member.current) : '-'}</td>
                                        <td className="p-4 text-right text-yellow-600">{member.days30 > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(member.days30) : '-'}</td>
                                        <td className="p-4 text-right text-orange-600">{member.days60 > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(member.days60) : '-'}</td>
                                        <td className="p-4 text-right text-red-600">{member.days90 > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(member.days90) : '-'}</td>
                                        <td className="p-4 text-right font-bold text-gray-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(member.total)}</td>
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
                        from={agingData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                        to={Math.min(page * pageSize, agingData.length)}
                        total={agingData.length}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        className="bg-transparent border-none shadow-none"
                    />
                </div>
            </main>
        </div>
    )
}
