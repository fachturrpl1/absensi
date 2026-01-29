"use client"

import React, { useState } from "react"
import { Calendar, Info } from "lucide-react"
import Link from "next/link"

export default function SchedulePage() {
    const [calendarType, setCalendarType] = useState<"private" | "collaborative">("private")

    const tabs = [
        { label: "CALENDAR", href: "/settings/Schedule", active: true },
        { label: "JOB SITES", href: "/settings/Schedule/job-sites", active: false },
        { label: "MAP", href: "/settings/Schedule/map", active: false },
    ]

    const sidebarItems = [
        { label: "Calendar type", href: "/settings/Schedule", active: true },
        { label: "Shift alerts", href: "/settings/Schedule/shift-alerts", active: false },
        { label: "Grace period", href: "/settings/Schedule/grace-period", active: false },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                <Calendar className="w-5 h-5 text-gray-900" />
                <h1 className="text-xl font-semibold text-gray-900">Schedules</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 px-6 border-b border-gray-200">
                {tabs.map((tab) => (
                    <Link
                        key={tab.label}
                        href={tab.href}
                        className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab.active
                                ? "text-gray-900 border-gray-900"
                                : "text-gray-500 border-transparent hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Content */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <div className="w-48 border-r border-gray-200 py-6">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`block px-6 py-2 text-sm transition-colors ${item.active
                                    ? "text-gray-900 border-l-2 border-gray-900 font-medium"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            CALENDAR TYPE
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Making the calendar private restricts users so they can only view their own shifts and time off. If the calendar is collaborative, everyone is able to view all shifts and time off for all members of the organization.
                    </p>

                    {/* All Users Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            ALL USERS
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Toggle Buttons */}
                    <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                        <button
                            onClick={() => setCalendarType("private")}
                            className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all ${calendarType === "private"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Private
                        </button>
                        <button
                            onClick={() => setCalendarType("collaborative")}
                            className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all ${calendarType === "collaborative"
                                    ? "bg-gray-800 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Collaborative
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
