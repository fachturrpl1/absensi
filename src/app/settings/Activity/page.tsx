"use client"

import { useState } from "react"
import Link from "next/link"
import { Info, Search } from "lucide-react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { ActivityTrackingHeader } from "@/components/settings/ActivityTrackingHeader"

type TrackAppsOption = "all" | "time-tracking" | "off"

export default function ActivityPage() {
    const [globalTrackApps, setGlobalTrackApps] = useState<TrackAppsOption>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [memberTrackApps, setMemberTrackApps] = useState<Record<string, TrackAppsOption>>({})

    const filteredMembers = DUMMY_MEMBERS.filter(member => {
        const fullName = member.name.toLowerCase()
        return fullName.includes(searchQuery.toLowerCase())
    })

    const handleGlobalTrackAppsChange = (value: TrackAppsOption) => {
        setGlobalTrackApps(value)
    }

    const handleMemberTrackAppsChange = (memberId: string, value: TrackAppsOption) => {
        setMemberTrackApps(prev => ({
            ...prev,
            [memberId]: value
        }))
    }

    const getMemberTrackApps = (memberId: string): TrackAppsOption => {
        return memberTrackApps[memberId] || globalTrackApps
    }

    return (
        <div className="flex flex-col min-h-screen bg-white w-full">
            <ActivityTrackingHeader activeTab="activity" />

            {/* Main Content */}
            <div className="flex flex-1 w-full">
                {/* Left Sidebar */}
                <div className="w-64 border-r border-slate-200 bg-slate-50">
                    <div className="p-4 space-y-1">
                        <Link
                            href="/settings/Activity"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-md"
                        >
                            Track apps & URLs
                        </Link>
                        <Link
                            href="/settings/Activity/data-privacy"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            Data privacy
                        </Link>
                        <Link
                            href="/settings/Activity/record-activity"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            Record activity
                        </Link>
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 p-6">
                    {/* Section Title */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            TRACK APPS & URLS
                        </span>
                        <Info className="h-4 w-4 text-slate-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-6">
                        Record which apps and URLs members use while tracking time
                    </p>

                    {/* Global Setting */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="h-4 w-4 text-slate-400" />
                    </div>

                    {/* Global Toggle - Pill Style */}
                    <div className="inline-flex rounded-full bg-slate-100 p-0.5 mb-8">
                        <button
                            onClick={() => handleGlobalTrackAppsChange("all")}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalTrackApps === "all"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => handleGlobalTrackAppsChange("time-tracking")}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalTrackApps === "time-tracking"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Time tracking only
                        </button>
                        <button
                            onClick={() => handleGlobalTrackAppsChange("off")}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalTrackApps === "off"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Off
                        </button>
                    </div>

                    {/* Individual Settings Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Individual settings</h3>
                            <p className="text-sm text-slate-500">Override the organization default for specific members</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="border-t border-slate-200">
                        <div className="py-3 border-b border-slate-200">
                            <span className="text-sm font-semibold text-slate-900">Name</span>
                        </div>
                        {filteredMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between py-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                        <span className="text-sm font-medium text-slate-600">
                                            {member.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm text-slate-900">{member.name}</span>
                                </div>
                                <div className="inline-flex rounded-full bg-slate-100 p-0.5">
                                    <button
                                        onClick={() => handleMemberTrackAppsChange(member.id, "all")}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${getMemberTrackApps(member.id) === "all"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => handleMemberTrackAppsChange(member.id, "time-tracking")}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${getMemberTrackApps(member.id) === "time-tracking"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        Time tracking
                                    </button>
                                    <button
                                        onClick={() => handleMemberTrackAppsChange(member.id, "off")}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${getMemberTrackApps(member.id) === "off"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        Off
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="py-3 text-sm text-slate-500">
                        Showing {filteredMembers.length} of {DUMMY_MEMBERS.length} members
                    </div>
                </div>
            </div>
        </div>
    )
}
