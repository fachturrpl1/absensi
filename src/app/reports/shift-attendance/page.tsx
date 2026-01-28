"use client"

import { DataReportPage } from "@/components/report/data-report-page"
import { DUMMY_SHIFT_ATTENDANCE } from "@/lib/data/dummy-data"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

const statusLabels: Record<string, { label: string; color: string }> = {
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    late: { label: 'Late', color: 'bg-yellow-100 text-yellow-800' },
    early_leave: { label: 'Early Leave', color: 'bg-orange-100 text-orange-800' },
    missed: { label: 'Missed', color: 'bg-red-100 text-red-800' },
    upcoming: { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' },
}

export default function ShiftAttendancePage() {
    const data = DUMMY_SHIFT_ATTENDANCE ?? []
    const summaryCards = useMemo(() => {
        const total = data.length
        const completed = data.filter(s => s.status === 'completed').length
        const late = data.filter(s => s.status === 'late').length
        const missed = data.filter(s => s.status === 'missed').length

        return [
            { label: "Total Shifts", value: total },
            { label: "Completed", value: completed },
            { label: "Late", value: late },
            { label: "Missed", value: missed },
        ]
    }, [])

    return (
        <DataReportPage
            title="Shift attendance"
            data={data}
            getRowKey={(row) => row.id}
            searchKeys={['memberName']}
            searchPlaceholder="Search member..."
            filterOptions={[
                {
                    key: 'status',
                    label: 'Status',
                    dataKey: 'status',
                    options: Object.entries(statusLabels).map(([value, { label }]) => ({ value, label }))
                }
            ]}
            columns={[
                { key: 'memberName', label: 'Member' },
                { key: 'shiftDate', label: 'Date' },
                {
                    key: 'scheduled',
                    label: 'Scheduled',
                    render: (_, row) => `${row.scheduledStart} - ${row.scheduledEnd}`
                },
                {
                    key: 'actual',
                    label: 'Actual',
                    render: (_, row) => {
                        if (!row.actualStart) return <span className="text-gray-400">-</span>
                        return `${row.actualStart} - ${row.actualEnd || 'In progress'}`
                    }
                },
                {
                    key: 'issue',
                    label: 'Issue',
                    render: (_, row) => {
                        if (row.lateMinutes) {
                            return <span className="text-yellow-600">{row.lateMinutes} min late</span>
                        }
                        if (row.earlyLeaveMinutes) {
                            return <span className="text-orange-600">{row.earlyLeaveMinutes} min early</span>
                        }
                        return '-'
                    }
                },
                {
                    key: 'status',
                    label: 'Status',
                    align: 'center',
                    render: (val) => {
                        const status = val as string
                        const config = statusLabels[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
                        return (
                            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", config.color)}>
                                {config.label}
                            </span>
                        )
                    }
                },
            ]}
            summaryCards={summaryCards}
            exportFilename="shift-attendance"
        />
    )
}
