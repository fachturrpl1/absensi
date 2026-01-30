"use client"

import Link from "next/link"
import { Calendar } from "lucide-react"

type TabKey = "calendar" | "job-sites" | "map"

interface SchedulesHeaderProps {
    activeTab: TabKey
}

const tabs: { key: TabKey; label: string; href: string }[] = [
    { key: "calendar", label: "CALENDAR", href: "/settings/Calender" },
    { key: "job-sites", label: "JOB SITES", href: "/settings/Job-sites" },
    { key: "map", label: "MAP", href: "/settings/Map" },
]

export function SchedulesHeader({ activeTab }: SchedulesHeaderProps) {
    return (
        <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 w-full">
                <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-slate-700" />
                    <h1 className="text-2xl font-semibold text-slate-900">Schedules</h1>
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
