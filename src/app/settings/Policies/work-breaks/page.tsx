"use client"

import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { WorkBreaksSidebar } from "@/components/settings/WorkBreaksSidebar"
import { Button } from "@/components/ui/button"
import { Plus, Coffee } from "lucide-react"

export default function WorkBreaksPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            <PoliciesHeader activeTab="work-breaks" />
            <div className="flex flex-1">
                <WorkBreaksSidebar activeItem="policies" />
                <div className="flex-1 p-8">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 mb-8">
                        <button className="px-4 py-2 text-sm font-medium text-slate-900 border-b-2 border-slate-900">
                            ACTIVE
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors">
                            ARCHIVED
                        </button>
                    </div>

                    {/* Empty State */}
                    <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
                        <div className="w-64 h-64 mb-6 relative">
                            {/* Placeholder for the illustration in the screenshot - using Coffee icon as placeholder for now, 
                                but in a real scenario we might want the specific illustration */}
                            <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center">
                                <Coffee className="w-24 h-24 text-slate-300" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">
                            No active work break policies
                        </h2>
                        <p className="text-slate-500 mb-8">
                            Set up automatic work break policies
                        </p>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add work break policy
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
