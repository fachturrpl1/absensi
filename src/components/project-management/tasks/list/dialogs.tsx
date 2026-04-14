"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Loader2, CheckCircle2, Search, Users, Check } from "lucide-react"
import type { ITask, IOrganization_member, ITaskStatus, ITeams } from "@/interface"
import { syncTaskAssignees } from "@/action/task"
import { toast } from "sonner"

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
    { value: "high",   label: "High",   dot: "bg-red-500" },
    { value: "medium", label: "Medium", dot: "bg-amber-500" },
    { value: "low",    label: "Low",    dot: "bg-blue-500" },
]

// ─── Avatar Component ─────────────────────────────────────────────────────────

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
    const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    if (photoUrl) {
        return <img src={photoUrl} alt={name} className="h-7 w-7 rounded-full object-cover shrink-0" />
    }
    return (
        <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0 uppercase">
            {initials}
        </span>
    )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ManageTaskDialogProps {
    mode: "add" | "edit"
    open: boolean
    onOpenChange: (val: boolean) => void
    task: ITask | null
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
    teams: ITeams[]
    onSave: (formData: FormData) => Promise<void>
}

export default function ManageTaskDialog({
    mode, open, onOpenChange, task, members, taskStatuses, teams, onSave,
}: ManageTaskDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("general")
    
    // Form State
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState<string>("medium")
    const [statusId, setStatusId] = useState<string>("")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [isCompleted, setIsCompleted] = useState(false)
    
    // Assign State
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<number[]>([])
    const [selectedTeamId, setSelectedTeamId] = useState<string>("all")
    const [memberSearch, setMemberSearch] = useState("")

    // Reset Form
    useEffect(() => {
        if (open) {
            setActiveTab("general")
            if (mode === "edit" && task) {
                setName(task.name || "")
                setDescription(task.description || "")
                setPriority(task.priority || "medium")
                setStatusId(task.status_id?.toString() || "")
                setStartDate(task.start_date?.split("T")[0] || "")
                setEndDate(task.end_date?.split("T")[0] || "")
                setIsCompleted(!!task.marked_completed_at)
                setSelectedAssigneeIds(task.assignees?.map(a => a.organization_member_id) || [])
            } else {
                setName("")
                setDescription("")
                setPriority("medium")
                setStatusId(taskStatuses.find(s => s.code === "todo")?.id.toString() || taskStatuses[0]?.id.toString() || "")
                setStartDate("")
                setEndDate("")
                setIsCompleted(false)
                setSelectedAssigneeIds([])
            }
        }
    }, [open, mode, task, taskStatuses])

    // Filtered Members
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const matchesSearch = (m.user?.display_name || "").toLowerCase().includes(memberSearch.toLowerCase())
            const matchesTeam = selectedTeamId === "all" || m.department_id?.toString() === selectedTeamId
            return matchesSearch && matchesTeam
        })
    }, [members, memberSearch, selectedTeamId])

    const toggleAssignee = (id: number) => {
        setSelectedAssigneeIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSave = async () => {
        if (!name.trim()) return
        setIsSaving(true)
        try {
            const fd = new FormData()
            if (mode === "edit" && task) fd.append("id", task.id.toString())
            fd.append("name", name)
            fd.append("description", description)
            fd.append("priority", priority)
            if (statusId) fd.append("status_id", statusId)
            fd.append("start_date", startDate || "")
            fd.append("end_date", endDate || "")
            
            // Pass assignee IDs as a JSON string to be handled by onSave
            fd.append("assignee_ids", JSON.stringify(selectedAssigneeIds))

            if (isCompleted) {
                fd.append("marked_completed_at", (mode === "edit" && task?.marked_completed_at) ? task.marked_completed_at : new Date().toISOString())
            } else {
                fd.append("marked_completed_at", "")
            }
            
            await onSave(fd)
            
            if (mode === "edit" && task) {
                await syncTaskAssignees(task.id, selectedAssigneeIds)
            }
            onOpenChange(false)
        } catch (error) {
            console.error("Save Error:", error)
            toast.error("Failed to save task")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-full max-w-lg max-h-[92dvh] sm:max-h-[85vh]">
                {/* Header */}
                <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
                    <DialogTitle className="text-base font-semibold truncate pr-6">
                        {mode === "add" ? "New Task" : `Edit: ${task?.name}`}
                    </DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
                    <TabsList className="justify-start rounded-none border-b bg-transparent h-auto px-5 pb-0 pt-0.5 gap-0 shrink-0 overflow-x-auto">
                        {["general", "assign"].map(tab => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className={cn(
                                    "rounded-none border-b-2 border-transparent px-4 pb-2 pt-1.5 capitalize text-sm font-medium whitespace-nowrap",
                                    "data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                                    "text-muted-foreground data-[state=active]:text-foreground transition-colors"
                                )}
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="flex-1 overflow-y-auto">
                        <TabsContent value="general" className="m-0 p-5 space-y-4">
                            {/* Task Name */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Task Name <span className="text-destructive">*</span></Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="What needs to be done?" />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Description</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add details..." rows={3} className="resize-none" />
                            </div>

                            {/* Priority & Status */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Priority</Label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {PRIORITY_OPTIONS.map(o => (
                                                <SelectItem key={o.value} value={o.value}>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("h-2 w-2 rounded-full shrink-0", o.dot)} />
                                                        {o.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Select value={statusId} onValueChange={setStatusId}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {taskStatuses.map(o => (
                                                <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Start Date</Label>
                                    <Input type="date" className="h-9" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">End Date</Label>
                                    <Input type="date" className="h-9" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
                                </div>
                            </div>

                            {/* Completion Switch */}
                            <div className="flex items-center justify-between rounded-xl border px-4 py-3 bg-muted/20">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", isCompleted ? "text-emerald-600" : "text-muted-foreground")} />
                                    <div>
                                        <p className={cn("text-sm font-medium", isCompleted && "text-emerald-700")}>Mark as Completed</p>
                                        <p className="text-xs text-muted-foreground">Sets the completion timestamp.</p>
                                    </div>
                                </div>
                                <Switch checked={isCompleted} onCheckedChange={setIsCompleted} className={cn(isCompleted && "data-[state=checked]:bg-emerald-500")} />
                            </div>
                        </TabsContent>

                        <TabsContent value="assign" className="m-0 p-5 space-y-4">
                            {/* Selected Counter */}
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">
                                    Assigned ({selectedAssigneeIds.length})
                                </Label>
                                {selectedAssigneeIds.length > 0 && (
                                    <Button variant="ghost" size="sm" className="h-auto p-0 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => setSelectedAssigneeIds([])}>
                                        Clear all
                                    </Button>
                                )}
                            </div>

                            {/* Filters */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input placeholder="Search member..." className="pl-8 h-8 text-sm" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    <Button 
                                        variant={selectedTeamId === "all" ? "secondary" : "outline"} 
                                        size="sm" className="h-7 px-3 text-[10px] uppercase font-bold"
                                        onClick={() => setSelectedTeamId("all")}
                                    >
                                        All Members
                                    </Button>
                                    {teams.map(team => (
                                        <Button 
                                            key={team.id}
                                            variant={selectedTeamId === team.id.toString() ? "secondary" : "outline"} 
                                            size="sm" className="h-7 px-3 text-[10px] uppercase font-bold whitespace-nowrap"
                                            onClick={() => setSelectedTeamId(team.id.toString())}
                                        >
                                            {team.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Member List */}
                            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                                {filteredMembers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                        <Users className="h-8 w-8 mb-2" />
                                        <p className="text-sm font-medium">No members found</p>
                                    </div>
                                ) : filteredMembers.map(member => {
                                    const isSelected = selectedAssigneeIds.includes(Number(member.id))
                                    return (
                                        <div 
                                            key={member.id} 
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group border border-transparent",
                                                isSelected ? "bg-primary/5 border-primary/10" : "hover:bg-muted/50"
                                            )}
                                            onClick={() => toggleAssignee(Number(member.id))}
                                        >
                                            <Avatar name={member.user?.display_name || "Unknown"} photoUrl={member.user?.profile_photo_url} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{member.user?.display_name || "Unknown"}</p>
                                                <p className="text-[10px] text-muted-foreground truncate opacity-70">
                                                    {member.departments?.name || "Direct Member"}
                                                </p>
                                            </div>
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                isSelected ? "bg-primary border-primary" : "border-muted group-hover:border-primary/30"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3 text-primary-foreground stroke-[3px]" />}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Footer */}
                <DialogFooter className="px-5 py-3.5 border-t shrink-0 flex-row gap-2 sm:justify-end">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={!name.trim() || isSaving}>
                        {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        {isSaving ? "Saving…" : mode === "add" ? "Create Task" : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}