"use client"

import React, { useState, useMemo } from "react"
import { Users, Info, Search, User, Clock } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"

interface MemberWithSettings {
    id: string
    name: string
    avatar?: string
    enabled: boolean
    activityGoal: number
}

export default function EfficiencyProPage() {
    const initialMembers: MemberWithSettings[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            enabled: true,
            activityGoal: 50
        })), []
    )

    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [globalActivityGoal, setGlobalActivityGoal] = useState(50)
    const [members, setMembers] = useState<MemberWithSettings[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")

    const tabs = [
        { label: "CUSTOM FIELDS", href: "#", active: false },
        { label: "WORK TIME LIMITS", href: "#", active: false },
        { label: "PAYMENTS", href: "#", active: false },
        { label: "ACHIEVEMENTS", href: "/settings/Achievements", active: true },
    ]

    const sidebarItems = [
        { label: "Efficiency pro", href: "/settings/Achievements", active: true },
        { label: "Productivity champ", href: "/settings/Achievements/productivity-champ", active: false },
        { label: "Time hero", href: "/settings/Achievements/time-hero", active: false },
    ]

    const handleApplyToAll = () => {
        setMembers(prev =>
            prev.map(member => ({
                ...member,
                enabled: globalEnabled,
                activityGoal: globalActivityGoal
            }))
        )
    }

    const handleMemberEnabledChange = (id: string, enabled: boolean) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, enabled } : member
            )
        )
    }

    const handleMemberGoalChange = (id: string, activityGoal: number) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, activityGoal } : member
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
                <Users className="w-5 h-5 text-gray-900" />
                <h1 className="text-xl font-semibold text-gray-900">Members</h1>
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
                            EFFICIENCY PRO
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        This achievement badge is given to members every day their activity meets the activity goal. They can win this badge multiple days in a row to create hot streaks.
                    </p>

                    {/* Default Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            DEFAULT:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Default Settings Row */}
                    <div className="flex items-center gap-4 mb-6">
                        <Switch
                            checked={globalEnabled}
                            onCheckedChange={setGlobalEnabled}
                        />

                        {/* Badge Icon - Hexagon with Clock */}
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-12 h-12">
                                <polygon
                                    points="50,3 93,25 93,75 50,97 7,75 7,25"
                                    fill="#ef4444"
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                />
                            </svg>
                            <Clock className="w-5 h-5 text-white absolute" />
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">Efficiency pro</h4>
                            <p className="text-sm text-gray-500">Reach the goal for activity each day</p>
                        </div>
                    </div>

                    {/* Activity Goal */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            ACTIVITY GOAL
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    <div className="flex items-center gap-3 mb-10">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <Input
                                type="number"
                                value={globalActivityGoal}
                                onChange={(e) => setGlobalActivityGoal(Number(e.target.value))}
                                className="w-20 border-0 text-center"
                            />
                            <span className="px-3 py-2 bg-gray-100 text-sm text-gray-600 border-l border-gray-300">%</span>
                        </div>
                        <Button
                            onClick={handleApplyToAll}
                            className="px-6 bg-gray-900 text-white hover:bg-gray-800"
                        >
                            Apply to all
                        </Button>
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
                        <div className="grid grid-cols-3 py-3 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-900">Name</span>
                            <span className="text-sm font-semibold text-gray-900">Efficiency pro</span>
                            <span className="text-sm font-semibold text-gray-900">Activity goal</span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {filteredMembers.map((member) => (
                                <div key={member.id} className="grid grid-cols-3 items-center py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <span className="text-sm text-gray-900">{member.name}</span>
                                    </div>
                                    <Switch
                                        checked={member.enabled}
                                        onCheckedChange={(checked) => handleMemberEnabledChange(member.id, checked)}
                                    />
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                                        <Input
                                            type="number"
                                            value={member.activityGoal}
                                            onChange={(e) => handleMemberGoalChange(member.id, Number(e.target.value))}
                                            className="w-16 border-0 text-center text-sm"
                                        />
                                        <span className="px-2 py-1.5 bg-gray-100 text-xs text-gray-600 border-l border-gray-300">%</span>
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
