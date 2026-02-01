"use client"

import Link from "next/link"

type SidebarItemKey = "track-apps-urls" | "data-privacy" | "record-activity"

interface ActivitySidebarProps {
    activeItem: SidebarItemKey
}

const sidebarItems: { key: SidebarItemKey; label: string; href: string }[] = [
    { key: "track-apps-urls", label: "Track apps & URLs", href: "/settings/Activity" },
    { key: "data-privacy", label: "Data privacy", href: "/settings/Activity/data-privacy" },
    { key: "record-activity", label: "Record activity", href: "/settings/Activity/record-activity" },
]

export function ActivitySidebar({ activeItem }: ActivitySidebarProps) {
    return (
        <div className="w-64 border-r border-slate-200 bg-slate-50">
            <div className="p-4 space-y-1">
                {sidebarItems.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeItem === item.key
                            ? "text-slate-900 bg-slate-100"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    )
}
