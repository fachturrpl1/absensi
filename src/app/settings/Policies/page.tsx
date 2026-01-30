"use client"

import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { PoliciesSidebar } from "@/components/settings/PoliciesSidebar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"

export default function TimeOffPoliciesPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PoliciesHeader activeTab="time-off" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <PoliciesSidebar activeItem="policies" />

                    <div className="flex-1">
                        <Tabs defaultValue="active" className="w-full">
                            <TabsList className="bg-transparent p-0 mb-8 border-b border-gray-200 w-full justify-start rounded-none h-auto">
                                <TabsTrigger
                                    value="active"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-4 py-2"
                                >
                                    ACTIVE
                                </TabsTrigger>
                                <TabsTrigger
                                    value="archived"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-4 py-2"
                                >
                                    ARCHIVED
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="active" className="mt-0">
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-64 h-64 mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                                        {/* Placeholder for illustration */}
                                        <span className="text-slate-400 text-6xl">📄</span>
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                        No active time off policies
                                    </h2>
                                    <p className="text-slate-500 mb-8">
                                        Set up automatic accrual policies for time off
                                    </p>
                                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add policy
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="archived">
                                <div className="text-center py-12 text-slate-500">
                                    No archived policies found.
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}
