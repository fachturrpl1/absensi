"use client"

import Link from "next/link"

type SidebarItemKey = "modify-time" | "require-reason" | "reasons"

interface TimesheetSidebarProps {
    activeItem: SidebarItemKey
}

const sidebarItems: { key: SidebarItemKey; label: string; href: string }[] = [
    { key: "modify-time", label: "Modify time (manual time)", href: "/settings/Timesheet" },
    { key: "require-reason", label: "Require reason", href: "/settings/Timesheet/require-reason" },
    { key: "reasons", label: "Reasons", href: "/settings/Timesheet/reasons" },
]

export function TimesheetSidebar({ activeItem }: TimesheetSidebarProps) {
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
