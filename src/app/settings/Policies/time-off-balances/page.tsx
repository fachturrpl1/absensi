"use client"

import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { PoliciesSidebar } from "@/components/settings/PoliciesSidebar"
import { Button } from "@/components/ui/button"
import { Info, Download, Search } from "lucide-react"

export default function TimeOffBalancesPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PoliciesHeader activeTab="time-off" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <PoliciesSidebar activeItem="balances" />

                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    TIME OFF BALANCES
                                    <Info className="w-4 h-4 text-slate-400" />
                                </h2>
                                <p className="text-slate-500 mt-1">
                                    Set up time off balances for members
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search members"
                                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="text-blue-500 border-transparent hover:bg-blue-50">
                                        <Download className="w-4 h-4 mr-2" />
                                        Export
                                    </Button>
                                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                                        Import
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-64 h-64 mb-6 bg-slate-100 rounded-lg flex items-center justify-center relative">
                                {/* Placeholder for illustration */}
                                <span className="text-slate-400 text-6xl">❓</span>
                                {/* Simulating the grid/question mark illustration */}
                                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 opacity-10">
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div key={i} className="bg-slate-900"></div>
                                    ))}
                                </div>
                            </div>
                            {/* Empty state message or just illustration as per screenshot */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
