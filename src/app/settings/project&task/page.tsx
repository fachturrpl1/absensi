"use client"

import React, { useState } from "react"
import { Info, Search, User } from "lucide-react"

import { OrganizationHeader } from "@/components/settings/OrganizationHeader"
import { ProjectSidebar } from "@/components/settings/ProjectSidebar"
import { DUMMY_MEMBERS as SHARED_MEMBERS } from "@/lib/data/dummy-data"

type ProjectRole = "none" | "viewer" | "user" | "manager"

interface MemberWithRole {
    id: string
    name: string
    avatar?: string
    role: ProjectRole
}

export default function DefaultProjectRolePage() {
    const [globalRole, setGlobalRole] = useState<ProjectRole>("none")
    const [members, setMembers] = useState<MemberWithRole[]>(
        SHARED_MEMBERS.map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            role: "none" as ProjectRole
        }))
    )
    const [searchQuery, setSearchQuery] = useState("")



    const roles: { value: ProjectRole; label: string }[] = [
        { value: "none", label: "None" },
        { value: "viewer", label: "Viewer" },
        { value: "user", label: "User" },
        { value: "manager", label: "Manager" },
    ]

    const handleMemberRoleChange = (id: string, role: ProjectRole) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id ? { ...member, role } : member
            )
        )
    }

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                                onClick={() => setGlobalRole(role.value)}
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
