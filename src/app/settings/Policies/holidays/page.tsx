"use client"

import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { PoliciesSidebar } from "@/components/settings/PoliciesSidebar"
import { Button } from "@/components/ui/button"
import { Plus, Gift, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { AddHolidayDialog } from "@/components/settings/policies/AddHolidayDialog"
import { format } from "date-fns"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function HolidaysPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<"add" | "edit-holiday" | "edit-members">("add")
    const [editingHoliday, setEditingHoliday] = useState<any>(null)
    const [holidays, setHolidays] = useState<any[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("org_holidays")
        if (saved) {
            try {
                setHolidays(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse holidays", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to localStorage when holidays change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("org_holidays", JSON.stringify(holidays))
        }
    }, [holidays, isLoaded])

    const handleAddHoliday = () => {
        setDialogMode("add")
        setEditingHoliday(null)
        setIsDialogOpen(true)
    }

    const handleEditHoliday = (holiday: any) => {
        setDialogMode("edit-holiday")
        setEditingHoliday(holiday)
        setIsDialogOpen(true)
    }

    const handleEditMembers = (holiday: any) => {
        setDialogMode("edit-members")
        setEditingHoliday(holiday)
        setIsDialogOpen(true)
    }

    const handleSaveHoliday = (holidayData: any) => {
        if (holidayData.id) {
            // Update existing
            setHolidays(prev => prev.map(h => h.id === holidayData.id ? {
                ...holidayData,
                date: holidayData.date instanceof Date ? holidayData.date.toISOString() : holidayData.date
            } : h))
        } else {
            // Add new
            const newHoliday = {
                ...holidayData,
                id: Date.now(),
                date: holidayData.date instanceof Date ? holidayData.date.toISOString() : holidayData.date
            }
            setHolidays(prev => [...prev, newHoliday])
        }
    }

    const handleDeleteHoliday = (id: number) => {
        setHolidays(prev => prev.filter(h => h.id !== id))
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <PoliciesHeader activeTab="time-off" />
            <div className="flex flex-1">
                <PoliciesSidebar activeItem="holidays" />
                <div className="flex-1 p-8">
                    {/* Header with Title and Add Button */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    HOLIDAYS
                                </h2>
                                <Info className="w-4 h-4 text-slate-400" />
                            </div>
                            <p className="text-xl font-medium text-slate-900">
                                Set up holidays for time off
                            </p>
                        </div>
                        {holidays.length > 0 && (
                            <Button
                                onClick={handleAddHoliday}
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-md px-6 shadow-sm"
                            >
                                Add holiday
                            </Button>
                        )}
                    </div>

                    {holidays.length > 0 ? (
                        <div className="mt-8">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="px-0 py-4 text-[13px] font-medium text-slate-500 w-1/3 uppercase tracking-wider">Holiday</th>
                                        <th className="px-6 py-4 text-[13px] font-medium text-slate-500 text-center uppercase tracking-wider">Members</th>
                                        <th className="px-6 py-4 text-[13px] font-medium text-slate-500 uppercase tracking-wider">Recurring</th>
                                        <th className="px-6 py-4 text-[13px] font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-0 py-4 w-24"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {holidays.map((holiday) => (
                                        <tr key={holiday.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-0 py-5">
                                                <span className="text-[14px] text-slate-900">
                                                    {holiday.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-[14px] text-slate-600">
                                                    {holiday.selectedMembers?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[14px] text-slate-600">
                                                    {holiday.occursAnnually ? "Yes" : "No"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[14px] text-slate-600">
                                                    {holiday.date ? format(new Date(holiday.date), "EEE, MMM d, yyyy") : "-"}
                                                </span>
                                            </td>
                                            <td className="px-0 py-5 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-9 px-3 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 gap-2 font-medium shadow-none">
                                                            Actions
                                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem
                                                            onClick={() => handleEditHoliday(holiday)}
                                                            className="cursor-pointer"
                                                        >
                                                            Edit holiday
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleEditMembers(holiday)}
                                                            className="cursor-pointer border-b border-slate-100 pb-2 mb-1"
                                                        >
                                                            Edit members
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteHoliday(holiday.id)}
                                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/30 rounded-lg border border-dashed border-slate-200">
                            <Gift className="w-16 h-16 text-slate-200 mb-4" />
                            <h2 className="text-lg font-semibold text-slate-900 mb-1">
                                No holidays added
                            </h2>
                            <p className="text-slate-500 mb-6 max-w-xs">
                                Add holidays to automatically assign time off to your members.
                            </p>
                            <Button
                                onClick={handleAddHoliday}
                                variant="outline"
                                className="border-slate-300"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add holiday
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <AddHolidayDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSaveHoliday}
                mode={dialogMode}
                initialData={editingHoliday}
            />
        </div>
    )
}
