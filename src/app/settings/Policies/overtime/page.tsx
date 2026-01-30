"use client"

import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { Button } from "@/components/ui/button"
import { Plus, Clock } from "lucide-react"

export default function OvertimePage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PoliciesHeader activeTab="overtime" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-64 h-64 mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                        <Clock className="w-24 h-24 text-slate-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                        No overtime policies added
                    </h2>
                    <p className="text-slate-500 mb-8">
                        Set up overtime policies for your organization
                    </p>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add overtime policy
                    </Button>
                </div>
            </div>
        </div>
    )
}
