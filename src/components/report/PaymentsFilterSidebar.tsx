"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { SearchableSelect } from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"
import { DUMMY_PROJECTS } from "@/lib/data/dummy-data"

interface PaymentsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply?: (filters: any) => void
    className?: string
}

const PAYMENT_METHODS = [
    "PayPal", "Wise", "Bank Transfer", "Manual"
]

const STATUS_TYPES = [
    "Completed", "Pending", "Failed"
]

export function PaymentsFilterSidebar({ open, onOpenChange, onApply, className }: PaymentsFilterSidebarProps) {
    const [method, setMethod] = useState("all")
    const [status, setStatus] = useState("all")
    const [project, setProject] = useState("all")

    const handleApply = () => {
        onApply?.({
            method,
            status,
            project
        })
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={() => onOpenChange(false)}
            />

            {/* Sidebar */}
            <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 flex flex-col border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"} ${className}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-800">Filters</h2>
                    <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Methods */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Payment Method</Label>
                        <SearchableSelect
                            value={method}
                            onValueChange={setMethod}
                            options={[
                                { value: "all", label: "All methods" },
                                ...PAYMENT_METHODS.map(m => ({ value: m, label: m }))
                            ]}
                            placeholder="All methods"
                            searchPlaceholder="Search method..."
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Status</Label>
                        <SearchableSelect
                            value={status}
                            onValueChange={setStatus}
                            options={[
                                { value: "all", label: "All statuses" },
                                ...STATUS_TYPES.map(s => ({ value: s, label: s }))
                            ]}
                            placeholder="All statuses"
                            searchPlaceholder="Search status..."
                        />
                    </div>

                    {/* Projects */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Project</Label>
                        <SearchableSelect
                            value={project}
                            onValueChange={setProject}
                            options={[
                                { value: "all", label: "All projects" },
                                ...DUMMY_PROJECTS.map(p => ({ value: p.id, label: p.name }))
                            ]}
                            placeholder="All projects"
                            searchPlaceholder="Search project..."
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
                    <button
                        onClick={handleApply}
                        className="w-full py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 font-medium text-sm"
                    >
                        Apply filters
                    </button>
                    <button
                        onClick={() => {
                            setMethod("all")
                            setStatus("all")
                            setProject("all")
                        }}
                        className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
                    >
                        Clear filters
                    </button>
                </div>

            </div>
        </>
    )
}
