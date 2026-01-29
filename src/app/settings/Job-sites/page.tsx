"use client"

import React, { useState, useMemo } from "react"
import { Calendar, Info, Search, User } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"

interface MemberWithSetting {
    id: string
    name: string
    avatar?: string
    enabled: boolean
}

export default function JobSitesPage() {
    // Convert shared members to include setting
    const initialMembers: MemberWithSetting[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            enabled: false
        })), []
    )

    const [globalEnabled, setGlobalEnabled] = useState(false)
    const [members, setMembers] = useState<MemberWithSetting[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")

    const tabs = [
        { label: "CALENDAR", href: "/settings/Calender", active: false },
        { label: "JOB SITES", href: "/settings/Job-sites", active: true },
        { label: "MAP", href: "/settings/Map", active: false },
    ]

    const sidebarItems = [
        { label: "Restrict timer to job sites", href: "/settings/Job-sites", active: true },
        { label: "Enter/exit notifications", href: "/settings/Job-sites/enter-exit-notifications", active: false },
    ]

    const handleGlobalChange = (enabled: boolean) => {
        setGlobalEnabled(enabled)
        setMembers(prev =>
            prev.map(member => ({ ...member, enabled }))
        )
    }

    const handleMemberChange = (id: string, enabled: boolean) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, enabled } : member
            )
        )
    }

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            RESTRICT TIMER TO JOB SITES
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Only allow members to track their time while at a job site
                    </p>

                    {/* Global Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Global Toggle Buttons - Pill style like Shift Alerts */}
                    <div className="inline-flex rounded-full bg-gray-100 p-0.5 mb-10">
                        <button
                            onClick={() => handleGlobalChange(true)}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalEnabled
                                    ? "bg-gray-800 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            On
                        </button>
                        <button
                            onClick={() => handleGlobalChange(false)}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${!globalEnabled
                                    ? "bg-gray-800 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Off
                        </button>
                    </div>

                    {/* Individual Settings Section */}
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Individual settings</h3>
                            <p className="text-sm text-gray-500">Override the organization default for specific members</p>
                        </div>
                        <div className="relative w-56">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search members"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 border-gray-300 rounded-full bg-white"
                            />
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="mt-6">
                        {/* Table Header */}
                        <div className="py-3 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-900">Name</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {filteredMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <span className="text-sm text-gray-900">{member.name}</span>
                                    </div>
                                    {/* Member Toggle Buttons - Pill style */}
                                    <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                                        <button
                                            onClick={() => handleMemberChange(member.id, true)}
                                            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${member.enabled
                                                    ? "bg-gray-800 text-white shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            On
                                        </button>
                                        <button
                                            onClick={() => handleMemberChange(member.id, false)}
                                            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${!member.enabled
                                                    ? "bg-gray-800 text-white shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Off
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="py-3 text-sm text-gray-500">
                            Showing {filteredMembers.length} of {members.length} members
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
