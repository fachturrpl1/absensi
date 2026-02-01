"use client"

import Link from "next/link"

type SidebarItemKey = "default-roles" | "complete-todos" | "manage-todos" | "allow-project-tracking" | "global-todos"

interface ProjectSidebarProps {
    activeItem: SidebarItemKey
}

const sidebarItems: { key: SidebarItemKey; label: string; href: string }[] = [
    { key: "default-roles", label: "Default project role", href: "/settings/project&task" },
    { key: "complete-todos", label: "Complete to-dos", href: "/settings/project&task/complete-todos" },
    { key: "manage-todos", label: "Manage to-dos", href: "/settings/project&task/manage-todos" },
    { key: "allow-project-tracking", label: "Allow project tracking", href: "/settings/project&task/allow-project-tracking" },
    { key: "global-todos", label: "Global to-dos", href: "/settings/project&task/global-todos" },
]

export function ProjectSidebar({ activeItem }: ProjectSidebarProps) {
    return (
        <div className="w-56 border-r border-gray-200 py-6">
            {sidebarItems.map((item) => (
                <Link
                    key={item.key}
                    href={item.href}
                    className={`block px-6 py-2 text-sm transition-colors ${activeItem === item.key
                        ? "text-gray-900 border-l-2 border-gray-900 font-medium"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    {item.label}
                </Link>
            ))}
        </div>
    )
}
