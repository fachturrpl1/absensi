"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename, type ExportColumn } from "@/lib/export-utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { ActivityTable, type ColumnDef } from "@/components/insights/ActivityTable"

import { getAllOrganization_member } from "@/action/members"
import { useOrgStore } from "@/store/org-store"

export const dynamic = 'force-dynamic'

export default function AppsUrlsPage() {
    const timezone = useTimezone()
    const storeOrgId = useOrgStore((s) => s.organizationId)
    const organizationId = storeOrgId ? String(storeOrgId) : null

    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of month
        endDate: new Date()
    })
    const [activeTab, setActiveTab] = useState<'apps' | 'urls'>('apps')
    const [page, setPage] = useState(1)
    const pageSize = 10

    // Dynamic Data State
    const [appsData, setAppsData] = useState<any[]>([])
    const [urlsData, setUrlsData] = useState<any[]>([])
    const [members, setMembers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // 1. Fetch Members for filter (re-runs when organizationId changes)
    useEffect(() => {
        async function fetchMembers() {
            if (!organizationId) return
            const res = await getAllOrganization_member(Number(organizationId))
            if (res.success && res.data) {
                const mappedMembers = res.data.map((m: any) => ({
                    id: String(m.id),
                    name: m.user
                        ? `${m.user.first_name || ''} ${m.user.last_name || ''}`.trim() || m.user.display_name
                        : `Member #${m.id}`
                }))
                setMembers(mappedMembers)
            }
        }
        fetchMembers()
    }, [organizationId])

    // 2. Main Data Loader
    const loadData = useCallback(async () => {
        if (!organizationId) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        const buildParams = (type: 'apps' | 'urls') => {
            const p = new URLSearchParams()
            p.set('type', type)
            p.set('organizationId', organizationId as string)
            if (selectedFilter.id) p.set('memberId', selectedFilter.id as string)
            if (dateRange.startDate) p.set('startDate', format(dateRange.startDate, 'yyyy-MM-dd'))
            if (dateRange.endDate) p.set('endDate', format(dateRange.endDate, 'yyyy-MM-dd'))
            return p.toString()
        }

        try {
            const fetchJson = async (url: string) => {
                const res = await fetch(url)
                if (!res.ok) {
                    const text = await res.text()
                    console.error(`[apps-url] HTTP ${res.status}:`, text)
                    throw new Error(`HTTP ${res.status}: ${text}`)
                }
                return res.json()
            }

            const [appsRes, urlsRes] = await Promise.all([
                fetchJson(`/api/reports/apps-url?${buildParams('apps')}`),
                fetchJson(`/api/reports/apps-url?${buildParams('urls')}`)
            ])

            if (appsRes.success) setAppsData(appsRes.data || [])
            else console.error('[apps-url] apps error:', appsRes.message)

            if (urlsRes.success) setUrlsData(urlsRes.data || [])
            else console.error('[apps-url] urls error:', urlsRes.message)

        } catch (err: any) {
            console.error('[apps-url] fetch error:', err)
            toast.error(`Failed to load report data: ${err.message}`)
        } finally {
            setIsLoading(false)
        }
    }, [organizationId, selectedFilter.id, dateRange.startDate, dateRange.endDate])

    // Load data when triggers change
    useEffect(() => {
        loadData()
    }, [loadData])

    // Summary calculations (isProductive normalized: 'core-work' | 'non-core-work' | 'unproductive')
    const appsSummary = useMemo(() => {
        const totalTime = appsData.reduce((sum, app) => sum + (app.timeSpent || 0), 0)
        const coreTime = appsData.filter(a => a.isProductive === 'core-work').reduce((sum, a) => sum + (a.timeSpent || 0), 0)
        const nonCoreTime = appsData.filter(a => a.isProductive === 'non-core-work').reduce((sum, a) => sum + (a.timeSpent || 0), 0)
        const unproductiveTime = appsData.filter(a => a.isProductive === 'unproductive').reduce((sum, a) => sum + (a.timeSpent || 0), 0)
        return { totalTime, coreTime, nonCoreTime, unproductiveTime }
    }, [appsData])

    const urlsSummary = useMemo(() => {
        const totalTime = urlsData.reduce((sum, url) => sum + (url.timeSpent || 0), 0)
        const coreTime = urlsData.filter(u => u.isProductive === 'core-work').reduce((sum, u) => sum + (u.timeSpent || 0), 0)
        const nonCoreTime = urlsData.filter(u => u.isProductive === 'non-core-work').reduce((sum, u) => sum + (u.timeSpent || 0), 0)
        const unproductiveTime = urlsData.filter(u => u.isProductive === 'unproductive').reduce((sum, u) => sum + (u.timeSpent || 0), 0)
        return { totalTime, coreTime, nonCoreTime, unproductiveTime }
    }, [urlsData])

    const formatMinutes = (mins: number) => {
        const hours = Math.floor(mins / 60)
        const minutes = Math.floor(mins % 60)
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    }

    const appsColumns: ColumnDef<any>[] = [
        { header: 'Application', accessorKey: 'name', className: 'font-medium' },
        { 
            header: 'Category', 
            cell: (row) => <span className={`p-4 ${row.isProductive} ? `}>{row.category}</span>
        },
        { header: 'Project', accessorKey: 'projectName' },
        { header: 'Member', accessorKey: 'memberName' },
        { header: 'Date', accessorKey: 'date' },
        { 
            header: 'Time Spent', 
            className: 'text-right font-medium',
            cell: (row) => formatMinutes(row.timeSpent)
        }
    ]

    const urlsColumns: ColumnDef<any>[] = [
        { 
            header: 'Website', 
            className: 'font-medium',
            cell: (row) => <span title={row.title}>{row.site}</span>
        },
        { header: 'Project', accessorKey: 'projectName' },
        { header: 'Member', accessorKey: 'memberName' },
        { header: 'Date', accessorKey: 'date' },
        { 
            header: 'Time Spent', 
            className: 'text-right font-medium',
            cell: (row) => formatMinutes(row.timeSpent)
        }
    ]

    const currentData = activeTab === 'apps' ? appsData : urlsData
    const paginatedData = currentData.slice((page - 1) * pageSize, page * pageSize)
    const totalPages = Math.ceil(currentData.length / pageSize)

    const handleExport = () => {
        if (activeTab === 'apps') {
            const columns: ExportColumn[] = [
                { label: 'Application', key: 'name' },
                { label: 'Category', key: 'category' },
                { label: 'Project', key: 'projectName' },
                { label: 'Member', key: 'memberName' },
                { label: 'Date', key: 'date' },
                {
                    label: 'Time Spent',
                    key: 'timeSpent',
                    format: (value: any) => formatMinutes(value as number)
                }
            ]
            const filename = generateFilename('apps-activity')
            exportToCSV({ data: appsData, columns, filename })
            toast.success('Apps data exported successfully')
        } else {
            const columns: ExportColumn[] = [
                { label: 'Website', key: 'site' },
                { label: 'Project', key: 'projectName' },
                { label: 'Member', key: 'memberName' },
                { label: 'Date', key: 'date' },
                {
                    label: 'Time Spent',
                    key: 'timeSpent',
                    format: (value: any) => formatMinutes(value as number)
                }
            ]
            const filename = generateFilename('urls-activity')
            exportToCSV({ data: urlsData, columns, filename })
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
                members={members}
                teams={[]}
                hideTeamsTab={true}
                timezone={timezone}
            >
                <Button variant="outline" className="h-9" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </InsightsHeader>



            <div className="mt-6">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'apps' | 'urls'); setPage(1); }}>
                    <div className="px-4 py-4">
                        <TabsList className="grid w-[300px] grid-cols-2">
                            <TabsTrigger value="apps">Applications</TabsTrigger>
                            <TabsTrigger value="urls">Websites</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x">
                        <div className="p-4">
                            <p className="text-sm font-medium">Total Time Spent</p>
                            <p className="text-2xl font-bold">
                                {formatMinutes(activeTab === 'apps' ? appsSummary.totalTime : urlsSummary.totalTime)}
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-medium">Core</p>
                            <p className="text-2xl font-bold">
                                {formatMinutes(activeTab === 'apps' ? appsSummary.coreTime : urlsSummary.coreTime)}
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-medium">Non-Core</p>
                            <p className="text-2xl font-bold">
                                {formatMinutes(activeTab === 'apps' ? appsSummary.nonCoreTime : urlsSummary.nonCoreTime)}
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-medium">Unproductive</p>
                            <p className="text-2xl font-bold">
                                {formatMinutes(activeTab === 'apps' ? appsSummary.unproductiveTime : urlsSummary.unproductiveTime)}
                            </p>
                        </div>
                    </div>

                    <TabsContent value="apps" className="m-0">
                        <ActivityTable 
                            data={paginatedData} 
                            columns={appsColumns} 
                            isLoading={isLoading} 
                            emptyMessage="No activity data found" 
                            loadingMessage="Loading application data..."
                        />
                    </TabsContent>

                    <TabsContent value="urls" className="m-0">
                        <ActivityTable 
                            data={paginatedData} 
                            columns={urlsColumns} 
                            isLoading={isLoading} 
                            emptyMessage="No website activity data found" 
                            loadingMessage="Loading website data..."
                        />
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
