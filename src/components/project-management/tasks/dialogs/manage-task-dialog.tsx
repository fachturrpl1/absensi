"use client"

import React, { useState, useEffect } from "react"
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
import { cn } from "@/lib/utils"
import { Loader2, CheckCircle2 } from "lucide-react"
import type { ITask, IOrganization_member, ITaskStatus } from "@/interface"

const PRIORITY_OPTIONS = [
    { value: "urgent", label: "Urgent", dot: "bg-red-600" },
    { value: "high",   label: "High",   dot: "bg-red-500" },
    { value: "medium", label: "Medium", dot: "bg-amber-500" },
    { value: "low",    label: "Low",    dot: "bg-blue-500" },
]

interface ManageTaskDialogProps {
    mode: "add" | "edit"
    open: boolean
    onOpenChange: (val: boolean) => void
    task: ITask | null
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
    onSave: (formData: FormData) => Promise<void>
}

export default function ManageTaskDialog({
    mode, open, onOpenChange, task, members, taskStatuses, onSave,
}: ManageTaskDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState<string>("medium")
    const [statusId, setStatusId] = useState<string>("")
    const [assigneeId, setAssigneeId] = useState<string>("")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [isCompleted, setIsCompleted] = useState(false)

    useEffect(() => {
        if (open) {
            if (mode === "edit" && task) {
                setName(task.name || "")
                setDescription(task.description || "")
                setPriority(task.priority || "medium")
                setStatusId(task.status_id?.toString() || "")
                setAssigneeId(task.assignees?.[0]?.organization_member_id?.toString() || "")
                setStartDate(task.start_date?.split("T")[0] || "")
                setEndDate(task.end_date?.split("T")[0] || "")
                setIsCompleted(!!task.marked_completed_at)
            } else {
                setName("")
                setDescription("")
                setPriority("medium")
                setStatusId(taskStatuses.find(s => s.code === "todo")?.id.toString() || taskStatuses[0]?.id.toString() || "")
                setAssigneeId("")
                setStartDate("")
                setEndDate("")
                setIsCompleted(false)
            }
        }
    }, [open, mode, task, taskStatuses])

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
            if (assigneeId) fd.append("assignee_id", assigneeId) // Note: layout.tsx/ListPage will need to handle the member assignment separately if needed, but we'll pass it anyway
            fd.append("start_date", startDate || "")
            fd.append("end_date", endDate || "")
            
            // Handle marked_completed_at based on switch
            if (isCompleted) {
                if (mode === "edit" && task?.marked_completed_at) {
                    fd.append("marked_completed_at", task.marked_completed_at)
                } else {
                    fd.append("marked_completed_at", new Date().toISOString())
                }
            } else {
                fd.append("marked_completed_at", "")
            }

            // Custom handle for assignee if needed in onSave implementation
            // In layout.tsx handleCreateTask, it takes (title, assigneeId, statusId)
            // We'll wrap it in onSave.
            await onSave(fd)
            onOpenChange(false)
        } finally {
            setIsSaving(false)
        }
    }

    const isFormValid = name.trim().length > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden w-full max-w-lg max-h-[92dvh] sm:max-h-[85vh]">
                <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
                    <DialogTitle className="text-base font-semibold truncate pr-6">
                        {mode === "add" ? "New Task" : `Edit: ${task?.name}`}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Task Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="task-name" className="text-sm font-medium">
                            Task Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="task-name"
                            placeholder="Task name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSave()}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="task-desc" className="text-sm font-medium">Description</Label>
                        <Textarea
                            id="task-desc"
                            placeholder="Brief description…"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
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

                    {/* Assignee */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Assignee</Label>
                        <Select value={assigneeId} onValueChange={setAssigneeId}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Select assignee" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Unassigned</SelectItem>
                                {members.map(m => (
                                    <SelectItem key={m.id} value={m.id.toString()}>
                                        {m.user?.display_name || `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim() || "Unknown"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Start & End Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="start-date" className="text-sm font-medium">Start Date</Label>
                            <Input
                                id="start-date"
                                type="date"
                                className="h-9"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="end-date" className="text-sm font-medium">End Date</Label>
                            <Input
                                id="end-date"
                                type="date"
                                className="h-9"
                                value={endDate}
                                min={startDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Completion Switch */}
                    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div className="flex items-start gap-3">
                           <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", isCompleted ? "text-emerald-600" : "text-muted-foreground")} />
                            <div>
                                <p className={cn("text-sm font-medium", isCompleted && "text-emerald-700")}>
                                    Mark as Completed
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Set completion timestamp for this task.
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={isCompleted}
                            onCheckedChange={setIsCompleted}
                            className={cn(isCompleted && "data-[state=checked]:bg-emerald-500")}
                        />
                    </div>
                </div>

                <DialogFooter className="px-5 py-3.5 border-t shrink-0 flex-row gap-2 sm:justify-end">
                    <Button
                        variant="outline" size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!isFormValid || isSaving}
                    >
                        {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        {isSaving ? "Saving…" : mode === "add" ? "Create Task" : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
