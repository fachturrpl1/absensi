"use client"

import React, { useState } from "react"
import { Activity, ChevronDown, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Reason {
    id: string
    text: string
}

const INITIAL_REASONS: Reason[] = [
    { id: "1", text: "Forgot to start/stop timer" },
    { id: "2", text: "Used a wrong task/project" },
    { id: "3", text: "Was AFK on a call" },
    { id: "4", text: "Other" },
]

export default function ReasonsPage() {
    const [reasons, setReasons] = useState<Reason[]>(INITIAL_REASONS)
    const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null)

    const tabs = [
        { label: "ACTIVITY", href: "#", active: false },
        { label: "TIMESHEETS", href: "/settings/Timesheet", active: true },
        { label: "TIME & TRACKING", href: "#", active: false },
        { label: "SCREENSHOTS", href: "#", active: false },
    ]

    const sidebarItems = [
        { label: "Modify time (manual time)", href: "/settings/Timesheet", active: false },
        { label: "Require reason", href: "/settings/Timesheet/require-reason", active: false },
        { label: "Reasons", href: "/settings/Timesheet/reasons", active: true },
    ]

    const handleAddReason = () => {
        const newReason: Reason = {
            id: Date.now().toString(),
            text: "New reason"
        }
        setReasons([...reasons, newReason])
    }

    const handleDeleteReason = (id: string) => {
        setReasons(reasons.filter(r => r.id !== id))
        setShowActionsMenu(null)
    }

    const handleEditReason = (id: string) => {
        const newText = prompt("Enter new reason text:")
        if (newText) {
            setReasons(reasons.map(r =>
                r.id === id ? { ...r, text: newText } : r
            ))
        }
        setShowActionsMenu(null)
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                <Activity className="w-5 h-5 text-gray-900" />
                <h1 className="text-xl font-semibold text-gray-900">Activity & tracking</h1>
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
                <div className="w-56 border-r border-gray-200 py-6">
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
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            REASONS
                        </span>
                        <Button
                            onClick={handleAddReason}
                            className="px-4 bg-gray-900 text-white hover:bg-gray-800"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add reason
                        </Button>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Customize the list of reasons that members can select when modifying time.
                    </p>

                    {/* Reasons Table */}
                    <div className="mt-6">
                        {/* Table Header */}
                        <div className="py-3 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-900">Reason</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {reasons.map((reason) => (
                                <div key={reason.id} className="flex items-center justify-between py-4">
                                    <span className="text-sm text-gray-900">{reason.text}</span>
                                    <div className="relative">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowActionsMenu(showActionsMenu === reason.id ? null : reason.id)}
                                            className="px-4 py-2 text-sm border-gray-300 bg-white hover:bg-gray-50"
                                        >
                                            Actions
                                            <ChevronDown className="w-4 h-4 ml-1" />
                                        </Button>

                                        {showActionsMenu === reason.id && (
                                            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                                <button
                                                    onClick={() => handleEditReason(reason.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReason(reason.id)}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
