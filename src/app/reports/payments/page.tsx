"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_REPORT_ACTIVITIES, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/pagination-footer"
import { useTimezone } from "@/components/timezone-provider"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
}

export default function PaymentsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 19),
        endDate: new Date(2026, 0, 25)
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const pageSize = 10

    // Filter activities by date and member/team
    const filteredActivities = useMemo(() => {
        let data = DUMMY_REPORT_ACTIVITIES

        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => item.date >= startStr && item.date <= endStr)
        }

        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.memberId === selectedFilter.id)
            } else if (selectedFilter.type === 'teams') {
                data = data.filter(item => item.teamId === selectedFilter.id)
            }
        }

        return data
    }, [dateRange, selectedFilter])

    // Aggregate payments by member from filtered data
    const paymentData = useMemo(() => {
        const memberPayments: Record<string, { memberId: string; memberName: string; totalHours: number; totalSpent: number }> = {}

        filteredActivities.forEach(activity => {
            if (!memberPayments[activity.memberId]) {
                memberPayments[activity.memberId] = {
                    memberId: activity.memberId,
                    memberName: activity.memberName,
                    totalHours: 0,
                    totalSpent: 0,
                }
            }
            const entry = memberPayments[activity.memberId]!
            entry.totalHours += activity.totalHours
            entry.totalSpent += activity.totalSpent
        })

        const results = Object.values(memberPayments).map((p, idx) => ({
            ...p,
            id: `pay-${idx}`,
            hourlyRate: p.totalHours > 0 ? p.totalSpent / p.totalHours : 0,
            period: format(dateRange.startDate, 'MMM yyyy')
        }))

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return results.filter(item => item.memberName.toLowerCase().includes(query))
        }

        return results
    }, [filteredActivities, dateRange, searchQuery])

    const summaryCards = useMemo(() => {
        const totalPaid = paymentData.reduce((sum, p) => sum + p.totalSpent, 0)
        const totalHours = paymentData.reduce((sum, p) => sum + p.totalHours, 0)
        const avgRate = totalHours > 0 ? totalPaid / totalHours : 0
        const memberCount = paymentData.length

        return [
            { label: "Total Paid", value: formatCurrency(totalPaid) },
            { label: "Total Hours", value: totalHours.toFixed(1) + " h" },
            { label: "Avg Hourly Rate", value: formatCurrency(avgRate) },
            { label: "Members", value: memberCount },
        ]
    }, [paymentData])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return paymentData.slice(start, start + pageSize)
    }, [paymentData, page])

    const totalPages = Math.ceil(paymentData.length / pageSize)

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Payments</h1>

            <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={setSelectedFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={DUMMY_MEMBERS}
                teams={DUMMY_TEAMS}
                timezone={timezone}
            >
                <Button variant="outline" className="h-9">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </InsightsHeader>

            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #d1d5db !important;
                }
            `}</style>

            <div className="mt-6 bg-white border rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-b bg-gray-50/50">
                    {summaryCards.map((card, idx) => (
                        <div key={idx} className="p-4">
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-b">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search member..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4">Member</th>
                                <th className="p-4">Period</th>
                                <th className="p-4 text-right">Hours Worked</th>
                                <th className="p-4 text-right">Hourly Rate</th>
                                <th className="p-4 text-right">Amount Paid</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedData.map((payment, idx) => (
                                <tr
                                    key={payment.id}
                                    style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                    className="transition-colors custom-hover-row"
                                >
                                    <td className="p-4 font-medium text-gray-900">{payment.memberName}</td>
                                    <td className="p-4 text-gray-600">{payment.period}</td>
                                    <td className="p-4 text-right font-medium">{payment.totalHours.toFixed(1)} h</td>
                                    <td className="p-4 text-right">{formatCurrency(payment.hourlyRate)}</td>
                                    <td className="p-4 text-right font-bold text-green-600">{formatCurrency(payment.totalSpent)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t">
                    <PaginationFooter
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        from={paymentData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                        to={Math.min(page * pageSize, paymentData.length)}
                        total={paymentData.length}
                        pageSize={pageSize}
                        onPageSizeChange={() => { }}
                        className="bg-transparent shadow-none border-none"
                    />
                </div>
            </div>
        </div>
    )
}
