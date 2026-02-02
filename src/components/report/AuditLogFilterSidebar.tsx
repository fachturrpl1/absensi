"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { SearchableSelect } from "@/components/ui/searchable-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"

interface AuditLogFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply?: (filters: any) => void
    className?: string
}

const ACTION_TYPES = [
    "Added", "Approved", "Archived", "Created", "Deleted", "Denied", "Duplicated",
    "Enabled", "Merge Failed", "Merged", "Modified", "Opened", "Removed", "Restored",
    "Send Email", "Submitted", "Transfered", "Unsubmit", "Updated", "Accepted Invite"
].sort()

export function AuditLogFilterSidebar({ open, onOpenChange, onApply, className }: AuditLogFilterSidebarProps) {
    const [member, setMember] = useState("all")
    const [team, setTeam] = useState("all")
    const [action, setAction] = useState("all")

    const handleApply = () => {
        onApply?.({
            member,
            team,
            action
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
                        <SearchableSelect
                            value={member}
                            onValueChange={setMember}
                            options={[
                                { value: "all", label: "All members" },
                                ...DUMMY_MEMBERS.map(m => ({ value: m.id, label: m.name }))
                            ]}
                            placeholder="All members"
                            searchPlaceholder="Search members..."
                        />
                    </div>

                    {/* Teams */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Teams</Label>
                        <SearchableSelect
                            value={team}
                            onValueChange={setTeam}
                            options={[
                                { value: "all", label: "All teams" },
                                ...DUMMY_TEAMS.map(t => ({ value: t.id, label: t.name }))
                            ]}
                            placeholder="All teams"
                            searchPlaceholder="Search teams..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-500 uppercase">Action</Label>
                        <SearchableSelect
                            value={action}
                            onValueChange={setAction}
                            options={[
                                { value: "all", label: "All actions" },
                                ...ACTION_TYPES.map(a => ({ value: a, label: a }))
                            ]}
                            placeholder="All actions"
                            searchPlaceholder="Search actions..."
                        />
                    </div>

                    {/* Settings - Optional/Generic */}
                    <div className="space-y-3 pt-2">
                        <Label className="text-sm font-semibold text-gray-900">Settings</Label>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="removed" />
                            <label
                                htmlFor="removed"
                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 uppercase"
                            >
                                Include removed members
                            </label>
                        </div>
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
                            setMember("all")
                            setTeam("all")
                            setAction("all")
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
