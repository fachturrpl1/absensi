"use client"

import Link from "next/link"
import { Star } from "lucide-react"

type SidebarItemKey = "keep-idle-time" | "idle-timeout" | "allowed-apps"

interface TrackingSidebarProps {
    activeItem: SidebarItemKey
}

const sidebarItems: { key: SidebarItemKey; label: string; href: string; icon?: React.ComponentType<{ className?: string }> }[] = [
    { key: "keep-idle-time", label: "Keep idle time", href: "/settings/tracking" },
    { key: "idle-timeout", label: "Idle timeout", href: "/settings/tracking/idle-timeout" },
    { key: "allowed-apps", label: "Allowed apps", href: "/settings/tracking/allowed-apps", icon: Star },
]

export function TrackingSidebar({ activeItem }: TrackingSidebarProps) {
    return (
        <div className="w-64 border-r border-slate-200 bg-slate-50">
            <div className="p-4 space-y-1">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeItem === item.key
                                ? "text-slate-900 bg-slate-100"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                }`}
                        >
                            {Icon && <Icon className="h-4 w-4" />}
                            {item.label}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
