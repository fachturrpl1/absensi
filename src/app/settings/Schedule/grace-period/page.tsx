"use client"

import React, { useState, useMemo } from "react"
import { Calendar, Info, Search, User } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"

interface MemberWithGrace {
    id: string
    name: string
    avatar?: string
    gracePeriod: string
}

export default function GracePeriodPage() {
    // Convert shared members to include grace period settings
    const initialMembers: MemberWithGrace[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            gracePeriod: "5"
        })), []
    )

    const [globalGracePeriod, setGlobalGracePeriod] = useState("5")
    const [members, setMembers] = useState<MemberWithGrace[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")

    const tabs = [
        { label: "CALENDAR", href: "/settings/Calender", active: true },
        { label: "JOB SITES", href: "/settings/Job-sites", active: false },
        { label: "MAP", href: "/settings/Map", active: false },
    ]

    const sidebarItems = [
        { label: "Calendar type", href: "/settings/Schedule", active: false },
        { label: "Shift alerts", href: "/settings/Schedule/shift-alerts", active: false },
        { label: "Grace period", href: "/settings/Schedule/grace-period", active: true },
    ]

    const gracePeriodOptions = ["1", "2", "3", "5", "10", "15", "20", "30"]

    const handleMemberGracePeriodChange = (id: string, value: string) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, gracePeriod: value } : member
            )
        )
    }

    const handleApplyToAll = () => {
        setMembers(prev =>
            prev.map(member => ({ ...member, gracePeriod: globalGracePeriod }))
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
                            GRACE PERIOD
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Set a grace period for determining if a shift is considered late.
                    </p>

                    {/* Global Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Global Grace Period Row */}
                    <div className="flex items-center gap-4 mb-10">
                        <Select value={globalGracePeriod} onValueChange={setGlobalGracePeriod}>
                            <SelectTrigger className="w-[120px] h-10 border-gray-300 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {gracePeriodOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option} min
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleApplyToAll}
                            className="h-10 px-6 bg-gray-900 text-white hover:bg-gray-800"
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
                                    <Select
                                        value={member.gracePeriod}
                                        onValueChange={(value) => handleMemberGracePeriodChange(member.id, value)}
                                    >
                                        <SelectTrigger className="w-[100px] h-9 border-gray-300 bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gracePeriodOptions.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option} min
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
