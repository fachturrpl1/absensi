"use client"

import { useState } from "react"
import { Info, Search } from "lucide-react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { ActivityTrackingHeader } from "@/components/settings/ActivityTrackingHeader"
import { TrackingSidebar } from "@/components/settings/TrackingSidebar"

type KeepIdleTimeOption = "prompt" | "always" | "never"

export default function TrackingPage() {
    const [globalKeepIdleTime, setGlobalKeepIdleTime] = useState<KeepIdleTimeOption>("prompt")
    const [searchQuery, setSearchQuery] = useState("")
    const [memberKeepIdleTimes, setMemberKeepIdleTimes] = useState<Record<string, KeepIdleTimeOption>>({})

    const filteredMembers = DUMMY_MEMBERS.filter(member => {
        const fullName = member.name.toLowerCase()
        return fullName.includes(searchQuery.toLowerCase())
    })

    const handleGlobalKeepIdleTimeChange = (value: KeepIdleTimeOption) => {
        setGlobalKeepIdleTime(value)
    }

    const handleMemberKeepIdleTimeChange = (memberId: string, value: KeepIdleTimeOption) => {
        setMemberKeepIdleTimes(prev => ({
            ...prev,
            [memberId]: value
        }))
    }

    const getMemberKeepIdleTime = (memberId: string): KeepIdleTimeOption => {
        return memberKeepIdleTimes[memberId] || globalKeepIdleTime
    }

    return (
        <div className="flex flex-col min-h-screen bg-white w-full">
            <ActivityTrackingHeader activeTab="tracking" />

            {/* Main Content */}
            <div className="flex flex-1 w-full">
                {/* Left Sidebar */}
                {/* Left Sidebar */}
                <TrackingSidebar activeItem="keep-idle-time" />

                {/* Right Content */}
                <div className="flex-1 p-6">
                    {/* Section Title */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            KEEP IDLE TIME
                        </span>
                        <Info className="h-4 w-4 text-slate-400" />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-6">
                        Control whether idle time is kept or discarded when the timer is running
                    </p>

                    {/* Global Setting */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            GLOBAL:
                        </span>
                        <Info className="h-4 w-4 text-slate-400" />
                    </div>

                    {/* Global Toggle - Pill Style */}
                    <div className="inline-flex rounded-full bg-slate-100 p-0.5 mb-8">
                        <button
                            onClick={() => handleGlobalKeepIdleTimeChange("prompt")}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalKeepIdleTime === "prompt"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Prompt
                        </button>
                        <button
                            onClick={() => handleGlobalKeepIdleTimeChange("always")}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalKeepIdleTime === "always"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Always
                        </button>
                        <button
                            onClick={() => handleGlobalKeepIdleTimeChange("never")}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${globalKeepIdleTime === "never"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Never
                        </button>
                    </div>

                    {/* Individual Settings Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Individual settings</h3>
                            <p className="text-sm text-slate-500">Override the organization default for specific members</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="border-t border-slate-200">
                        <div className="py-3 border-b border-slate-200">
                            <span className="text-sm font-semibold text-slate-900">Name</span>
                        </div>
                        {filteredMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between py-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                        <span className="text-sm font-medium text-slate-600">
                                            {member.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm text-slate-900">{member.name}</span>
                                </div>
                                <div className="inline-flex rounded-full bg-slate-100 p-0.5">
                                    <button
                                        onClick={() => handleMemberKeepIdleTimeChange(member.id, "prompt")}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${getMemberKeepIdleTime(member.id) === "prompt"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        Prompt
                                    </button>
                                    <button
                                        onClick={() => handleMemberKeepIdleTimeChange(member.id, "always")}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${getMemberKeepIdleTime(member.id) === "always"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        Always
                                    </button>
                                    <button
                                        onClick={() => handleMemberKeepIdleTimeChange(member.id, "never")}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${getMemberKeepIdleTime(member.id) === "never"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        Never
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="py-3 text-sm text-slate-500">
                        Showing {filteredMembers.length} of {DUMMY_MEMBERS.length} members
                    </div>
                </div>
            </div>
        </div>
    )
}
