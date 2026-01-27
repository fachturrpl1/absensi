"use client"

import React, { useState, useMemo, useEffect } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_REPORT_ACTIVITIES, DUMMY_PROJECTS, DUMMY_CLIENTS, ReportActivityEntry } from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    //  Download,
    //  Share2,
    Clock,
    Filter,
    Save,
    //  Columns 
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts"
import { format } from "date-fns"
import { TimeActivityFilterSidebar } from "@/components/report/TimeActivityFilterSidebar"
import { SaveReportDialog } from "@/components/report/SaveReportDialog"
import { PaginationFooter } from "@/components/pagination-footer"
import { useTimezone } from "@/components/timezone-provider"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

const roundHours = (val: number, precision = 2) => Number(val.toFixed(precision));

const formatDecimalHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.round(((hours - h) * 60 - m) * 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function TimeActivityPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 19),
        endDate: new Date(2026, 0, 25)
    })
    const [groupBy, setGroupBy] = useState("day")
    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [saveDialogOpen, setSaveDialogOpen] = useState(false)

    // Additional Sidebar Filters
    const [sidebarFilters, setSidebarFilters] = useState({
        project: "all",
        client: "all",
        task: "all"
    })

    const handleSidebarApply = (filters: { member: string, team: string, project: string, client: string, task: string }) => {
        // Sync Member/Team filter from sidebar if changed (optional, but requested "force change")
        if (filters.member && filters.member !== 'all') {
            setSelectedFilter({ type: 'members', id: filters.member, all: false })
        } else if (filters.team && filters.team !== 'all') {
            setSelectedFilter({ type: 'teams', id: filters.team, all: false })
        } else if (filters.member === 'all' && filters.team === 'all') {
            // If both reset to all, reset header too
            setSelectedFilter({ type: 'members', id: 'all', all: true })
        }

        setSidebarFilters({
            project: filters.project || "all",
            client: filters.client || "all",
            task: filters.task || "all"
        })
        setFilterSidebarOpen(false)
    }

    // Derived Data
    const filteredData = useMemo(() => {
        let data = DUMMY_REPORT_ACTIVITIES

        // 1. Filter by Date Range
        // 1. Filter by Date Range
        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')

            data = data.filter((item: ReportActivityEntry) => {
                return (item.date || "") >= startStr && (item.date || "") <= endStr
            })
        }

        // 2. Filter by Member/Team (Header)
        // 2. Filter by Member/Team (Header)
        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter((item: ReportActivityEntry) => item.memberId === selectedFilter.id)
            } else if (selectedFilter.type === 'teams') {
                data = data.filter((item: ReportActivityEntry) => item.teamId === selectedFilter.id)
            }
        }

        // 3. Filter by Sidebar Filters
        if (sidebarFilters.project !== 'all') {
            const proj = DUMMY_PROJECTS.find(p => p.id === sidebarFilters.project)
            if (proj) {
                data = data.filter((item: ReportActivityEntry) => item.projectName === proj.name)
            }
        }
        if (sidebarFilters.client !== 'all') {
            const client = DUMMY_CLIENTS.find(c => c.id === sidebarFilters.client)
            if (client) {
                data = data.filter((item: ReportActivityEntry) => item.clientName === client.name)
            }
        }
        // Task filtering (assuming task == todoName for simplicity in dummy data)
        // Dummy data doesn't have task IDs, so strictly speaking this might be limited, 
        // but let's assume filtering by status is what was meant or just ignore if no data.
        // Actually, sidebar has "Active/Completed" for tasks. 
        // Our dummy data doesn't have status. We will ignore task status filtering for now 
        // or check if 'todo' grouping was meant.
        if (sidebarFilters.task !== 'all') {
            data = data.filter((item: ReportActivityEntry) => item.todoName === sidebarFilters.task);
        }

        // 4. Sort/Group by logic
        if (groupBy && groupBy !== 'none') {
            data = [...data].sort((a, b) => {
                if (groupBy === 'member') {
                    return a.memberName.localeCompare(b.memberName)
                }
                if (groupBy === 'project') {
                    return a.projectName.localeCompare(b.projectName)
                }
                if (groupBy === 'week' || groupBy === 'day') {
                    return new Date(a.date).getTime() - new Date(b.date).getTime()
                }
                if (groupBy === 'task') { // Renamed from todo
                    return a.todoName.localeCompare(b.todoName)
                }
                return 0
            })
        }

        return data
    }, [dateRange, selectedFilter, sidebarFilters, groupBy])

    const stats = useMemo(() => {
        const totalHours = filteredData.reduce((acc: number, curr: ReportActivityEntry) => acc + curr.totalHours, 0)
        const totalSpent = filteredData.reduce((acc: number, curr: ReportActivityEntry) => acc + curr.totalSpent, 0)
        const avgActivity = filteredData.length > 0 ? filteredData.reduce((acc: number, curr: ReportActivityEntry) => acc + curr.activityPercent, 0) / filteredData.length : 0

        return {
            totalHours,
            totalSpent,
            avgActivity
        }
    }, [filteredData])

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset page saat filter/range berubah
    useEffect(() => {
        setPage(1);
    }, [dateRange, selectedFilter, sidebarFilters, groupBy]);

    // Clamp page saat data/size berubah
    useEffect(() => {
        const totalPagesCalc = Math.max(1, Math.ceil(filteredData.length / pageSize));
        if (page > totalPagesCalc) setPage(totalPagesCalc);
    }, [filteredData.length, pageSize, page]);

    // Derivasi pagination
    const totalRows = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

    const pagedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, totalRows);
        return filteredData.slice(start, end);
    }, [filteredData, page, pageSize, totalRows]);

    const showingFrom = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
    const showingTo = Math.min(page * pageSize, totalRows);

    const chartData = useMemo(() => {
        if (!dateRange.startDate || !dateRange.endDate) return [];

        // Handle specific groupings
        if (groupBy === 'project' || groupBy === 'member' || groupBy === 'task') {
            const dataMap = new Map<string, number>();

            filteredData.forEach(item => {
                let key = "Unknown";
                if (groupBy === 'project') key = item.projectName;
                else if (groupBy === 'member') key = item.memberName;
                else if (groupBy === 'task') key = item.todoName;

                dataMap.set(key, (dataMap.get(key) || 0) + item.totalHours);
            });

            return Array.from(dataMap.entries()).map(([name, hours]) => ({
                name,
                hours: roundHours(hours)
            }));
        }

        // Default: Daily view (groupBy === 'day', 'week', 'none')
        const days = [];
        let curr = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        curr.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        while (curr <= end) {
            const dateStr = format(curr, 'yyyy-MM-dd');
            // Sum hours for this day
            const dayTotal = filteredData
                .filter((d: ReportActivityEntry) => (d.date || "").startsWith(dateStr))
                .reduce((acc, val) => acc + val.totalHours, 0);

            days.push({
                date: dateStr,
                name: format(curr, "EEE, MMM d"),
                hours: roundHours(dayTotal)
            });
            curr.setDate(curr.getDate() + 1);
        }
        return days;
    }, [filteredData, dateRange, groupBy]);



    return (
        <div className="flex flex-col min-h-screen bg-white">
            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #d1d5db !important; /* dark gray hover */
                }
                html body.dark .custom-hover-row:hover,
                html body.dark .custom-hover-row:hover > td {
                    background-color: #374151 !important;
                }
            `}</style>
            {/* Header Section */}
            <div className="border-b border-gray-200 bg-white">
                <div className="px-6 py-4">
                    <h1 className="text-xl font-semibold mb-5">Time and activity report</h1>

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
                            <Button
                                variant="outline"
                                className="h-9 text-gray-700 border-gray-300 bg-white hover:bg-gray-50 font-medium"
                                onClick={() => setFilterSidebarOpen(true)}
                            >
                                <Filter className="w-4 h-4 mr-2" /> Filter
                            </Button>
                            <Button
                                className="h-9 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                                onClick={() => setSaveDialogOpen(true)}
                            >
                                <Save className="w-4 h-4 mr-2" /> Save
                            </Button>
                        </div>
                    </InsightsHeader>


                </div>
            </div>

            <main className="flex-1 bg-gray-50/50 p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col justify-between h-24 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3 relative z-10">
                            <div className="p-2 bg-gray-50 rounded-md">
                                <Clock className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total time</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{formatDecimalHours(stats.totalHours)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col justify-between h-24 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3 relative z-10">
                            <div className="p-2 bg-gray-50 rounded-md">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Average activity</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{stats.avgActivity.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col justify-between h-24 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3 relative z-10">
                            <div className="p-2 bg-gray-50 rounded-md">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <line x1="2" y1="10" x2="22" y2="10" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total spent</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalSpent)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700">Chart</h3>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Data grouped by</label>
                            <Select value={groupBy} onValueChange={setGroupBy}>
                                <SelectTrigger className="w-[140px] h-8 border-gray-300 text-gray-700 text-xs font-medium ring-offset-0 focus:ring-0">
                                    <SelectValue placeholder="Group by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="day">Date per day</SelectItem>
                                    <SelectItem value="week">Date per week</SelectItem>
                                    <SelectItem value="project">Project</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="task">Tasks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="hours"
                                    name="Hours"
                                    radius={[4, 4, 0, 0]}
                                    stroke="#6B7280"
                                >
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill="#9CA3AF" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    {/* <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <h2 className="font-semibold text-gray-700">Table</h2>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                <Columns className="w-4 h-4" />
                            </Button>
                        </div> */}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 min-w-[100px]">Date</th>
                                    <th className="px-4 py-3 min-w-[120px]">Client</th>
                                    <th className="px-4 py-3 min-w-[140px]">Project</th>
                                    <th className="px-4 py-3 min-w-[120px]">Team</th>
                                    <th className="px-4 py-3 min-w-[150px]">Tasks</th>
                                    <th className="px-4 py-3 text-right">Regular hours</th>
                                    <th className="px-4 py-3 text-right">Total hours</th>
                                    <th className="px-4 py-3 text-right">Activity %</th>
                                    <th className="px-4 py-3 text-right">Total spent</th>
                                    <th className="px-4 py-3 text-right">Regular spent</th>
                                    <th className="px-4 py-3 text-right">PTO</th>
                                    <th className="px-4 py-3 text-right">Holiday</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pagedData.length > 0 ? (
                                    pagedData.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                            className="transition-colors custom-hover-row"
                                        >
                                            <td className="px-4 py-3 text-gray-900">{new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.clientName}</td>
                                            <td className="px-4 py-3 text-gray-900 font-medium">{item.projectName}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.teamName}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.todoName}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{formatDecimalHours(item.regularHours)}</td>
                                            <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatDecimalHours(item.totalHours)}</td>
                                            <td className="px-4 py-3 text-right text-green-600 font-medium">{item.activityPercent}%</td>
                                            <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.totalSpent)}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.regularSpent)}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{formatDecimalHours(item.ptoHours)}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{formatDecimalHours(item.holidayHours)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                {/* Illustration placeholder - simple one for now or detailed if image tool allowed */}
                                                <div className="w-48 h-32 bg-gray-100 mb-4 rounded flex items-center justify-center text-gray-400">
                                                    <span className="text-4xl text-gray-300">?</span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-gray-900">Nothing to report</h3>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <PaginationFooter
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            from={showingFrom}
                            to={showingTo}
                            total={totalRows}
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                            className="border-none shadow-none bg-transparent"
                        />
                    </div>
                </div>
            </main>

            <TimeActivityFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={handleSidebarApply}
            />

            <SaveReportDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                onSave={(name) => {
                    console.log("Saving report:", name)
                    setSaveDialogOpen(false)
                }}
            />
        </div>
    )
}
