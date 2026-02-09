"use client"

import React, { useState, useEffect } from "react"
import { Info, Search, User, Loader2, ChevronLeft, ChevronRight } from "lucide-react"

import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { OrganizationHeader } from "@/components/settings/OrganizationHeader"
import { ProjectSidebar } from "@/components/settings/ProjectSidebar"

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

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <OrganizationHeader activeTab="projects-todos" />

            {/* Content */}
            <div className="flex flex-1">
                {/* Sidebar */}
                {/* Sidebar */}
                <ProjectSidebar activeItem="default-roles" />

                {/* Main Content */}
                <div className="flex-1 p-6">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            DEFAULT PROJECT ROLE
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        When creating a new project, members will be assigned by default to the selected role.
                    </p>

                    {/* Global Setting */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Role Selection Pills */}
                    <div className="flex items-center bg-gray-100 rounded-full p-1 w-fit mb-10">
                        {roles.map((role) => (
                            <button
                                key={role.value}
                                onClick={() => handleGlobalRoleChange(role.value)}
                                className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${globalRole === role.value
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {role.label}
                            </button>
                        ))}
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
                                onChange={(e) => handleSearchChange(e.target.value)}
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
                                <div key={member.id} className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                            <User className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <span className="text-sm text-gray-900">{member.name}</span>
                                    </div>
                                    <div className="flex items-center bg-gray-100 rounded-full p-1">
                                        {roles.map((role) => (
                                            <button
                                                key={role.value}
                                                onClick={() => handleMemberRoleChange(member.id, role.value)}
                                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${member.role === role.value
                                                    ? "bg-white text-gray-900 shadow-sm"
                                                    : "text-gray-600 hover:text-gray-900"
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
