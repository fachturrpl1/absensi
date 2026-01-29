"use client"

import React, { useState, useMemo } from "react"
import { Activity, Info, Search, User } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"

type ModifyTimeOption = "add-edit" | "off"

interface MemberWithSettings {
    id: string
    name: string
    avatar?: string
    modifyTimeSetting: ModifyTimeOption
    requireApproval: boolean
}

export default function TimesheetPage() {
    const initialMembers: MemberWithSettings[] = useMemo(() =>
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            modifyTimeSetting: "add-edit" as ModifyTimeOption,
            requireApproval: false
        })), []
    )

    const [globalModifySetting, setGlobalModifySetting] = useState<ModifyTimeOption>("add-edit")
    const [globalRequireApproval, setGlobalRequireApproval] = useState(false)
    const [allowManagersApprove, setAllowManagersApprove] = useState(true)
    const [members, setMembers] = useState<MemberWithSettings[]>(initialMembers)
    const [searchQuery, setSearchQuery] = useState("")

    const tabs = [
        { label: "ACTIVITY", href: "#", active: false },
        { label: "TIMESHEETS", href: "/settings/Timesheet", active: true },
        { label: "TIME & TRACKING", href: "#", active: false },
        { label: "SCREENSHOTS", href: "#", active: false },
    ]

    const sidebarItems = [
        { label: "Modify time (manual time)", href: "/settings/Timesheet", active: true },
        { label: "Require reason", href: "/settings/Timesheet/require-reason", active: false },
        { label: "Reasons", href: "/settings/Timesheet/reasons", active: false },
    ]

    const modifyOptions: { value: ModifyTimeOption; label: string }[] = [
        { value: "add-edit", label: "Add & edit" },
        { value: "off", label: "Off" },
    ]

    const handleApplyToAll = () => {
        setMembers(prev =>
            prev.map(member => ({
                ...member,
                modifyTimeSetting: globalModifySetting,
                requireApproval: globalRequireApproval
            }))
        )
    }

    const handleMemberModifyChange = (id: string, setting: ModifyTimeOption) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, modifyTimeSetting: setting } : member
            )
        )
    }

    const handleMemberApprovalChange = (id: string, requireApproval: boolean) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, requireApproval } : member
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
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            MODIFY TIME (MANUAL TIME)
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-1">
                        Customize your team's ability to modify time (add manual time and edit previously tracked time).
                    </p>
                    <p className="text-sm text-gray-600 mb-6">
                        Ensure this setting is 'Off' to not allow time modifications. Members are able to delete their own time before it's paid. <Link href="#" className="text-gray-900 underline">View more</Link>
                    </p>

                    {/* Default Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            DEFAULT
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Default Settings Row */}
                    <div className="flex items-center gap-4 mb-6">
                        {/* Modify Time Toggle */}
                        <div className="inline-flex rounded-full bg-gray-100 p-0.5">
                            {modifyOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setGlobalModifySetting(option.value)}
                                    className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalModifySetting === option.value
                                        ? "bg-gray-800 text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Require Approval Switch */}
                        <Switch
                            checked={globalRequireApproval}
                            onCheckedChange={setGlobalRequireApproval}
                            className="data-[state=checked]:!bg-gray-500 data-[state=unchecked]:bg-gray-300 [&>span]:!bg-white"
                        />

                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600">Require approval</span>
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                        </div>

                        <Button
                            onClick={handleApplyToAll}
                            className="px-6 bg-gray-900 text-white hover:bg-gray-800"
                        >
                            Apply to all
                        </Button>
                    </div>

                    {/* Approval Permission */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            APPROVAL PERMISSION
                        </span>
                    </div>

                    <div className="flex items-center gap-3 mb-10">
                        <Switch
                            checked={allowManagersApprove}
                            onCheckedChange={setAllowManagersApprove}
                            className="data-[state=checked]:!bg-gray-500 data-[state=unchecked]:bg-gray-300 [&>span]:!bg-white"
                        />
                        <span className="text-sm text-gray-600">Allow managers to approve or deny their own manual time</span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
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
                            <span className="text-sm font-semibold text-gray-900">Modify time (manual time)</span>
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold text-gray-900">Require approval</span>
                                <Info className="w-3.5 h-3.5 text-gray-400" />
                            </div>
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
                                    <div className="inline-flex rounded-full bg-gray-100 p-0.5 w-fit">
                                        {modifyOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleMemberModifyChange(member.id, option.value)}
                                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${member.modifyTimeSetting === option.value
                                                    ? "bg-gray-800 text-white shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                    <Switch
                                        checked={member.requireApproval}
                                        onCheckedChange={(checked) => handleMemberApprovalChange(member.id, checked)}
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
