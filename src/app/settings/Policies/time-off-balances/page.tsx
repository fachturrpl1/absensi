"use client"

import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { PoliciesSidebar } from "@/components/settings/PoliciesSidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Upload, HelpCircle, Info } from "lucide-react"

export default function TimeOffBalancesPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            <PoliciesHeader activeTab="time-off" />
            <div className="flex flex-1">
                <PoliciesSidebar activeItem="balances" />
                <div className="flex-1 p-8">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    TIME OFF BALANCES
                                </h2>
                                <Info className="w-4 h-4 text-slate-400" />
                            </div>
                            <p className="text-xl font-medium text-slate-900">
                                Set up time off balances for members
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search members"
                                    className="pl-9 bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex justify-end gap-3 mb-8">
                        <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                            <Upload className="w-4 h-4 mr-2" />
                            Import
                        </Button>
                    </div>

                    {/* Empty State */}
                    <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
                        <div className="w-64 h-64 mb-6 relative flex items-center justify-center">
                            {/* Placeholder for illustration */}
                            <HelpCircle className="w-24 h-24 text-slate-300" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">
                            No time off balances to show
                        </h2>
                        <p className="text-slate-500 mb-8">
                            Expecting to see something? Try adding members to your policies first.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
