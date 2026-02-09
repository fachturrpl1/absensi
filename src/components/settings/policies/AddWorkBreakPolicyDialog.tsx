"use client"

import { useState, useEffect } from "react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Search } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface AddWorkBreakPolicyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (policy: any) => void
    initialData?: any
    readOnly?: boolean
}

export function AddWorkBreakPolicyDialog({ open, onOpenChange, onSave, initialData, readOnly = false }: AddWorkBreakPolicyDialogProps) {
    // Form states
    const [policyName, setPolicyName] = useState("")
    const [autoAdd, setAutoAdd] = useState(true)
    const [type, setType] = useState("paid")
    const [duration, setDuration] = useState("")
    const [restrictions, setRestrictions] = useState("none")
    const [notifyMembers, setNotifyMembers] = useState(true)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [repeatEvery, setRepeatEvery] = useState("")
    const [minWorkBefore, setMinWorkBefore] = useState("")
    const [enableMinWorkBefore, setEnableMinWorkBefore] = useState(false)

    // Custom restriction states
    const [customBreakCount, setCustomBreakCount] = useState("")
    const [customBreaks, setCustomBreaks] = useState<{ start: string, end: string }[]>([])

    // Member selection states
    // Member selection states
    const [isMemberSelectionOpen, setIsMemberSelectionOpen] = useState(false)

    // Fetch members on mount


    // Populate data for Edit Mode
    useEffect(() => {
        if (open) {
            if (initialData) {
                setPolicyName(initialData.name || "")
                setAutoAdd(initialData.autoAdd !== undefined ? initialData.autoAdd : true)
                setType(initialData.type || "paid")
                setDuration(initialData.duration || "0:00")
                setRestrictions(initialData.restrictions || "none")
                setNotifyMembers(initialData.notifyMembers !== undefined ? initialData.notifyMembers : true)
                setSelectedMembers(initialData.members || [])
                setRepeatEvery(initialData.repeatEvery || "")
                setMinWorkBefore(initialData.minWorkBefore || "")
                setEnableMinWorkBefore(!!initialData.minWorkBefore)
                if (initialData.customBreaks && initialData.customBreaks.length > 0) {
                    setCustomBreakCount(initialData.customBreaks.length.toString())
                    setCustomBreaks(initialData.customBreaks)
                } else {
                    setCustomBreakCount("")
                    setCustomBreaks([])
                }
            } else {
                setPolicyName("")
                setAutoAdd(true)
                setType("paid")
                setDuration("")
                setRestrictions("none")
                setNotifyMembers(true)
                setSelectedMembers([])
                setRepeatEvery("")
                setMinWorkBefore("")
                setEnableMinWorkBefore(false)
                setCustomBreakCount("")
                setCustomBreaks([])
            }
        }
    }, [open, initialData])

    // Update customBreaks array when count changes
    useEffect(() => {
        const count = parseInt(customBreakCount) || 0
        if (count > 0) {
            setCustomBreaks(prev => {
                const newBreaks = [...prev]
                if (newBreaks.length < count) {
                    // Add missing
                    for (let i = newBreaks.length; i < count; i++) {
                        newBreaks.push({ start: "", end: "" })
                    }
                } else if (newBreaks.length > count) {
                    // Remove excess
                    newBreaks.splice(count)
                }
                return newBreaks
            })
        } else {
            setCustomBreaks([])
        }
    }, [customBreakCount])

    const handleCustomBreakChange = (index: number, field: 'start' | 'end', value: string) => {
        setCustomBreaks(prev => {
            const newBreaks = [...prev]
            if (newBreaks[index]) {
                newBreaks[index] = {
                    ...newBreaks[index],
                    [field]: value
                } as { start: string, end: string }
            }
            return newBreaks
        })
    }

    const handleSave = () => {
        if (!policyName) return

        onSave({
            name: policyName,
            autoAdd,
            type,
            duration: duration || "0:00",
            restrictions,
            notifyMembers,
            members: selectedMembers,
            status: "ACTIVE",
            repeatEvery: repeatEvery || "4",
            minWorkBefore: enableMinWorkBefore ? (minWorkBefore || "4") : undefined,
            customBreaks: restrictions === "custom" ? customBreaks : undefined
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[540px] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold text-slate-800">
                        {readOnly ? "View break policy" : initialData ? "Edit break policy" : "Add break policy"}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-8 pt-2 space-y-7 flex-1 overflow-y-auto">
                    {/* Policy Name */}
                    <div className="space-y-3">
                        <Label htmlFor="policyName" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            POLICY NAME*
                        </Label>
                        <Input
                            id="policyName"
                            placeholder="Enter a name for the policy (ex: Rest or Lunch)"
                            value={policyName}
                            onChange={(e) => setPolicyName(e.target.value)}
                            className="h-12 border-slate-200 focus:ring-slate-400 rounded-lg text-base"
                            disabled={readOnly}
                        />
                    </div>

                    {/* Members Selection */}
                    <div className="space-y-3">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            MEMBERS
                        </Label>
                        <div
                            className={`relative ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                            onClick={() => !readOnly && setIsMemberSelectionOpen(true)}
                        >
                            <Input
                                placeholder="Select members"
                                className="h-11 cursor-pointer"
                                readOnly
                                value={selectedMembers.length > 0 ? `${selectedMembers.length} members selected` : ""}
                            />
                        </div>
                    </div>

                    {/* Auto add new members */}
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="autoAdd"
                            checked={autoAdd}
                            onCheckedChange={(checked) => setAutoAdd(checked as boolean)}
                            className="w-5 h-5 border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 text-white"
                            disabled={readOnly}
                        />
                        <Label htmlFor="autoAdd" className="text-slate-700 font-medium cursor-pointer">
                            Automatically add new members to this policy
                        </Label>
                    </div>

                    {/* Type and Duration */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                TYPE
                            </Label>
                            <Select value={type} onValueChange={setType} disabled={readOnly}>
                                <SelectTrigger className="h-12 border-slate-200 rounded-lg focus:ring-slate-400 text-base">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="duration" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                ALLOTTED DURATION*
                            </Label>
                            <Input
                                id="duration"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="0:00"
                                className="h-12 border-slate-200 rounded-lg text-base focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-400"
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                    {/* Restrictions */}
                    <div className="space-y-3">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            RESTRICTIONS
                        </Label>
                        <div className="space-y-2">
                            <Select value={restrictions} onValueChange={setRestrictions} disabled={readOnly}>
                                <SelectTrigger className="h-12 border-slate-200 rounded-lg focus:ring-slate-400 text-base">
                                    <SelectValue placeholder="No restrictions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No restrictions</SelectItem>
                                    <SelectItem value="once_per_session">Once per work session</SelectItem>
                                    <SelectItem value="within_hours">Allow within every few hours</SelectItem>
                                    <SelectItem value="after_hours">Allow after every few hours</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {restrictions !== "none" && restrictions !== "custom" && (
                            <div className="space-y-6 pt-2">
                                <p className="text-xs text-slate-400">
                                    This cannot be edited once the policy has been created.
                                </p>

                                {(restrictions === "within_hours" || restrictions === "after_hours") && (
                                    <div className="flex items-center gap-3">
                                        <Label className="text-slate-500 font-normal">Repeats every</Label>
                                        <div className="flex items-center">
                                            <Input
                                                value={repeatEvery}
                                                onChange={e => setRepeatEvery(e.target.value)}
                                                placeholder="4"
                                                className="w-16 h-10 rounded-r-none border-r-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-400"
                                                type="number"
                                                onWheel={(e) => e.currentTarget.blur()}
                                                disabled={readOnly}
                                            />
                                            <div className="h-10 px-3 bg-slate-100 border border-slate-200 border-l-0 rounded-r-md flex items-center text-sm text-slate-500">
                                                hrs
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={enableMinWorkBefore}
                                        onCheckedChange={setEnableMinWorkBefore}
                                        disabled={readOnly}
                                    />
                                    <Label className="text-slate-500 font-normal">
                                        {restrictions === "once_per_session" || restrictions === "after_hours"
                                            ? "After working at least"
                                            : "Must work a minimum of"}
                                    </Label>
                                    <div className="flex items-center">
                                        <Input
                                            value={minWorkBefore}
                                            onChange={e => setMinWorkBefore(e.target.value)}
                                            placeholder="4"
                                            className="w-16 h-10 rounded-r-none border-r-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-400"
                                            disabled={!enableMinWorkBefore || readOnly}
                                            type="number"
                                            onWheel={(e) => e.currentTarget.blur()}
                                        />
                                        <div className="h-10 px-3 bg-slate-100 border border-slate-200 border-l-0 rounded-r-md flex items-center text-sm text-slate-500">
                                            hrs
                                        </div>
                                    </div>
                                    {restrictions === "within_hours" && <span className="text-slate-500 font-normal">first</span>}
                                </div>

                                {restrictions === "once_per_session" && (
                                    <div>
                                        <div className="h-8 bg-blue-200 w-full border border-blue-300 rounded-sm mb-1"></div>
                                        <div className="text-center text-sm text-slate-700">1st break available</div>
                                    </div>
                                )}

                                {(restrictions === "within_hours" || restrictions === "after_hours") && (
                                    <div>
                                        <div className="flex border border-blue-300 rounded-sm overflow-hidden mb-1">
                                            <div className="flex-1 h-8 bg-blue-200 border-r border-blue-300 last:border-r-0"></div>
                                            <div className="flex-1 h-8 bg-blue-200 border-r border-blue-300 last:border-r-0"></div>
                                            <div className="flex-1 h-8 bg-blue-200 last:border-r-0"></div>
                                        </div>
                                        <div className="flex text-sm text-slate-700 text-center">
                                            <div className="flex-1">1st break available</div>
                                            <div className="flex-1">2nd break available</div>
                                            <div className="flex-1">3rd break available</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {restrictions === "custom" && (
                            <div className="space-y-4 pt-2">
                                <div className="space-y-3">
                                    <Label className="text-slate-500 font-normal">Number of breaks</Label>
                                    <Input
                                        value={customBreakCount}
                                        onChange={e => setCustomBreakCount(e.target.value)}
                                        placeholder="0"
                                        className="h-12 border-slate-200 rounded-lg text-base focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-400"
                                        type="number"
                                        min="0"
                                        onWheel={(e) => e.currentTarget.blur()}
                                        disabled={readOnly}
                                    />
                                </div>

                                {customBreaks.map((brk, index) => (
                                    <div key={index} className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Break {index + 1}</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-slate-400">START TIME</Label>
                                                <Input
                                                    value={brk.start}
                                                    onChange={e => {
                                                        let val = e.target.value.replace(/[^0-9:]/g, '')
                                                        if (val.length === 2 && brk.start.length === 1) val += ':'
                                                        if (val.length <= 5) handleCustomBreakChange(index, 'start', val)
                                                    }}
                                                    placeholder="00:00"
                                                    className="h-10 border-slate-200 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-400"
                                                    disabled={readOnly}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-slate-400">END TIME</Label>
                                                <Input
                                                    value={brk.end}
                                                    onChange={e => {
                                                        let val = e.target.value.replace(/[^0-9:]/g, '')
                                                        if (val.length === 2 && brk.end.length === 1) val += ':'
                                                        if (val.length <= 5) handleCustomBreakChange(index, 'end', val)
                                                    }}
                                                    placeholder="00:00"
                                                    className="h-10 border-slate-200 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-400"
                                                    disabled={readOnly}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notify members */}
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="notify"
                            checked={notifyMembers}
                            onCheckedChange={(checked) => setNotifyMembers(checked as boolean)}
                            className="w-5 h-5 border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 text-white"
                        />
                        <div className="flex items-center gap-1.5">
                            <Label htmlFor="notify" className="text-slate-700 font-medium cursor-pointer">
                                Notify members about their breaks
                            </Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="w-4 h-4 text-slate-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Send a notification when a break is available.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-2 bg-slate-50/50 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white transition-all shadow-sm"
                    >
                        {readOnly ? "Close" : "Cancel"}
                    </Button>
                    {!readOnly && (
                        <Button
                            onClick={handleSave}
                            className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-md shadow-slate-100 border-none"
                        >
                            Save
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>

            <MemberSelectionModal
                open={isMemberSelectionOpen}
                onOpenChange={setIsMemberSelectionOpen}
                selectedMembers={selectedMembers}
                onSave={setSelectedMembers}
            />
        </Dialog>
    )
}

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
        // If all visible are selected, check if we should deselect all or just visible?
        // Actually user wants to select ALL members in the list (metadata.total).

        // Logic: If we have selected all (or more than total visible), we deselect all.
        // Otherwise we fetch all IDs and select them.

        // Simple heuristic: If localSelected.length === totalMembers (and totalMembers > 0), deselect all.
        // But with search query, totalMembers changes.
        // If filtered count == localSelected.length? No, localSelected might contain hidden ones.

        // Let's stick to: If current page is fully selected, we might want to Deselect All?
        // Or if localSelected contains all currently filtered items?

        // Given the request "Select all" (all pages), let's make it simple:
        // Toggle state: If (localSelected.length >= totalMembers) -> Deselect All
        // Else -> Select All (fetch IDs)

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

                <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members"
                                className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 text-sm">
                            <button onClick={handleSelectAll} className="text-slate-900 hover:underline font-medium" disabled={isLoading}>
                                {isLoading ? "Loading..." : (totalMembers > 0 && localSelected.length >= totalMembers ? "Deselect all" : "Select all")}
                            </button>
                            <button onClick={handleClearAll} className="text-slate-500 hover:underline">Clear all</button>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-md flex-1 overflow-hidden flex flex-col">
                        <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={totalMembers > 0 && localSelected.length >= totalMembers}
                                    onCheckedChange={() => handleSelectAll()}
                                    className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 data-[state=checked]:text-white"
                                />
                                <span className="text-sm font-medium text-slate-700">
                                    Selected ({localSelected.length})
                                </span>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {isLoading ? (
                                <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                            ) : members.length > 0 ? (
                                members.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors">
                                        <Checkbox
                                            id={`member-${member.id}`}
                                            checked={localSelected.includes(member.id)}
                                            onCheckedChange={() => handleToggle(member.id)}
                                            className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 data-[state=checked]:text-white"
                                        />
                                        <Label htmlFor={`member-${member.id}`} className="text-sm text-slate-700 font-normal cursor-pointer flex-1">
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

                    <div className="text-xs text-slate-500">
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
