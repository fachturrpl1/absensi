"use client"

import { useState, useEffect } from "react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

import { Info, Search } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AddOvertimePolicyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (policy: any) => void
    initialData?: any
}

export function AddOvertimePolicyDialog({ open, onOpenChange, onSave, initialData: _initialData }: AddOvertimePolicyDialogProps) {
    const [policyName, setPolicyName] = useState("")
    const [weeklyThreshold, setWeeklyThreshold] = useState("40")
    const [payRateMultiplier, setPayRateMultiplier] = useState("1.5")
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [isMemberSelectionOpen, setIsMemberSelectionOpen] = useState(false)

    useEffect(() => {
        console.log('Dialog open state changed:', open)
    }, [open])

    const handleSave = () => {
        if (!policyName.trim()) return

        onSave({
            name: policyName,
            weeklyThreshold,
            payRateMultiplier,
            members: selectedMembers,
            status: "ACTIVE"
        })

        // Reset form
        setPolicyName("")
        setWeeklyThreshold("40")
        setPayRateMultiplier("1.5")
        setSelectedMembers([])
        onOpenChange(false)
    }

    const handleSelectAll = () => {
        // Filter all members to match current organizational filter
        const allMemberIds = DUMMY_MEMBERS.map(m => m.id)
        setSelectedMembers(allMemberIds)
    }

    const handleMemberSelectionSave = (members: string[]) => {
        setSelectedMembers(members)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-normal text-slate-900">
                            Create weekly overtime policy
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-8 py-6">
                        {/* Policy Name */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                                POLICY NAME*
                            </Label>
                            <Input
                                value={policyName}
                                onChange={(e) => setPolicyName(e.target.value)}
                                placeholder="Policy name"
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Weekly Overtime Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-slate-900">Weekly overtime</h3>

                            {/* Weekly Overtime Threshold */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                                        WEEKLY OVERTIME THRESHOLD
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-help">
                                                    <Info className="w-4 h-4 text-slate-400" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-900 text-white border-slate-800">
                                                <p className="max-w-xs text-sm">
                                                    The number of hours per week after which overtime pay begins
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        value={weeklyThreshold}
                                        onChange={(e) => setWeeklyThreshold(e.target.value)}
                                        className="w-32 bg-white border-slate-200 text-slate-900"
                                    />
                                    <span className="text-sm text-slate-600">hours</span>
                                </div>
                            </div>

                            {/* Weekly Overtime Pay Rate Multiplier */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                                    WEEKLY OVERTIME PAY RATE MULTIPLIER
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={payRateMultiplier}
                                        onChange={(e) => setPayRateMultiplier(e.target.value)}
                                        className="w-32 bg-white border-slate-200 text-slate-900"
                                    />
                                    <span className="text-sm text-slate-600">x member's pay rate</span>
                                </div>
                            </div>
                        </div>

                        {/* Notifications Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-medium text-slate-900">Notifications</h3>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-help">
                                                <Info className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-900 text-white border-slate-800">
                                            <p className="max-w-xs text-sm">
                                                Automatic notifications for overtime tracking
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            {/* Notification Items */}
                            <div className="space-y-4 pl-0">
                                <div>
                                    <div className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-1">
                                        1 HOUR BEFORE OVERTIME THRESHOLD
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        Members, managers, and owners will receive an email notification
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm font-medium text-slate-600 uppercase tracking-wide mb-1">
                                        WHEN MEMBER BEGINS OVERTIME
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        Members, managers, and owners will receive an email notification
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Policy Members Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-slate-900">Policy members</h3>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                                        MEMBERS
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-sm font-medium text-slate-900 hover:text-slate-700 underline"
                                    >
                                        Select all
                                    </button>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Members can only be on 1 overtime policy at a time
                                </p>
                                <div
                                    onClick={() => setIsMemberSelectionOpen(true)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm text-slate-400 cursor-pointer hover:border-slate-300 transition-colors"
                                >
                                    {selectedMembers.length > 0
                                        ? `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} selected`
                                        : "Select members"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="px-6 bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!policyName.trim()}
                            className="px-6 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <MemberSelectionModal
                open={isMemberSelectionOpen}
                onOpenChange={setIsMemberSelectionOpen}
                selectedMembers={selectedMembers}
                onSave={handleMemberSelectionSave}
            />
        </>
    )
}

// Local MemberSelectionModal component
function MemberSelectionModal({ open, onOpenChange, selectedMembers, onSave }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedMembers: string[];
    onSave: (members: string[]) => void;
}) {
    const [localSelected, setLocalSelected] = useState<string[]>(selectedMembers)
    const [searchQuery, setSearchQuery] = useState("")

    const [members, setMembers] = useState<{ id: string; name: string }[]>([])
    const [totalMembers, setTotalMembers] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    // Effect to sync when opening
    useEffect(() => {
        if (open) {
            setLocalSelected(selectedMembers)
            setSearchQuery("") // Reset search when modal opens
            setCurrentPage(1) // Reset to first page
        }
    }, [open, selectedMembers])

    // Get filtered and paginated dummy members (client-side)
    useEffect(() => {
        setIsLoading(true)

        // Filter dummy members based on search query
        const filtered = DUMMY_MEMBERS.filter(member =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase())
        )

        // Calculate pagination
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginated = filtered.slice(startIndex, endIndex)

        // Map to expected format
        const mapped = paginated.map(m => ({
            id: m.id,
            name: m.name
        }))

        setMembers(mapped)
        setTotalMembers(filtered.length)
        setIsLoading(false)
    }, [searchQuery, currentPage, open])

    // Total pages calculation
    const totalPages = Math.ceil(totalMembers / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

    const handleToggle = (id: string) => {
        if (localSelected.includes(id)) {
            setLocalSelected(localSelected.filter(i => i !== id))
        } else {
            setLocalSelected([...localSelected, id])
        }
    }

    const handleSelectAll = async () => {
        if (totalMembers > 0 && localSelected.length >= totalMembers) {
            setLocalSelected([])
        } else {
            // Select all filtered members from DUMMY_MEMBERS
            const filtered = DUMMY_MEMBERS.filter(member =>
                member.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            const allIds = filtered.map(m => m.id)

            if (searchQuery) {
                // Union with existing selection
                const newSet = new Set([...localSelected, ...allIds])
                setLocalSelected(Array.from(newSet))
            } else {
                // Replace with all IDs
                setLocalSelected(allIds)
            }
        }
    }

    const handleClearAll = () => {
        setLocalSelected([])
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden flex flex-col h-[85vh]">
                <DialogHeader className="p-4 pb-2 flex-shrink-0 border-b border-transparent">
                    <DialogTitle className="text-xl font-semibold">Members</DialogTitle>
                </DialogHeader>

                <div className="px-4 pb-0">
                    <div className="flex border-b border-slate-900 w-max">
                        <button className="px-1 py-2 text-sm font-medium text-slate-900">
                            MEMBERS
                        </button>
                    </div>
                </div>

                <div className="px-4 pt-3 pb-3 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1) // Reset to first page on search
                            }}
                            placeholder="Search members..."
                            className="pl-9 bg-white border-slate-200 text-slate-900"
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 pb-2 flex items-center justify-between flex-shrink-0">
                        <button
                            onClick={handleSelectAll}
                            className="text-sm font-medium text-slate-900 hover:text-slate-700 underline"
                        >
                            Select all
                        </button>
                        {localSelected.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-sm font-medium text-slate-900 hover:text-slate-700 underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="space-y-0 px-4">
                            {!isLoading && members.length > 0 ? (
                                members.map((member) => (
                                    <div key={member.id} className="flex items-center space-x-3 py-2 border-b border-slate-100 last:border-0">
                                        <Checkbox
                                            id={`member-${member.id}`}
                                            checked={localSelected.includes(member.id)}
                                            onCheckedChange={() => handleToggle(member.id)}
                                            className="border-slate-300"
                                        />
                                        <Label
                                            htmlFor={`member-${member.id}`}
                                            className="text-sm text-slate-900 cursor-pointer flex-1"
                                        >
                                            {member.name}
                                        </Label>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-slate-500">
                                    No members found
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="p-2 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                    className="h-8 px-2 text-xs"
                                >
                                    Previous
                                </Button>
                                <span className="text-xs text-slate-500">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || isLoading}
                                    className="h-8 px-2 text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-500 px-4 py-2 flex-shrink-0">
                        Showing {startIndex + 1}-{Math.min(startIndex + members.length, totalMembers)} of {totalMembers} members
                    </div>
                </div>

                <DialogFooter className="p-4 border-t border-slate-100">
                    <Button
                        onClick={() => {
                            onSave(localSelected)
                            onOpenChange(false)
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white w-24"
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
