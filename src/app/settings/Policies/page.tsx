"use client"

import { useState } from "react"
import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { PoliciesSidebar } from "@/components/settings/PoliciesSidebar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function TimeOffPoliciesPage() {
    const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE")

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <PoliciesHeader activeTab="time-off" />
            <div className="flex flex-1">
                <PoliciesSidebar activeItem="policies" />
                <div className="flex-1 p-8">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 mb-8">
                        <button
                            onClick={() => setActiveTab("ACTIVE")}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "ACTIVE"
                                ? "text-slate-900 border-slate-900"
                                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
                                }`}
                        >
                            ACTIVE
                        </button>
                        <button
                            onClick={() => setActiveTab("ARCHIVED")}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "ARCHIVED"
                                ? "text-slate-900 border-slate-900"
                                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
                                }`}
                        >
                            ARCHIVED
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === "ACTIVE" ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
                            <div className="w-64 h-64 mb-6 bg-slate-50 rounded-full flex items-center justify-center">
                                {/* Placeholder for illustration */}
                                <span className="text-slate-300 text-6xl">📄</span>
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                No active time off policies
                            </h2>
                            <p className="text-slate-500 mb-8">
                                Set up automatic accrual policies for time off
                            </p>
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Add policy
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            No archived policies found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
