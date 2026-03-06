"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Info, Search, User, Loader2, ChevronLeft, ChevronRight, Activity } from "lucide-react"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/screenshots"
import { getOrgSettings, upsertOrgSetting, getAllMemberSettings, upsertMemberSetting } from "@/action/organization-settings"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type ModifyTimeOption = "add-edit" | "off"

interface MemberWithSettings extends ISimpleMember {
    modifyTimeSetting: ModifyTimeOption
    requireApproval: boolean
}

export default function TimesheetPage() {
    const { organizationId } = useOrgStore()
    const [members, setMembers] = useState<MemberWithSettings[]>([])
    const [totalMembers, setTotalMembers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [globalModifySetting, setGlobalModifySetting] = useState<ModifyTimeOption>("add-edit")
    const [globalRequireApproval, setGlobalRequireApproval] = useState(false)
    const [allowManagersApprove, setAllowManagersApprove] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Fetch Members and Settings
    useEffect(() => {
        async function loadData() {
            if (!organizationId) {
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                const [membersRes, orgSettingsRes, allMemberSettingsRes] = await Promise.all([
                    getMembersForScreenshot(
                        String(organizationId),
                        { page: currentPage, limit: itemsPerPage },
                        searchQuery
                    ),
                    getOrgSettings(String(organizationId)),
                    getAllMemberSettings(String(organizationId))
                ])

                let gModify = globalModifySetting
                let gApproval = globalRequireApproval

                if (orgSettingsRes.success && orgSettingsRes.data) {
                    if (orgSettingsRes.data.modify_time) {
                        setGlobalModifySetting(orgSettingsRes.data.modify_time as ModifyTimeOption)
                        gModify = orgSettingsRes.data.modify_time as ModifyTimeOption
                    }
                    if (orgSettingsRes.data.require_approval !== undefined) {
                        setGlobalRequireApproval(!!orgSettingsRes.data.require_approval)
                        gApproval = !!orgSettingsRes.data.require_approval
                    }
                    if (orgSettingsRes.data.allow_managers_approve !== undefined) {
                        setAllowManagersApprove(!!orgSettingsRes.data.allow_managers_approve)
                    }
                }

                if (membersRes.success && membersRes.data) {
                    const memberOverrides = allMemberSettingsRes.success ? allMemberSettingsRes.data : {}

                    const mapped = membersRes.data.map(m => {
                        const settings = memberOverrides?.[Number(m.id)] || {}
                        return {
                            ...m,
                            modifyTimeSetting: (settings.modify_time as ModifyTimeOption) || gModify,
                            requireApproval: settings.require_approval !== undefined ? !!settings.require_approval : gApproval
                        }
                    })
                    setMembers(mapped)
                    setTotalMembers(membersRes.total ?? 0)
                }
            } catch (err) {
                console.error("Failed to load timesheet data", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [organizationId, currentPage, searchQuery])

    const modifyOptions: { value: ModifyTimeOption; label: string }[] = [
        { value: "add-edit", label: "Add & edit" },
        { value: "off", label: "Off" },
    ]

    const handleApplyToAll = async () => {
        if (!organizationId) return

        try {
            setLoading(true)
            // Save global defaults
            await upsertOrgSetting(String(organizationId), {
                modify_time: globalModifySetting,
                require_approval: globalRequireApproval
            })

            // Update local state for all currently loaded members
            setMembers(prev =>
                prev.map(member => ({
                    ...member,
                    modifyTimeSetting: globalModifySetting,
                    requireApproval: globalRequireApproval
                }))
            )

            toast.success("Applied to all members and updated defaults")
        } catch (err) {
            console.error("Failed to apply to all", err)
            toast.error("Failed to apply settings to all")
        } finally {
            setLoading(false)
        }
    }

    const handleGlobalModifyChange = async (value: ModifyTimeOption) => {
        const prev = globalModifySetting
        setGlobalModifySetting(value)
        if (!organizationId) return
        try {
            const res = await upsertOrgSetting(String(organizationId), { modify_time: value })
            if (!res.success) throw new Error(res.message)
            toast.success("Default modify time updated")
        } catch (err) {
            setGlobalModifySetting(prev)
            toast.error("Failed to update default")
        }
    }

    const handleGlobalApprovalChange = async (value: boolean) => {
        const prev = globalRequireApproval
        setGlobalRequireApproval(value)
        if (!organizationId) return
        try {
            const res = await upsertOrgSetting(String(organizationId), { require_approval: value })
            if (!res.success) throw new Error(res.message)
            toast.success("Default approval requirement updated")
        } catch (err) {
            setGlobalRequireApproval(prev)
            toast.error("Failed to update default")
        }
    }

    const handleAllowManagersApproveChange = async (value: boolean) => {
        const prev = allowManagersApprove
        setAllowManagersApprove(value)
        if (!organizationId) return
        try {
            const res = await upsertOrgSetting(String(organizationId), { allow_managers_approve: value })
            if (!res.success) throw new Error(res.message)
            toast.success("Approval permission updated")
        } catch (err) {
            setAllowManagersApprove(prev)
            toast.error("Failed to update permission")
        }
    }

    const handleMemberModifyChange = async (id: string, value: ModifyTimeOption) => {
        const original = members.find(m => m.id === id)
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, modifyTimeSetting: value } : member
            )
        )

        try {
            const res = await upsertMemberSetting(id, { modify_time: value })
            if (!res.success) throw new Error(res.message)
            toast.success("Member setting updated")
        } catch (err) {
            if (original) {
                setMembers(prev => prev.map(m => m.id === id ? original : m))
            }
            toast.error("Failed to update member setting")
        }
    }

    const handleMemberApprovalChange = async (id: string, value: boolean) => {
        const original = members.find(m => m.id === id)
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, requireApproval: value } : member
            )
        )

        try {
            const res = await upsertMemberSetting(id, { require_approval: value })
            if (!res.success) throw new Error(res.message)
            toast.success("Member setting updated")
        } catch (err) {
            if (original) {
                setMembers(prev => prev.map(m => m.id === id ? original : m))
            }
            toast.error("Failed to update member setting")
        }
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setCurrentPage(1)
    }

    const totalPages = Math.ceil(totalMembers / itemsPerPage)

    const tabs: SettingTab[] = [
        { label: "ACTIVITY", href: "/settings/Activity", active: false },
        { label: "TIMESHEETS", href: "/settings/timesheets", active: true },
        { label: "TRACKING", href: "/settings/tracking", active: false },
        { label: "SCREENSHOTS", href: "/settings/screenshot", active: false },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Activity & Tracking"
                Icon={Activity}
                tabs={tabs}
                sidebarItems={[
                    { id: "modify-time", label: "Modify time (manual time)", href: "/settings/timesheets" },
                    { id: "require-reason", label: "Require reason", href: "/settings/timesheets/require-reason" },
                    { id: "reasons", label: "Reasons", href: "/settings/timesheets/reasons" },
                ]}
                activeItemId="modify-time"
            />

            {/* Main Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            MODIFY TIME (MANUAL TIME)
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-1 font-light">
                        Customize your team's ability to modify time (add manual time and edit previously tracked time).
                    </p>
                    <p className="text-sm text-gray-600 mb-6 font-light">
                        Ensure this setting is 'Off' to not allow time modifications. Members are able to delete their own time before it's paid. <Link href="#" className="text-gray-900 underline">View more</Link>
                    </p>

                    {/* Default Label */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            DEFAULT
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Default Settings Row */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
                        {/* Modify Time Toggle */}
                        <div className="inline-flex rounded-full bg-gray-100 p-0.5 shrink-0">
                            {modifyOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleGlobalModifyChange(option.value)}
                                    className={`px-5 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${globalModifySetting === option.value
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 font-light"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Require Approval Switch Group */}
                        <div className="flex items-center gap-3 shrink-0">
                            <Switch
                                checked={globalRequireApproval}
                                onCheckedChange={handleGlobalApprovalChange}
                                className="data-[state=checked]:!bg-gray-900 data-[state=unchecked]:bg-slate-200 [&>span]:!bg-white"
                            />
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600 font-medium">Require approval</span>
                                <Info className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                        </div>

                        <Button
                            onClick={handleApplyToAll}
                            disabled={loading}
                            className="bg-gray-900 text-white hover:bg-gray-800 h-10 px-6 rounded-lg text-sm font-medium w-full sm:w-auto transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply to all"}
                        </Button>
                    </div>

                    {/* Approval Permission */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            APPROVAL PERMISSION
                        </span>
                    </div>

                    <div className="flex items-start sm:items-center gap-3 mb-10">
                        <Switch
                            checked={allowManagersApprove}
                            onCheckedChange={handleAllowManagersApproveChange}
                            className="mt-0.5 sm:mt-0 data-[state=checked]:!bg-gray-900 data-[state=unchecked]:bg-slate-200 [&>span]:!bg-white"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <span className="text-sm text-gray-600 leading-snug font-light">Allow managers to approve or deny their own manual time</span>
                            <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        </div>
                    </div>

                    {/* Individual Settings Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                        <div className="space-y-1">
                            <h3 className="text-lg font-normal text-gray-900">Individual settings</h3>
                            <p className="text-sm text-gray-500 font-light">Override the organization default for specific members</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 font-light" />
                            <input
                                type="text"
                                placeholder="Search members"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm h-10 transition-all font-light placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
                        {/* Table Header */}
                        <div className="hidden sm:grid grid-cols-3 py-3 bg-slate-50 border-b border-slate-200 px-4">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</span>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Modify time (manual time)</span>
                            <div className="flex items-center gap-1 justify-end">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Require approval</span>
                                <Info className="w-3 h-3 text-slate-400" />
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-100 min-h-[300px]">
                            {loading && members.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                                    <span className="text-xs font-light uppercase tracking-widest">Loading members...</span>
                                </div>
                            ) : members.length === 0 ? (
                                <div className="py-20 text-center text-slate-400">
                                    <span className="text-xs font-light uppercase tracking-widest">No members found</span>
                                </div>
                            ) : members.map((member) => (
                                <div key={member.id} className="flex flex-col sm:grid sm:grid-cols-3 sm:items-center py-4 px-4 gap-4 sm:gap-0 hover:bg-slate-50/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="w-4 h-4 text-slate-400" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-slate-900">{member.name}</span>
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="inline-flex rounded-full bg-slate-100 p-0.5 w-fit">
                                            {modifyOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleMemberModifyChange(member.id, option.value)}
                                                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${member.modifyTimeSetting === option.value
                                                        ? "bg-white text-gray-900 shadow-sm"
                                                        : "text-gray-500 hover:text-gray-700 font-light"
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-2">
                                        <span className="text-[10px] font-normal text-slate-400 sm:hidden uppercase tracking-wider font-light">Require approval:</span>
                                        <Switch
                                            checked={member.requireApproval}
                                            onCheckedChange={(checked) => handleMemberApprovalChange(member.id, checked)}
                                            className="data-[state=checked]:!bg-slate-900 data-[state=unchecked]:bg-slate-200 [&>span]:!bg-white"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination */}
                    {!loading && members.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4 px-2 mb-8">
                            <div className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalMembers)} of {totalMembers} members
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-[10px] font-normal text-slate-500 uppercase tracking-widest px-2">
                                    Page {currentPage} of {totalPages || 1}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
