"use client"

import React from "react"
import Link from "next/link"
import { Building2 } from "lucide-react"

interface Tab {
    label: string
    href: string
    active: boolean
}

interface OrganizationHeaderProps {
    activeTab: "company-information" | "security-login" | "projects-todos"
}

export function OrganizationHeader({ activeTab }: OrganizationHeaderProps) {
    const tabs: Tab[] = [
        {
            label: "COMPANY INFORMATION",
            href: "/settings/organization/company-information",
            active: activeTab === "company-information"
        },
        {
            label: "SECURITY & LOG IN",
            href: "/settings/organization/security-login",
            active: activeTab === "security-login"
        },
        {
            label: "PROJECTS & TO-DOS",
            href: "/settings/project&task",
            active: activeTab === "projects-todos"
        },
    ]

    return (
        <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 w-full">
                <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-slate-700" />
                    <h1 className="text-xl font-semibold text-slate-900">Organization</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-slate-200 w-full">
                <div className="flex gap-8">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.label}
                            href={tab.href}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab.active
                                ? "text-slate-900 border-slate-900"
                                : "text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300"
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    )
}
