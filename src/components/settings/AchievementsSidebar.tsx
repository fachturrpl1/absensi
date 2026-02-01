"use client"

import Link from "next/link"

type SidebarItemKey = "efficiency-pro" | "productivity-champ" | "time-hero"

interface AchievementsSidebarProps {
    activeItem: SidebarItemKey
}

const sidebarItems: { key: SidebarItemKey; label: string; href: string }[] = [
    { key: "efficiency-pro", label: "Efficiency pro", href: "/settings/Achievements" },
    { key: "productivity-champ", label: "Productivity champ", href: "/settings/Achievements/productivity-champ" },
    { key: "time-hero", label: "Time hero", href: "/settings/Achievements/time-hero" },
]

export function AchievementsSidebar({ activeItem }: AchievementsSidebarProps) {
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
