"use client"

import React, { useState, useMemo } from "react"
import { ActivityHeader } from "@/components/activity/ActivityHeader"
import { EmptyState } from "@/components/activity/EmptyState"
import { DUMMY_APP_ACTIVITIES, AppActivityEntry } from "@/lib/data/dummy-data"
import { Settings } from "lucide-react"

export default function AppActivityPage() {
    const [dateRange, setDateRange] = useState<{ startDate: Date, endDate: Date }>({
        startDate: new Date(2026, 0, 21),
        endDate: new Date(2026, 0, 21)
    })
    const [project, setProject] = useState("all")
    const [member, setMember] = useState("all")

    // Filter Data
    const filteredData = useMemo(() => {
        let data = DUMMY_APP_ACTIVITIES

        // 1. Filter by Date Range
        const startOfDay = new Date(dateRange.startDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(dateRange.endDate)
        endOfDay.setHours(23, 59, 59, 999)

        data = data.filter((item: AppActivityEntry) => {
            const itemDate = new Date(item.date)
            return itemDate >= startOfDay && itemDate <= endOfDay
        })

        // 2. Filter by Project
        if (project !== 'all') {
            data = data.filter((item: AppActivityEntry) => item.projectId === project)
        }

        // 3. Filter by Member
        if (member !== 'all') {
            data = data.filter((item: AppActivityEntry) => item.memberId === member)
        }

        return data
    }, [dateRange, project, member])

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Top Title Bar - Simplified to match screenshot "App activity | Settings" */}
            <div className="flex items-center justify-between px-6 py-3 bg-white">
                <h1 className="text-xl font-normal text-gray-800">App activity</h1>
                <button className="text-sm text-gray-700 hover:underline flex items-center gap-1">
                    <Settings className="w-4 h-4" /> Settings
                </button>
            </div>

            <ActivityHeader
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                project={project}
                onProjectChange={setProject}
                member={member}
                onMemberChange={setMember}
            />

            <div className="flex-1 overflow-auto bg-white p-6">
                {filteredData.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-900 uppercase">
                                <th className="py-3 px-2 font-medium">Project</th>
                                <th className="py-3 px-2 font-medium">App name</th>
                                <th className="py-3 px-2 font-medium">Time spent (hrs)</th>
                                <th className="py-3 px-2 font-medium text-right">Sessions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(item => (
                                <tr key={item.id} className="border-b border-gray-100 even:bg-gray-50 hover:bg-gray-50 text-sm text-gray-700">
                                    <td className="py-3 px-2">{item.projectName}</td>
                                    <td className="py-3 px-2 text-gray-900 font-medium">{item.appName}</td>
                                    <td className="py-3 px-2">{item.timeSpent.toFixed(2)}h</td>
                                    <td className="py-3 px-2 text-right">{item.sessions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState message="No data for this date range" />
                )}
            </div>
        </div>
    )
}
