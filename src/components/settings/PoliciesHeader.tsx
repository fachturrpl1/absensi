"use client"

import Link from "next/link"
import { FileText } from "lucide-react"

type TabKey = "time-off" | "work-breaks" | "overtime"

interface PoliciesHeaderProps {
    activeTab: TabKey
}

const tabs: { key: TabKey; label: string; href: string }[] = [
    { key: "time-off", label: "TIME OFF", href: "/settings/Policies" },
    { key: "work-breaks", label: "BREAKS", href: "/settings/Policies/work-breaks" }, // Assuming these routes for now
    { key: "overtime", label: "OVERTIME", href: "/settings/Policies/overtime" },       // Assuming these routes for now
]

export function PoliciesHeader({ activeTab }: PoliciesHeaderProps) {
    return (
        <div className="flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 w-full">
                <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-slate-700" />
                    <h1 className="text-2xl font-semibold text-slate-900">Policies</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-slate-200 w-full">
                <div className="flex gap-8">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.key
                                ? "text-slate-900 border-slate-900"
                                : "text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300"
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
