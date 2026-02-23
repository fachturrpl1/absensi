"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_TOP_APPS, DUMMY_URL_ACTIVITIES, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename, type ExportColumn } from "@/lib/export-utils"
import { toast } from "sonner"

export default function AppsUrlsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 19),
        endDate: new Date(2026, 0, 25)
    })
    const [activeTab, setActiveTab] = useState<'apps' | 'urls'>('apps')
    const [page, setPage] = useState(1)
    const pageSize = 10

    const getMemberName = (id: string) => {
        const member = DUMMY_MEMBERS.find(m => m.id === id)
        return member ? member.name : id
    }

    // Filter apps data
    const filteredApps = useMemo(() => {
        let data = DUMMY_TOP_APPS

        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => item.date >= startStr && item.date <= endStr)
        }

        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.memberId === selectedFilter.id)
            }
        }

        return data
    }, [dateRange, selectedFilter])

    // Filter URLs data
    const filteredUrls = useMemo(() => {
        let data = DUMMY_URL_ACTIVITIES

        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => item.date >= startStr && item.date <= endStr)
        }

        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.memberId === selectedFilter.id)
            }
        }

        return data
    }, [dateRange, selectedFilter])

    const appsSummary = useMemo(() => {
        const totalTime = filteredApps.reduce((sum, app) => sum + app.timeSpent, 0)
        const uniqueApps = new Set(filteredApps.map(a => a.name)).size
        return { totalTime, uniqueApps }
    }, [filteredApps])

    const urlsSummary = useMemo(() => {
        const totalTime = filteredUrls.reduce((sum, url) => sum + url.timeSpent, 0)
        const uniqueSites = new Set(filteredUrls.map(u => u.site)).size
        return { totalTime, uniqueSites }
    }, [filteredUrls])

    const currentData = activeTab === 'apps' ? filteredApps : filteredUrls
    const paginatedData = currentData.slice((page - 1) * pageSize, page * pageSize)
    const totalPages = Math.ceil(currentData.length / pageSize)

    const formatMinutes = (mins: number) => {
        const hours = Math.floor(mins / 60)
        const minutes = mins % 60
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    }

    const handleExport = () => {
        if (activeTab === 'apps') {
            // Prepare data with derived fields
            const exportData = filteredApps.map(app => {
                const percentage = appsSummary.totalTime > 0
                    ? ((app.timeSpent / appsSummary.totalTime) * 100).toFixed(1) + '%'
                    : '0%'

                const project = app.category === 'Development' ? 'Website Redesign' :
                    app.category === 'Design' ? 'Marketing Campaign' :
                        'Internal Operations'

                return {
                    ...app,
                    project,
                    percentage
                }
            })

            const columns: ExportColumn[] = [
                { label: 'Application', key: 'name' },
                { label: 'Category', key: 'category' },
                { label: 'Project', key: 'project' },
                { label: 'Member', key: 'memberId' },
                { label: 'Date', key: 'date' },
                {
                    label: 'Time Spent',
                    key: 'timeSpent',
                    format: (value: any) => formatMinutes(value as number)
                },
                { label: 'Percentage', key: 'percentage' }
            ]
            const filename = generateFilename('apps-activity')
            exportToCSV({ data: exportData, columns, filename })
            toast.success('Apps data exported successfully')
        } else {
            const columns: ExportColumn[] = [
                { label: 'Website', key: 'site' },
                { label: 'Project', key: 'projectName' },
                { label: 'Member', key: 'memberId' },
                { label: 'Date', key: 'date' },
                {
                    label: 'Time Spent',
                    key: 'timeSpent',
                    format: (value: any) => formatMinutes(value as number)
                }
            ]
            const filename = generateFilename('urls-activity')
            exportToCSV({ data: filteredUrls, columns, filename })
            toast.success('URLs data exported successfully')
        }
    }

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Apps & URLs Report</h1>

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

            <div className="mt-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'apps' | 'urls'); setPage(1); }}>
                    <div className="border-b px-4 py-4">
                        <TabsList className="grid w-[300px] grid-cols-2">
                            <TabsTrigger value="apps">Applications</TabsTrigger>
                            <TabsTrigger value="urls">Websites</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b bg-gray-50/50">
                        <div className="p-4">
                            <p className="text-sm font-medium text-gray-500">Total Time Spent</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatMinutes(activeTab === 'apps' ? appsSummary.totalTime : urlsSummary.totalTime)}
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-medium text-gray-500">
                                Unique {activeTab === 'apps' ? 'Applications' : 'Sites'}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {activeTab === 'apps' ? appsSummary.uniqueApps : urlsSummary.uniqueSites}
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-medium text-gray-500">Records</p>
                            <p className="text-2xl font-bold text-gray-900">{currentData.length}</p>
                        </div>
                    </div>

                    <TabsContent value="apps" className="m-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        <th className="p-4">Application</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Project</th>
                                        <th className="p-4">Member</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-right">Time Spent</th>
                                        <th className="p-4 text-right">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {(paginatedData as typeof DUMMY_TOP_APPS).map((app, idx) => (
                                        <tr
                                            key={`${app.memberId}-${app.name}-${idx}`}
                                            className={`transition-colors hover:bg-gray-300 ${idx % 2 === 1 ? 'bg-slate-100' : 'bg-white'}`}
                                        >
                                            <td className="p-4 font-medium text-gray-900">{app.name}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                    {app.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {/* Mock Project Name based on category or random */}
                                                {app.category === 'Development' ? 'Website Redesign' :
                                                    app.category === 'Design' ? 'Marketing Campaign' :
                                                        'Internal Operations'}
                                            </td>
                                            <td className="p-4 text-gray-600">{getMemberName(app.memberId ?? '')}</td>
                                            <td className="p-4 text-gray-600">{app.date}</td>
                                            <td className="p-4 text-right font-medium">{formatMinutes(app.timeSpent)}</td>
                                            <td className="p-4 text-right text-gray-600">
                                                {appsSummary.totalTime > 0
                                                    ? ((app.timeSpent / appsSummary.totalTime) * 100).toFixed(1) + '%'
                                                    : '0%'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    <TabsContent value="urls" className="m-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        <th className="p-4">Website</th>
                                        <th className="p-4">Project</th>
                                        <th className="p-4">Member</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-right">Time Spent</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {(paginatedData as typeof DUMMY_URL_ACTIVITIES).map((url, idx) => (
                                        <tr
                                            key={url.id}
                                            className={`transition-colors hover:bg-gray-300 ${idx % 2 === 1 ? 'bg-slate-100' : 'bg-white'}`}
                                        >
                                            <td className="p-4 font-medium text-gray-900">{url.site}</td>
                                            <td className="p-4 text-gray-600">{url.projectName}</td>
                                            <td className="p-4 text-gray-600">{getMemberName(url.memberId ?? '')}</td>
                                            <td className="p-4 text-gray-600">{url.date}</td>
                                            <td className="p-4 text-right font-medium">{formatMinutes(url.timeSpent)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>

            </div>

            {/* Pagination */}
            <div className="mt-4">
                <PaginationFooter
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    from={currentData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                    to={Math.min(page * pageSize, currentData.length)}
                    total={currentData.length}
                    pageSize={pageSize}
                    onPageSizeChange={() => { }}
                    className="bg-transparent shadow-none border-none p-0"
                />
            </div>
        </div>
    )
}
