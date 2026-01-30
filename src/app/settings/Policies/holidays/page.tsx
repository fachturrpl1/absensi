"use client"

import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { PoliciesSidebar } from "@/components/settings/PoliciesSidebar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function HolidaysPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PoliciesHeader activeTab="time-off" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <PoliciesSidebar activeItem="holidays" />

                    <div className="flex-1">
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-64 h-64 mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                                {/* Placeholder for illustration */}
                                <span className="text-slate-400 text-6xl">🎄</span>
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                No holidays added
                            </h2>
                            <p className="text-slate-500 mb-8">
                                Add holidays for time off
                            </p>
                            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add holiday
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
