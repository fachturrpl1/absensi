"use client"

import React, { useState, useEffect } from "react"
import { Info, Search, User, Loader2, ChevronLeft, ChevronRight } from "lucide-react"

import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { SettingsHeader, SettingTab } from "@/components/settings/SettingsHeader"
import { Building2 } from "lucide-react"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"

type ProjectRole = "none" | "viewer" | "user" | "manager"

interface MemberWithRole {
    id: string
    name: string
    avatar?: string
    role: ProjectRole
}

export default function DefaultProjectRolePage() {
    const loading = false
    const [globalRole, setGlobalRole] = useState<ProjectRole>("none")
    const [members, setMembers] = useState<MemberWithRole[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // Sync DUMMY_MEMBERS with local role state
    useEffect(() => {
        setMembers(prev => {
            // Keep existing roles for members we already have
            const existingRoles = new Map(prev.map(m => [m.id, m.role]))
            return DUMMY_MEMBERS.map(m => ({
                id: m.id,
                name: m.name,
                avatar: m.avatar,
                role: existingRoles.get(m.id) || globalRole
            }))
        })
    }, [globalRole])



    const roles: { value: ProjectRole; label: string }[] = [
        { value: "none", label: "None" },
        { value: "viewer", label: "Viewer" },
        { value: "user", label: "User" },
        { value: "manager", label: "Manager" },
    ]

    const handleGlobalRoleChange = (newRole: ProjectRole) => {
        setGlobalRole(newRole)
        setMembers(prev =>
            prev.map(member => ({ ...member, role: newRole }))
        )
    }

    const handleMemberRoleChange = (id: string, role: ProjectRole) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, role } : member
            )
        )
    }

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Pagination calculations
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage)

    // Reset to first page when search changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setCurrentPage(1)
    }

    const tabs: SettingTab[] = [
        { label: "PROJECTS & TO-DOS", href: "/settings/project&task", active: true },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "allow-project-tracking", label: "Allow project tracking", href: "/settings/project&task/allow-project-tracking" },
        { id: "global-todos", label: "Global to-dos", href: "/settings/project&task/global-todos" },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Organization"
                Icon={Building2}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="default-roles"
            />

            {/* Content */}
            <div className="flex flex-1 w-full overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            DEFAULT PROJECT ROLE
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 mb-8 max-w-2xl leading-relaxed">
                        When creating a new project, members will be assigned by default to the selected role.
                    </p>

                    {/* Global Setting */}
                    <div className="flex items-center gap-1 mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            GLOBAL SETTING:
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    {/* Role Selection Pills */}
                    <div className="flex flex-wrap items-center bg-slate-100 rounded-2xl p-1.5 w-full sm:w-fit mb-12 gap-1 shadow-inner">
                        {roles.map((role) => (
                            <button
                                key={role.value}
                                onClick={() => handleGlobalRoleChange(role.value)}
                                className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold rounded-xl transition-all ${globalRole === role.value
                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                    }`}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>

                    {/* Individual Settings Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Individual settings</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Override the organization default for specific members</p>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-900 text-sm h-10 transition-all bg-white"
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
                            {loading ? (
                                <div className="py-8 text-center text-sm text-slate-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading members...
                                    </div>
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="py-8 text-center text-sm text-slate-500">
                                    No members found
                                </div>
                            ) : paginatedMembers.map((member) => (
                                <div key={member.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                                            <User className="w-4.5 h-4.5 text-slate-400" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-900 group-hover:text-slate-950 transition-colors uppercase tracking-tight">{member.name}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 bg-slate-100 sm:bg-slate-50 rounded-2xl p-1 w-full sm:w-fit shadow-inner">
                                        {roles.map((role) => (
                                            <button
                                                key={role.value}
                                                onClick={() => handleMemberRoleChange(member.id, role.value)}
                                                className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest ${member.role === role.value
                                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                                    }`}
                                            >
                                                {role.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {!loading && filteredMembers.length > 0 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-500">
                                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="text-sm text-slate-700">
                                        Page {currentPage} of {totalPages || 1}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
