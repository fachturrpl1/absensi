"use client"

import React, { useState } from "react"
import { Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { MembersHeader } from "@/components/settings/MembersHeader"

type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"

interface WorkHourEntry {
    id: string
    hours: number
    unit: string
}

export default function WorkTimeLimitPage() {
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(["Mon", "Tue", "Wed", "Thu", "Fri"])
    const [disableTracking, setDisableTracking] = useState(false)
    const [expectedHours, setExpectedHours] = useState<WorkHourEntry[]>([
        { id: "1", hours: 40, unit: "hrs/wk" }
    ])
    const [weeklyLimit, setWeeklyLimit] = useState(40)
    const [dailyLimit, setDailyLimit] = useState(8)

    const days: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    const toggleDay = (day: DayOfWeek) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        )
    }


    const removeExpectedHours = (id: string) => {
        setExpectedHours(prev => prev.filter(entry => entry.id !== id))
    }

    const updateExpectedHours = (id: string, hours: number) => {
        setExpectedHours(prev =>
            prev.map(entry =>
                entry.id === id ? { ...entry, hours } : entry
            )
        )
    }

    const getExpectedDaysLabel = () => {
        if (selectedDays.length === 0) return "None"
        if (selectedDays.length === 7) return "Every day"
        if (selectedDays.length === 5 &&
            selectedDays.includes("Mon") &&
            selectedDays.includes("Tue") &&
            selectedDays.includes("Wed") &&
            selectedDays.includes("Thu") &&
            selectedDays.includes("Fri") &&
            !selectedDays.includes("Sat") &&
            !selectedDays.includes("Sun")) {
            return "Mon - Fri"
        }
        return selectedDays.join(", ")
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <MembersHeader activeTab="work-time-limits" />

            {/* Content */}
            <div className="flex-1 p-6">
                {/* Default Settings Header */}
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900">Default settings</h2>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6">
                        Save
                    </Button>
                    <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                        Cancel
                    </button>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-12">
                    {/* Left Column - Weekly Work Days */}
                    <div>
                        <div className="mb-6">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                WEEKLY WORK DAYS
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Set the week days members are expected to work. You can also set which days members are not allowed to track time.
                        </p>

                        <p className="text-sm text-gray-900 mb-4">
                            Expected work days: <span className="font-medium">{getExpectedDaysLabel()}</span>
                        </p>

                        {/* Day Selection */}
                        <div className="flex gap-2 mb-6">
                            {days.map((day) => (
                                <button
                                    key={day}
                                    onClick={() => toggleDay(day)}
                                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${selectedDays.includes(day)
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>

                        {/* Disable Time Tracking */}
                        <div className="flex items-center gap-3">
                            <Switch
                                checked={disableTracking}
                                onCheckedChange={setDisableTracking}
                            />
                            <span className="text-sm text-gray-700">
                                Disable time tracking on specific days
                            </span>
                        </div>
                    </div>

                    {/* Right Column - Work Hours */}
                    <div className="space-y-8">
                        {/* Expected Weekly Work Hours */}
                        <div>
                            <div className="flex items-center gap-1 mb-2">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    EXPECTED WEEKLY WORK HOURS
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                                Set the hours members are expected to work weekly
                            </p>

                            {expectedHours.map((entry) => (
                                <div key={entry.id} className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                        <Input
                                            type="number"
                                            value={entry.hours}
                                            onChange={(e) => updateExpectedHours(entry.id, Number(e.target.value))}
                                            className="w-32 border-0 text-sm"
                                        />
                                        <span className="px-4 py-2 bg-gray-100 text-sm text-gray-600 border-l border-gray-300">
                                            hrs/wk
                                        </span>
                                    </div>
                                    {expectedHours.length > 1 && (
                                        <button
                                            onClick={() => removeExpectedHours(entry.id)}
                                            className="text-blue-500 hover:text-blue-600 text-sm"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Weekly Limit */}
                        <div>
                            <div className="flex items-center gap-1 mb-2">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    WEEKLY LIMIT
                                </span>
                                <Info className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                                Set the hours members are allowed to work weekly
                            </p>
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                                <Input
                                    type="number"
                                    value={weeklyLimit}
                                    onChange={(e) => setWeeklyLimit(Number(e.target.value))}
                                    className="w-32 border-0 text-sm"
                                />
                                <span className="px-4 py-2 bg-gray-100 text-sm text-gray-600 border-l border-gray-300">
                                    hrs/wk
                                </span>
                            </div>
                        </div>

                        {/* Daily Limit */}
                        <div>
                            <div className="flex items-center gap-1 mb-2">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    DAILY LIMIT
                                </span>
                                <Info className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                                Set the hours members are allowed to work daily
                            </p>
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                                <Input
                                    type="number"
                                    value={dailyLimit}
                                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                                    className="w-32 border-0 text-sm"
                                />
                                <span className="px-4 py-2 bg-gray-100 text-sm text-gray-600 border-l border-gray-300">
                                    hrs/day
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
