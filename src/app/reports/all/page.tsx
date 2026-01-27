"use client"

import React, { useState } from "react"

import { ReportCard } from "@/components/report/report-card"
import { Input } from "@/components/ui/input"
import { Search, X, Activity, DollarSign, BarChart3, Star } from "lucide-react"
import { DUMMY_CUSTOM_REPORTS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Define Report Types
type ReportSection = {
    title: string
    items: {
        title: string
        description: string
        href: string
        isPopular?: boolean
        icon?: React.ReactNode
        isStarred?: boolean
    }[]
}

export default function AllReportsPage() {
    const [searchTerm, setSearchTerm] = useState("")

    // Define Report Data
    const reportSections: ReportSection[] = [
        {
            title: "Popular reports",
            items: [
                {
                    title: "Time & activity",
                    description: "See team members' time worked, activity levels, and amounts earned per project or to-do",
                    href: "/reports/time-activity",
                    isPopular: true,
                    isStarred: true,
                    icon: <div className="p-3 bg-blue-100 rounded-lg"><Activity className="w-8 h-8 text-blue-600" /></div>
                },
                {
                    title: "Amounts owed",
                    description: "See how much the hourly paid team members are currently owed",
                    href: "/reports/amounts-owed",
                    isPopular: true,
                    isStarred: true,
                    icon: <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="w-8 h-8 text-green-600" /></div>
                },
                {
                    title: "Daily totals",
                    description: "See team members' time worked, activity levels, and amount earned per days",
                    href: "/reports/daily-totals",
                    isPopular: true,
                    isStarred: true,
                    icon: <div className="p-3 bg-purple-100 rounded-lg"><BarChart3 className="w-8 h-8 text-purple-600" /></div>
                }
            ]
        },
        {
            title: "General",
            items: [
                {
                    title: "Time & activity (Legacy)",
                    description: "See team members' time worked, activity levels, and amounts earned per project or to-do",
                    href: "#",
                    isStarred: true
                },
                {
                    title: "Work sessions",
                    description: "See the start and stop times for team members",
                    href: "#"
                },
                {
                    title: "Apps & URLs",
                    description: "See team members' apps used and URLs visited while working",
                    href: "#"
                },
                {
                    title: "Manual time edits",
                    description: "See team members' time worked, project, to-do, and reason for each manual time entry",
                    href: "#"
                },
                {
                    title: "Timesheet approvals",
                    description: "See team member's timesheets and their status",
                    href: "#"
                },
                {
                    title: "Expenses",
                    description: "See how much has been spent on expenses by member and project",
                    href: "#"
                },
                {
                    title: "Work breaks",
                    description: "See how many work breaks team members are taking",
                    href: "#"
                },
                {
                    title: "Audit log",
                    description: "See who changed what, when, and how (HS People add-on)",
                    href: "#"
                }
            ]
        },
        {
            title: "Payment",
            items: [
                {
                    title: "Payments",
                    description: "See how much team members were paid over a given period",
                    href: "#",
                    isStarred: true
                }
            ]
        },
        {
            title: "Budgets and limits",
            items: [
                { title: "Weekly limits", description: "See team members' weekly limits usage", href: "#" },
                { title: "Daily limits", description: "See team members' daily limits usage", href: "#" },
                { title: "Project budgets", description: "See how much of your projects' budgets have been spent", href: "#" },
                { title: "Client budgets", description: "See how much of your clients' budgets have been spent", href: "#" }
            ]
        },
        {
            title: "Time off",
            items: [
                { title: "Time off balances", description: "See your team's time off balances across the organization's time off policies", href: "#" },
                { title: "Time off transactions", description: "See your team's time off transactions across the organization's time off policies", href: "#" }
            ]
        },
        {
            title: "Invoice",
            items: [
                { title: "Client invoices", description: "See client invoice totals, paid, and due amounts", href: "#" },
                { title: "Team invoices", description: "See team member invoice totals, paid, and due amounts", href: "#" },
                { title: "Client invoices aging", description: "See outstanding and past due client invoices", href: "#" },
                { title: "Team invoices aging", description: "See outstanding and past due team member invoices", href: "#" }
            ]
        },
        {
            title: "Schedule",
            items: [
                { title: "Shift attendance", description: "See team members' completed, late, abandoned, and missed shifts", href: "#" }
            ]
        },
        {
            title: "Job sites",
            items: [
                { title: "Visits", description: "See when your team members' entered and left a job site", href: "#" }
            ]
        }
    ]

    // Filter Logic
    const filteredSections = reportSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(section => section.items.length > 0)

    // Dummy Customized Reports (Limit to 2 for preview like in mockup)
    const customizedReports = DUMMY_CUSTOM_REPORTS.slice(0, 2)

    return (
        <div className="flex flex-1 flex-col gap-8 p-6 pt-2 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-700">Reports</h1>
                <div className="relative w-[300px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search reports"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-300 rounded-full bg-white shadow-sm focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* Customized Reports Section - Only show if no search term */}
            {!searchTerm && (
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Customized reports</h2>


                    {/* Customized Report Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customizedReports.map((report) => (
                            <div key={report.id} className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm hover:border-blue-300 transition-all cursor-pointer">
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{report.name}</h3>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                        {report.type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-yellow-400">
                                        <Star className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Main Reports Grid */}
            <div className="space-y-10 pb-10">
                {filteredSections.map((section, idx) => (
                    <section key={idx} className="space-y-4">
                        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{section.title}</h2>

                        <div className={cn(
                            "grid gap-6",
                            section.title === "Popular reports"
                                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        )}>
                            {section.items.map((item, i) => (
                                <ReportCard
                                    key={i}
                                    title={item.title}
                                    description={item.description}
                                    href={item.href}
                                    icon={item.icon}
                                    isPopular={section.title === "Popular reports"}
                                    isStarred={item.isStarred}
                                />
                            ))}
                        </div>
                    </section>
                ))}

                {filteredSections.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
                        <p>Try adjusting your search terms</p>
                    </div>
                )}
            </div>
        </div>
    )
}


