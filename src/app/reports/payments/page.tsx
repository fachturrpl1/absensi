"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_PAYMENTS, DUMMY_PROJECTS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search, Filter, CreditCard, Clock, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { useTimezone } from "@/components/providers/timezone-provider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { PaymentsFilterSidebar } from "@/components/report/PaymentsFilterSidebar"
import { DataTable } from "@/components/tables/data-table"
import { columns } from "./columns"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
}

export default function PaymentsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 15),
        endDate: new Date(2026, 0, 30)
    })

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
                // Simple implementation for teams if needed
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
                className: "bg-gray-50 border-gray-200 text-gray-700"
            },
            {
                label: "Pending Payments",
                value: formatCurrency(pendingAmount),
                icon: Clock,
                className: "bg-gray-50 border-gray-200 text-gray-700"
            },
            {
                label: "Work Summary",
                value: `${totalHours.toFixed(1)} h`,
                subValue: `Avg Rate: ${formatCurrency(avgRate)}/h`,
                icon: CreditCard,
                className: "bg-gray-50 border-gray-200 text-gray-700"
            },
        ]
    }, [filteredData])

    const handleExport = () => {
        // Implementation for CSV export would go here
        // For now, logging to console
        console.log("Exporting filtered data:", filteredData)
        const csvContent = "data:text/csv;charset=utf-8,"
            + ["ID,Member,Date,Amount,Status,Method,Project"].join(",") + "\n"
            + filteredData.map(row =>
                `${row.id},${row.member.name},${row.date},${row.amount},${row.status},${row.method},${row.project}`
            ).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "payments_report.csv");
        document.body.appendChild(link);
        link.click();
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

            {/* Data Table */}
            <div className="bg-white border rounded-lg shadow-sm">
                <DataTable
                    columns={columns}
                    data={filteredData}
                    showColumnToggle={false}
                    showFilters={false}
                    showPagination={true}
                />
            </div>

            <PaymentsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={handleSidebarApply}
            />
        </div >
    )
}
