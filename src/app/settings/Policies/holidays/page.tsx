"use client"

import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { PoliciesSidebar } from "@/components/settings/PoliciesSidebar"
import { Button } from "@/components/ui/button"
import { Plus, Gift } from "lucide-react"

export default function HolidaysPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            <PoliciesHeader activeTab="time-off" />
            <div className="flex flex-1">
                <PoliciesSidebar activeItem="holidays" />
                <div className="flex-1 p-8">
                    <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
                        <div className="w-64 h-64 mb-6 relative flex items-center justify-center">
                            {/* Placeholder for illustration */}
                            <Gift className="w-24 h-24 text-slate-300" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">
                            No holidays added
                        </h2>
                        <p className="text-slate-500 mb-8">
                            Add holidays for time off
                        </p>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add holiday
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
