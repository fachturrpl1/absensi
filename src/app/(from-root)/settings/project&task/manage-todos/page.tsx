"use client"

import React, { useState } from "react"
import { Info } from "lucide-react"

import { OrganizationHeader } from "@/components/settings/OrganizationHeader"
import { ProjectSidebar } from "@/components/settings/ProjectSidebar"

type PermissionType = "everyone" | "management-only"

export default function ManageTodosPage() {
    const [permission, setPermission] = useState<PermissionType>("everyone")



    return (
        <div className="flex flex-col min-h-screen bg-white">
            <OrganizationHeader activeTab="projects-todos" />

            {/* Content */}
            <div className="flex flex-1">
                {/* Sidebar */}
                {/* Sidebar */}
                <ProjectSidebar activeItem="manage-todos" />

                {/* Main Content */}
                <div className="flex-1 p-6">
                    {/* Section Title */}
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            PERMISSION TO MANAGE TO-DOS
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        Allow tasks/to-dos to be managed (create, edit, delete) by everyone (role: users) or management only (roles: org owner and org managers)
                    </p>

                    {/* Default Setting */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            DEFAULT:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Permission Selection Pills */}
                    <div className="flex items-center bg-gray-100 rounded-full p-1 w-fit">
                        <button
                            onClick={() => setPermission("everyone")}
                            className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${permission === "everyone"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Everyone
                        </button>
                        <button
                            onClick={() => setPermission("management-only")}
                            className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${permission === "management-only"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Management Only
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
