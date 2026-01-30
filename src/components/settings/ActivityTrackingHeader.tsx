"use client"

import Link from "next/link"
import { Activity } from "lucide-react"

type TabKey = "activity" | "timesheets" | "tracking" | "screenshots"

interface ActivityTrackingHeaderProps {
    activeTab: TabKey
}

const tabs: { key: TabKey; label: string; href: string }[] = [
    { key: "activity", label: "ACTIVITY", href: "/settings/Activity" },
    { key: "timesheets", label: "TIMESHEETS", href: "/settings/Timesheet" },
    { key: "tracking", label: "TIME & TRACKING", href: "/settings/tracking" },
    { key: "screenshots", label: "SCREENSHOTS", href: "/settings/screenshot" },
]

export function ActivityTrackingHeader({ activeTab }: ActivityTrackingHeaderProps) {
    return (
        <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 w-full">
                <div className="flex items-center gap-3">
                    <Activity className="h-6 w-6 text-slate-700" />
                    <h1 className="text-2xl font-semibold text-slate-900">Activity & tracking</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-slate-200 w-full">
                <div className="flex gap-8">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
                                ? "text-slate-900 border-b-2 border-slate-900"
                                : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300"
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    )
}
