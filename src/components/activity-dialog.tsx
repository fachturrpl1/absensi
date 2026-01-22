"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play } from "lucide-react"

interface ActivityDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ActivityDialog({ open, onOpenChange }: ActivityDialogProps) {
    const [activeTab, setActiveTab] = useState("basics")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
                <div className="flex h-full">
                    {/* Sidebar */}
                    <div className="w-48 border-r bg-slate-50 p-6 space-y-2">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-xl">Activity in Hubstaff</DialogTitle>
                        </DialogHeader>
                        <button
                            onClick={() => setActiveTab("basics")}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${activeTab === "basics"
                                    ? "bg-blue-500 text-white font-medium"
                                    : "text-slate-700 hover:bg-slate-200"
                                }`}
                        >
                            The basics
                        </button>
                        <button
                            onClick={() => setActiveTab("timers")}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${activeTab === "timers"
                                    ? "bg-blue-500 text-white font-medium"
                                    : "text-slate-700 hover:bg-slate-200"
                                }`}
                        >
                            Timers
                        </button>
                        <button
                            onClick={() => setActiveTab("how-it-works")}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${activeTab === "how-it-works"
                                    ? "bg-blue-500 text-white font-medium"
                                    : "text-slate-700 hover:bg-slate-200"
                                }`}
                        >
                            How it works
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        {activeTab === "basics" && (
                            <div className="space-y-6">
                                <p className="text-slate-700 text-base">
                                    Activity measures how active users are on their mouse and keyboard.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <Badge className="bg-green-500 hover:bg-green-500 text-white px-4 py-2 text-sm font-semibold rounded-full">
                                            51-100%
                                        </Badge>
                                        <p className="text-slate-700 text-sm flex-1 pt-2">
                                            You're in the zone. Way to go!
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <Badge className="bg-orange-400 hover:bg-orange-400 text-white px-4 py-2 text-sm font-semibold rounded-full">
                                            21-50%
                                        </Badge>
                                        <p className="text-slate-700 text-sm flex-1 pt-2">
                                            Depending on the work, this is a good range to be in.
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <Badge className="bg-red-500 hover:bg-red-500 text-white px-4 py-2 text-sm font-semibold rounded-full">
                                            0-20%
                                        </Badge>
                                        <p className="text-slate-700 text-sm flex-1 pt-2">
                                            You're not very active on the computer.
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <Badge className="bg-slate-500 hover:bg-slate-500 text-white px-4 py-2 text-sm font-semibold rounded-full">
                                            idle
                                        </Badge>
                                        <div className="text-slate-700 text-sm flex-1 pt-2">
                                            <p>You weren't touching the mouse or keyboard at all.</p>
                                            <a href="#" className="text-blue-500 hover:underline">
                                                Idle settings
                                            </a>
                                            {" "}can be customized for each team member.
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        Welcome to activity video
                                    </h3>
                                    <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-video max-w-md">
                                        <img
                                            src="/placeholder-video.png"
                                            alt="Video thumbnail"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none"
                                            }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-200/80">
                                            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                                                <Play className="w-8 h-8 text-white ml-1" fill="white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "timers" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900">Timers</h3>
                                <p className="text-slate-700">
                                    Timer information and controls will be displayed here.
                                </p>
                            </div>
                        )}

                        {activeTab === "how-it-works" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900">How it works</h3>
                                <p className="text-slate-700">
                                    Detailed explanation of how activity tracking works will be displayed here.
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-8 flex justify-end">
                            <Button
                                onClick={() => onOpenChange(false)}
                                variant="outline"
                                className="px-6"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
