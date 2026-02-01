"use client"

import Link from "next/link"

type SidebarItemKey = "restrict-timer" | "enter-exit-notifications"

interface JobSitesSidebarProps {
    activeItem: SidebarItemKey
}

const sidebarItems: { key: SidebarItemKey; label: string; href: string }[] = [
    { key: "restrict-timer", label: "Restrict timer to job sites", href: "/settings/Job-sites" },
    { key: "enter-exit-notifications", label: "Enter/exit notifications", href: "/settings/Job-sites/enter-exit-notifications" },
]

export function JobSitesSidebar({ activeItem }: JobSitesSidebarProps) {
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
