"use client"

import React, { useState, useMemo } from "react"
import { Info, Search, User } from "lucide-react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"
import { ActivityTrackingHeader } from "@/components/settings/ActivityTrackingHeader"

interface MemberWithSetting {
    id: string
    name: string
    avatar?: string
    requireReason: boolean
}

export default function RequireReasonPage() {
    const initialMembers: MemberWithSetting[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            requireReason: true
        })), []
    )

    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [members, setMembers] = useState<MemberWithSetting[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")

    const sidebarItems = [
        { label: "Modify time (manual time)", href: "/settings/Timesheet", active: false },
        { label: "Require reason", href: "/settings/Timesheet/require-reason", active: true },
        { label: "Reasons", href: "/settings/Timesheet/reasons", active: false },
    ]

    const handleGlobalChange = (enabled: boolean) => {
        setGlobalEnabled(enabled)
        setMembers(prev =>
            prev.map(member => ({ ...member, requireReason: enabled }))
        )
    }

    const handleMemberChange = (id: string, enabled: boolean) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, requireReason: enabled } : member
            )
        )
    }

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <ActivityTrackingHeader activeTab="timesheets" />

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
                            REQUIRE REASON
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Require team members to provide a reason when adding or editing their time.
                    </p>

                    {/* Global Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Global Toggle - Switch */}
                    <div className="mb-10">
                        <Switch
                            checked={globalEnabled}
                            onCheckedChange={handleGlobalChange}
                            className="data-[state=checked]:!bg-gray-500 data-[state=unchecked]:bg-gray-300 [&>span]:!bg-white"
                        />
                    </div>

                    {/* Individual Settings Section */}
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Individual settings</h3>
                            <p className="text-sm text-gray-500">Override the organization default for specific members</p>
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
                                    <Switch
                                        checked={member.requireReason}
                                        onCheckedChange={(checked) => handleMemberChange(member.id, checked)}
                                        className="data-[state=checked]:!bg-gray-500 data-[state=unchecked]:bg-gray-300 [&>span]:!bg-white"
                                    />
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
