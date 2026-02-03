"use client"

import { useState, useEffect } from "react"
import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { PoliciesSidebar } from "@/components/settings/PoliciesSidebar"
import { Button } from "@/components/ui/button"
import { Plus, ChevronDown } from "lucide-react"
import { AddTimeOffPolicyDialog } from "@/components/settings/policies/AddTimeOffPolicyDialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function TimeOffPoliciesPage() {
    const [activeTab, setActiveTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE")
    const [activePolicies, setActivePolicies] = useState<any[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("timeOffPolicies")
        if (saved) {
            try {
                setActivePolicies(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse policies", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to localStorage when policies change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("timeOffPolicies", JSON.stringify(activePolicies))
        }
    }, [activePolicies, isLoaded])

    const handleSavePolicy = (policy: any) => {
        const newPolicy = { ...policy, id: Date.now(), status: "ACTIVE" }
        setActivePolicies([...activePolicies, newPolicy])
    }

    const handleArchivePolicy = (policyId: number) => {
        setActivePolicies(activePolicies.map(p =>
            p.id === policyId ? { ...p, status: "ARCHIVED" } : p
        ))
    }

    const handleRestorePolicy = (policyId: number) => {
        setActivePolicies(activePolicies.map(p =>
            p.id === policyId ? { ...p, status: "ACTIVE" } : p
        ))
    }

    const filteredPolicies = activePolicies.filter(p => p.status === activeTab)

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
                    {filteredPolicies.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-bold text-slate-500 uppercase">TIME OFF POLICIES</h2>
                                        <div className="rounded-full border border-slate-300 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                            i
                                        </div>
                                    </div>
                                    <p className="text-slate-500">
                                        Set up automatic accrual policies for time off
                                    </p>
                                </div>
                                {activeTab === "ACTIVE" && (
                                    <Button
                                        onClick={() => setIsDialogOpen(true)}
                                        className="bg-slate-900 hover:bg-slate-800 text-white"
                                    >
                                        Add policy
                                    </Button>
                                )}
                            </div>

                            <div className="w-full">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="text-left py-4 font-semibold text-slate-900">Policy name</th>
                                            <th className="text-left py-4 font-semibold text-slate-900">Members</th>
                                            <th className="text-left py-4 font-semibold text-slate-900">Accrual schedule</th>
                                            <th className="text-right py-4 font-semibold text-slate-900"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPolicies.map((policy) => (
                                            <tr key={policy.id} className="border-b border-slate-50">
                                                <td className="py-4 text-slate-900">{policy.name}</td>
                                                <td className="py-4 text-slate-900">{policy.members}</td>
                                                <td className="py-4 text-slate-900">{policy.accrualSchedule}</td>
                                                <td className="py-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="h-9">
                                                                Actions <ChevronDown className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[160px]">
                                                            {activeTab === "ACTIVE" ? (
                                                                <>
                                                                    <DropdownMenuItem className="cursor-pointer">
                                                                        Edit time off
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="cursor-pointer">
                                                                        Edit members
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer"
                                                                        onClick={() => handleArchivePolicy(policy.id)}
                                                                    >
                                                                        Archive
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                                                                        Remove
                                                                    </DropdownMenuItem>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <DropdownMenuItem className="cursor-pointer">
                                                                        View
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer"
                                                                        onClick={() => handleRestorePolicy(policy.id)}
                                                                    >
                                                                        Restore
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        activeTab === "ACTIVE" ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
                                <div className="w-64 h-64 mb-6 bg-slate-50 rounded-full flex items-center justify-center">
                                    {/* Placeholder for illustration */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-20 bg-slate-200 rounded-sm flex items-center justify-center mb-2">
                                            <div className="w-10 h-1 bg-slate-400 rounded-full opacity-50 space-y-2">
                                                <div className="h-1 bg-slate-400 w-full" />
                                                <div className="h-1 bg-slate-400 w-3/4" />
                                                <div className="h-1 bg-slate-400 w-1/2" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                                    No active time off policies
                                </h2>
                                <p className="text-slate-500 mb-8">
                                    Set up automatic accrual policies for time off
                                </p>
                                <Button
                                    onClick={() => setIsDialogOpen(true)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add policy
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No archived policies found.
                            </div>
                        )
                    )}
                </div>
            </div>
            <AddTimeOffPolicyDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSavePolicy}
            />
        </div>
    )
}
