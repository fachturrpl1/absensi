"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_PROJECTS, DUMMY_CLIENTS } from "@/lib/data/dummy-data"

interface TimeActivityFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply?: (filters: any) => void
    className?: string
}

export function TimeActivityFilterSidebar({ open, onOpenChange, onApply, className }: TimeActivityFilterSidebarProps) { // Added onApply to props
    const [member, setMember] = useState("all") // Added state for member
    const [project, setProject] = useState("all") // Added state for project
    const [team, setTeam] = useState("all") // Added state for team
    const [client, setClient] = useState("all") // Added state for client
    const [task, setTask] = useState("all") // Added state for task

    const handleApply = () => { // Added handleApply function
        onApply?.({
            member,
            project,
            team,
            client,
            task
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
                    {/* Members */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Members</Label>
                        <Select value={member} onValueChange={setMember}> {/* Wired to state */}
                            <SelectTrigger className="w-full text-sm">
                                <SelectValue placeholder="All members" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All members</SelectItem>
                                {DUMMY_MEMBERS.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Projects */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Projects</Label>
                        <Select value={project} onValueChange={setProject}> {/* Wired to state */}
                            <SelectTrigger className="w-full text-sm">
                                <SelectValue placeholder="All projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All projects</SelectItem>
                                {DUMMY_PROJECTS.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Teams */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Teams</Label>
                        <Select value={team} onValueChange={setTeam}> {/* Wired to state */}
                            <SelectTrigger className="w-full text-sm">
                                <SelectValue placeholder="All teams" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All teams</SelectItem>
                                {DUMMY_TEAMS.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Clients */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Clients</Label>
                        <Select value={client} onValueChange={setClient}> {/* Wired to state */}
                            <SelectTrigger className="w-full text-sm">
                                <SelectValue placeholder="All clients" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All clients</SelectItem>
                                {DUMMY_CLIENTS.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tasks (Renamed from To-dos) */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Tasks</Label> {/* Renamed label */}
                        <Select value={task} onValueChange={setTask}> {/* Wired to state */}
                            <SelectTrigger className="w-full text-sm">
                                <SelectValue placeholder="All tasks" /> {/* Renamed placeholder */}
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All tasks</SelectItem> {/* Renamed item */}
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tracked Time */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Tracked Time</Label>
                        <Select defaultValue="tracked">
                            <SelectTrigger className="w-full text-sm">
                                <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tracked">Members with tracked time</SelectItem>
                                <SelectItem value="all">All members</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Filters */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Custom Filters</Label>
                        <button className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
                            <Plus className="w-4 h-4" /> Add custom filters
                        </button>
                    </div>

                    {/* Settings */}
                    <div className="space-y-3 pt-2">
                        <Label className="text-sm font-semibold text-gray-900">Settings</Label>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="archived" defaultChecked />
                            <label
                                htmlFor="archived"
                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 uppercase"
                            >
                                Include archived projects
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="removed" />
                            <label
                                htmlFor="removed"
                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 uppercase"
                            >
                                Include removed members
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="workbreaks" />
                            <label
                                htmlFor="workbreaks"
                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 uppercase"
                            >
                                Exclude workbreaks
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
                    <button
                        onClick={handleApply} // Called onApply
                        className="w-full py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 font-medium text-sm"
                    >
                        Apply filters
                    </button>
                    <button
                        onClick={() => {
                            setMember("all") // Reset state
                            setProject("all") // Reset state
                            setTeam("all") // Reset state
                            setClient("all") // Reset state
                            setTask("all") // Reset state
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
