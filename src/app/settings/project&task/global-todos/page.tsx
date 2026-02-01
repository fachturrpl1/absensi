"use client"

import React, { useState } from "react"
import { Plus, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { OrganizationHeader } from "@/components/settings/OrganizationHeader"
import { ProjectSidebar } from "@/components/settings/ProjectSidebar"

interface GlobalTodo {
    id: string
    name: string
    projects: string[]
}

export default function GlobalTodosPage() {
    const [todos] = useState<GlobalTodo[]>([])



    return (
        <div className="flex flex-col min-h-screen bg-white">
            <OrganizationHeader activeTab="projects-todos" />

            {/* Content */}
            <div className="flex flex-1">
                {/* Sidebar */}
                {/* Sidebar */}
                <ProjectSidebar activeItem="global-todos" />

                {/* Main Content */}
                <div className="flex-1 p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                GLOBAL TO-DOS
                            </h2>
                            <p className="text-sm text-gray-600 max-w-2xl">
                                Global to-dos can be added to any project. Once added to a project, all members of the project can track time to them, and they cannot be marked as complete so they'll always be visible. Data from these shared to-dos can be viewed across projects in 'Time & activity' report.
                            </p>
                        </div>
                        <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Add a global to-do
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="mt-8">
                        {/* Table Header */}
                        <div className="grid grid-cols-2 py-3 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-900">Name</span>
                            <span className="text-sm font-semibold text-gray-900">Projects</span>
                        </div>

                        {/* Table Body - Empty State */}
                        {todos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                                    <Package className="w-12 h-12 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Add global to-dos
                                </h3>
                                <p className="text-sm text-gray-500 text-center max-w-sm">
                                    Create global to-dos and easily add them to multiple projects
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {todos.map((todo) => (
                                    <div key={todo.id} className="grid grid-cols-2 items-center py-4">
                                        <span className="text-sm text-gray-900">{todo.name}</span>
                                        <span className="text-sm text-gray-500">
                                            {todo.projects.length} projects
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
