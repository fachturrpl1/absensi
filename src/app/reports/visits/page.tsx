"use client"

import { DataReportPage } from "@/components/report/data-report-page"
import { DUMMY_JOB_SITE_VISITS } from "@/lib/data/dummy-data"
import { useMemo } from "react"


export default function VisitsPage() {
    const summaryCards = useMemo(() => {
        const totalVisits = DUMMY_JOB_SITE_VISITS.length
        const totalMinutes = DUMMY_JOB_SITE_VISITS.reduce((sum, v) => sum + (v.duration || 0), 0)
        const uniqueSites = new Set(DUMMY_JOB_SITE_VISITS.map(v => v.siteName)).size
        const activeVisits = DUMMY_JOB_SITE_VISITS.filter(v => !v.exitTime).length

        return [
            { label: "Total Visits", value: totalVisits },
            { label: "Total Time", value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` },
            { label: "Unique Sites", value: uniqueSites },
            { label: "Active Visits", value: activeVisits },
        ]
    }, [])

    return (
        <DataReportPage
            title="Visits"
            data={DUMMY_JOB_SITE_VISITS}
            getRowKey={(row) => row.id}
            searchKeys={['memberName', 'siteName', 'projectName']}
            searchPlaceholder="Search member, site, or project..."
            columns={[
                { key: 'memberName', label: 'Member' },
                { key: 'siteName', label: 'Job Site' },
                {
                    key: 'siteAddress',
                    label: 'Address',
                    render: (val) => (
                        <span className="text-gray-500 text-xs">{val as string}</span>
                    )
                },
                { key: 'date', label: 'Date' },
                { key: 'entryTime', label: 'Entry' },
                {
                    key: 'exitTime',
                    label: 'Exit',
                    render: (val) => val ? val as string : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            On Site
                        </span>
                    )
                },
                {
                    key: 'duration',
                    label: 'Duration',
                    align: 'right',
                    render: (val) => {
                        if (!val) return <span className="text-gray-400">-</span>
                        const mins = val as number
                        const hours = Math.floor(mins / 60)
                        const minutes = mins % 60
                        return `${hours}h ${minutes}m`
                    }
                },
                {
                    key: 'projectName',
                    label: 'Project',
                    render: (val) => val ? val as string : <span className="text-gray-400">-</span>
                },
            ]}
            summaryCards={summaryCards}
            exportFilename="job-site-visits"
        />
    )
}
