"use client"

import Link from "next/link"
import { LucideIcon, Menu } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { SettingsSidebar, SidebarItem } from "./SettingsSidebar"
import { Button } from "@/components/ui/button"

export interface SettingTab {
    label: string
    href: string
    active: boolean
}

interface SettingsHeaderProps {
    title: string
    Icon: LucideIcon
    tabs: SettingTab[]
    sidebarItems?: SidebarItem[]
    activeItemId?: string
}

export function SettingsHeader({ title, Icon, tabs, sidebarItems, activeItemId }: SettingsHeaderProps) {
    return (
        <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 w-full bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {sidebarItems && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex items-center -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 h-9 w-9 p-0">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 w-72 border-r-0 shadow-2xl">
                                    <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                                        <SheetTitle className="flex items-center gap-3 text-slate-900">
                                            <div className="p-2 bg-white rounded-lg shadow-sm ring-1 ring-slate-200">
                                                <Icon className="h-5 w-5 text-slate-700" />
                                            </div>
                                            <span className="font-bold tracking-tight">{title}</span>
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="py-2 h-[calc(100vh-85px)] overflow-y-auto">
                                        <SettingsSidebar
                                            items={sidebarItems}
                                            activeItemId={activeItemId || ""}
                                            className="w-full border-r-0 h-full min-h-0 bg-transparent"
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )}
                        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 md:px-6 border-b border-slate-200 w-full bg-white">
                <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.label}
                            href={tab.href}
                            className={`px-2 md:px-4 py-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap tracking-tight ${tab.active
                                ? "text-slate-900 border-slate-900"
                                : "text-slate-500 hover:text-slate-900 border-transparent hover:border-slate-300"
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
