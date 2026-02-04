"use client"

import { X } from "lucide-react"
import { ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface FilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    children: ReactNode
    onApply: () => void
    onClear: () => void
    className?: string
}

export function FilterSidebar({
    open,
    onOpenChange,
    title = "Filters",
    children,
    onApply,
    onClear,
    className
}: FilterSidebarProps) {
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
                    <h2 className="font-semibold text-gray-800">{title}</h2>
                    <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {children}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
                    <Button
                        onClick={onApply}
                        className="w-full bg-gray-900 text-white hover:bg-gray-800"
                    >
                        Apply filters
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClear}
                        className="w-full text-gray-500 hover:text-gray-700 hover:bg-transparent"
                    >
                        Clear filters
                    </Button>
                </div>
            </div>
        </>
    )
}
