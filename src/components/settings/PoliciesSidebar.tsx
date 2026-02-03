"use client"

import Link from "next/link"

type SidebarItemKey = "policies" | "holidays" | "balances"

interface PoliciesSidebarProps {
    activeItem: SidebarItemKey
}

const sidebarItems: { key: SidebarItemKey; label: string; href: string }[] = [
    { key: "policies", label: "Time off policies", href: "/settings/Policies" },
    { key: "holidays", label: "Holidays", href: "/settings/Policies/holidays" },
    { key: "balances", label: "Time off balances", href: "/settings/Policies/time-off-balances" },
]

export function PoliciesSidebar({ activeItem }: PoliciesSidebarProps) {
    return (
        <aside className="w-64 flex-shrink-0 py-6 pr-6 border-r border-slate-200">
            <nav className="flex flex-col gap-1">
                {sidebarItems.map((item) => (
                    <div key={item.key} className="flex items-center">
                        <div
                            className={`w-1 h-8 rounded-r-lg mr-3 ${activeItem === item.key ? "bg-slate-900" : "bg-transparent"
                                }`}
                        />
                        <Link
                            href={item.href}
                            className={`flex-1 py-1.5 text-sm font-medium transition-colors ${activeItem === item.key ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
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
