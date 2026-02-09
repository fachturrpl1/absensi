"use client"

import Link from "next/link"

type SidebarItemKey = "policies" | "notifications"

interface WorkBreaksSidebarProps {
    activeItem: SidebarItemKey
}

const sidebarItems: { key: SidebarItemKey; label: string; href: string }[] = [
    { key: "policies", label: "break policies", href: "/settings/Policies/work-breaks" },
    { key: "notifications", label: "break notifications", href: "/settings/Policies/work-breaks/notifications" },
]

export function WorkBreaksSidebar({ activeItem }: WorkBreaksSidebarProps) {
    return (
        <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white">
            <nav className="flex flex-col py-4">
                {sidebarItems.map((item) => (
                    <div key={item.key} className="relative">
                        {activeItem === item.key && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900" />
                        )}
                        <Link
                            href={item.href}
                            className={`flex items-center px-6 py-2 text-sm font-medium transition-colors ${activeItem === item.key
                                ? "text-slate-900 bg-slate-100"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }`}
                        >
                            {item.label}
                        </Link>
                    </div>
                ))}
            </nav>
        </aside>
    )
}
