"use client"

import React, { useState, useMemo } from "react"
import { ReportPageLayout } from "@/components/report/report-page-layout"
import { Button } from "@/components/ui/button"
import { Download, CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { PaginationFooter } from "@/components/pagination-footer"
import { Input } from "@/components/ui/input"
import { exportToCSV, generateFilename, formatCurrencyForExport, formatHoursForExport } from "@/lib/export-utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// --- Dummy Data Local for Amounts Owed ---
interface AmountsOwedData {
    id: string
    name: string
    email: string
    team: string
    hourlyRate: number
    currency: string
    regularHours: number
    overtimeHours: number
    totalHours: number
    amountOwed: number
    paymentStatus: 'Unpaid' | 'Paid' | 'Processing'
}

const DUMMY_AMOUNTS_OWED: AmountsOwedData[] = [
    { id: 'm1', name: 'John Doe', email: 'john@ubig.co.id', team: 'Engineering', hourlyRate: 150000, currency: 'IDR', regularHours: 160, overtimeHours: 5, totalHours: 165, amountOwed: 25500000, paymentStatus: 'Unpaid' },
    { id: 'm2', name: 'Jane Smith', email: 'jane@ubig.co.id', team: 'Design', hourlyRate: 140000, currency: 'IDR', regularHours: 155, overtimeHours: 0, totalHours: 155, amountOwed: 21700000, paymentStatus: 'Processing' },
    { id: 'm3', name: 'Bob Johnson', email: 'bob@ubig.co.id', team: 'Engineering', hourlyRate: 160000, currency: 'IDR', regularHours: 160, overtimeHours: 10, totalHours: 170, amountOwed: 28800000, paymentStatus: 'Paid' },
    { id: 'm4', name: 'Alice Williams', email: 'alice@ubig.co.id', team: 'Marketing', hourlyRate: 130000, currency: 'IDR', regularHours: 140, overtimeHours: 2, totalHours: 142, amountOwed: 18720000, paymentStatus: 'Unpaid' },
    { id: 'm5', name: 'Charlie Brown', email: 'charlie@ubig.co.id', team: 'Design', hourlyRate: 135000, currency: 'IDR', regularHours: 150, overtimeHours: 0, totalHours: 150, amountOwed: 20250000, paymentStatus: 'Unpaid' },
    { id: 'm6', name: 'Diana Prince', email: 'diana@ubig.co.id', team: 'Product', hourlyRate: 170000, currency: 'IDR', regularHours: 158, overtimeHours: 4, totalHours: 162, amountOwed: 27880000, paymentStatus: 'Processing' },
    { id: 'm7', name: 'Evan Wright', email: 'evan@ubig.co.id', team: 'Engineering', hourlyRate: 155000, currency: 'IDR', regularHours: 160, overtimeHours: 8, totalHours: 168, amountOwed: 26840000, paymentStatus: 'Unpaid' },
    { id: 'm8', name: 'Fiona Green', email: 'fiona@ubig.co.id', team: 'Marketing', hourlyRate: 125000, currency: 'IDR', regularHours: 145, overtimeHours: 0, totalHours: 145, amountOwed: 18125000, paymentStatus: 'Paid' },
]

export default function AmountsOwedPage() {
    // Filters
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2026, 0, 1),
        to: new Date(2026, 0, 31),
    })
    const [teamFilter, setTeamFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [search, setSearch] = useState("")

    // Pagination
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Derived Logic
    const filteredData = useMemo(() => {
        return DUMMY_AMOUNTS_OWED.filter(item => {
            const matchesTeam = teamFilter === "all" || item.team === teamFilter
            const matchesStatus = statusFilter === "all" || item.paymentStatus === statusFilter
            const matchesSearch = search === "" ||
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.email.toLowerCase().includes(search.toLowerCase())

            return matchesTeam && matchesStatus && matchesSearch
        })
    }, [teamFilter, statusFilter, search])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page, pageSize])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    // Aggregates
    const totalOwed = filteredData.reduce((sum, item) => sum + item.amountOwed, 0)
    const totalHours = filteredData.reduce((sum, item) => sum + item.totalHours, 0)

    // Handlers
    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('amounts-owed'),
            columns: [
                { key: 'name', label: 'Member' },
                { key: 'team', label: 'Team' },
                { key: 'hourlyRate', label: 'Hourly Rate', format: (v) => formatCurrencyForExport(v) },
                { key: 'totalHours', label: 'Total Hours', format: (v) => formatHoursForExport(v) },
                { key: 'amountOwed', label: 'Amount Owed', format: (v) => formatCurrencyForExport(v) },
                { key: 'paymentStatus', label: 'Status' }
            ],
            data: filteredData
        })
        toast.success("Exported successfully")
    }

    return (
        <ReportPageLayout
            title="Amounts owed"
            breadcrumbs={[
                { label: "Reports", href: "/reports/all" },
                { label: "Amounts owed" }
            ]}
            actions={
                <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            }
            filters={
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Member Search */}
                        <div className="relative w-[240px]">
                            <Input
                                placeholder="Search member..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white"
                            />
                        </div>

                        {/* Team Filter */}
                        <Select value={teamFilter} onValueChange={setTeamFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Teams" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Teams</SelectItem>
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Design">Design</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Product">Product</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Unpaid">Unpaid</SelectItem>
                                <SelectItem value="Processing">Processing</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} -{" "}
                                                {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            }
        >
            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #d1d5db !important;
                }
                html body.dark .custom-hover-row:hover,
                html body.dark .custom-hover-row:hover > td {
                    background-color: #374151 !important;
                }
            `}</style>

            <div className="bg-white border rounded-lg shadow-sm">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b bg-gray-50/50">
                    <div className="p-4">
                        <p className="text-sm font-medium text-gray-500">Total Owed</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalOwed)}
                        </p>
                    </div>
                    <div className="p-4">
                        <p className="text-sm font-medium text-gray-500">Total Hours</p>
                        <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)} h</p>
                    </div>
                    <div className="p-4">
                        <p className="text-sm font-medium text-gray-500">Active Members</p>
                        <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4">Member</th>
                                <th className="p-4">Team</th>
                                <th className="p-4 text-right">Hourly Rate</th>
                                <th className="p-4 text-right">Regular (h)</th>
                                <th className="p-4 text-right">Overtime (h)</th>
                                <th className="p-4 text-right">Total (h)</th>
                                <th className="p-4 text-right">Amount Owed</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        No data found for the selected filters
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr
                                        key={item.id}
                                        style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                        className="transition-colors custom-hover-row"
                                    >
                                        <td className="p-4 font-medium text-gray-900">
                                            <div className="flex flex-col">
                                                <span>{item.name}</span>
                                                <span className="text-xs text-gray-500">{item.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">{item.team}</td>
                                        <td className="p-4 text-right text-gray-600">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.hourlyRate)}
                                            <span className="text-xs text-gray-400">/hr</span>
                                        </td>
                                        <td className="p-4 text-right text-gray-600">{item.regularHours}</td>
                                        <td className="p-4 text-right text-gray-600">{item.overtimeHours}</td>
                                        <td className="p-4 text-right font-medium text-gray-900">{item.totalHours}</td>
                                        <td className="p-4 text-right font-bold text-gray-900">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amountOwed)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                item.paymentStatus === 'Paid' && "bg-green-100 text-green-800",
                                                item.paymentStatus === 'Unpaid' && "bg-red-100 text-red-800",
                                                item.paymentStatus === 'Processing' && "bg-yellow-100 text-yellow-800",
                                            )}>
                                                {item.paymentStatus}
                                            </span>
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
                        from={filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                        to={Math.min(page * pageSize, filteredData.length)}
                        total={filteredData.length}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        className="bg-transparent shadow-none border-none"
                    />
                </div>
            </div>
        </ReportPageLayout>
    )
}
