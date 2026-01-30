"use client"

import React, { useState } from "react"
import {
    Info, Search
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { OrganizationHeader } from "@/components/settings/OrganizationHeader"

interface ProjectWithTracking {
    id: string
    name: string
    tasks: number
    trackingEnabled: boolean
}

export default function AllowProjectTrackingPage() {
    const [globalEnabled, setGlobalEnabled] = useState(true)
    const [projects, setProjects] = useState<ProjectWithTracking[]>([
        { id: "1", name: "SMA Bradas", tasks: 0, trackingEnabled: true },
        { id: "2", name: "SMK 100 Brantas' Project", tasks: 3, trackingEnabled: false },
    ])
    const [searchQuery, setSearchQuery] = useState("")

    const sidebarItems = [
        { label: "Default project role", href: "/settings/project&task", active: false },
        { label: "Complete to-dos", href: "/settings/project&task/complete-todos", active: false },
        { label: "Manage to-dos", href: "/settings/project&task/manage-todos", active: false },
        { label: "Allow project tracking", href: "/settings/project&task/allow-project-tracking", active: true },
        { label: "Global to-dos", href: "/settings/project&task/global-todos", active: false },
    ]

    const handleProjectTrackingChange = (id: string, enabled: boolean) => {
        setProjects(prev =>
            prev.map(project =>
                project.id === id ? { ...project, trackingEnabled: enabled } : project
            )
        )
    }

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <OrganizationHeader activeTab="projects-todos" />

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
                            ALLOW PROJECT TRACKING
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-6">
                        When enabled, members will be allowed to track time directly to the project. Disabling this setting will set a restriction to time tracking, requiring members to select a to-do before they can begin tracking time.
                    </p>

                    {/* Global Setting */}
                    <div className="flex items-center gap-1 mb-3">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    <div className="mb-10">
                        <Switch
                            checked={globalEnabled}
                            onCheckedChange={setGlobalEnabled}
                        />
                    </div>

                    {/* Individual Settings Section */}
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Individual settings</h3>
                            <p className="text-sm text-gray-500">Override the organization default for specific projects</p>
                        </div>
                        <div className="relative w-56">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search projects"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 border-gray-300 rounded-full bg-white"
                            />
                        </div>
                    </div>

                    {/* Projects Table */}
                    <div className="mt-6">
                        {/* Table Header */}
                        <div className="grid grid-cols-3 py-3 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-900">Project</span>
                            <span className="text-sm font-semibold text-gray-900">Tasks</span>
                            <span></span>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {filteredProjects.map((project) => (
                                <div key={project.id} className="grid grid-cols-3 items-center py-4">
                                    <span className="text-sm text-gray-900">{project.name}</span>
                                    <span className="text-sm text-gray-500">{project.tasks}</span>
                                    <div className="flex justify-end">
                                        <Switch
                                            checked={project.trackingEnabled}
                                            onCheckedChange={(checked) => handleProjectTrackingChange(project.id, checked)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
