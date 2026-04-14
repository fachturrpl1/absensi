"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Archive, CheckCircle, RotateCcw, Trash2, MoreHorizontal } from "lucide-react"
import { updateTask, deleteTask } from "@/action/task"
import { toast } from "sonner"
import { ITask, ITaskStatus } from "@/interface"
import { ActiveTab } from "@/types/tasks"

interface TaskBatchActionsProps {
    selectedIds: string[]
    activeTab: ActiveTab
    tasks: ITask[]
    taskStatuses: ITaskStatus[]
    setTasks: (tasks: ITask[]) => void
    onActionComplete: () => void
    refreshTasks: () => Promise<void>
}

export function TaskBatchActions({
    selectedIds,
    activeTab,
    tasks,
    taskStatuses,
    setTasks,
    onActionComplete,
    refreshTasks
}: TaskBatchActionsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (selectedIds.length === 0) return null

    const handleStatusUpdate = async (type: "done" | "todo") => {
        const statusToApply = taskStatuses.find(s => s.code === type)
        if (!statusToApply) {
            toast.error(`Status "${type}" not found`)
            return
        }

        setIsSubmitting(true)
        const snapshot = [...tasks]
        
        // Optimistic update
        setTasks(tasks.map(t => 
            selectedIds.includes(t.id.toString()) 
                ? { ...t, status_id: statusToApply.id, task_status: statusToApply } 
                : t
        ))

        try {
            const results = await Promise.all(
                selectedIds.map(id => {
                    const fd = new FormData()
                    fd.append("id", id)
                    fd.append("status_id", statusToApply.id.toString())
                    // If marking as done, also set marked_completed_at
                    if (type === "done") {
                        fd.append("marked_completed_at", new Date().toISOString())
                    } else {
                        fd.append("marked_completed_at", "")
                    }
                    return updateTask(fd)
                })
            )

            if (results.some(r => !r.success)) {
                toast.error("Some tasks failed to update")
                await refreshTasks() // Sync back
            } else {
                toast.success(`${selectedIds.length} tasks updated`)
            }
        } catch (error) {
            setTasks(snapshot)
            toast.error("An error occurred during batch update")
        } finally {
            setIsSubmitting(false)
            onActionComplete()
        }
    }

    const handleBatchDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} tasks?`)) return

        setIsSubmitting(true)
        const snapshot = [...tasks]
        
        // Optimistic
        setTasks(tasks.filter(t => !selectedIds.includes(t.id.toString())))

        try {
            const results = await Promise.all(
                selectedIds.map(id => {
                    const fd = new FormData()
                    fd.append("id", id)
                    return deleteTask(fd)
                })
            )

            if (results.some(r => !r.success)) {
                toast.error("Some tasks failed to delete")
                await refreshTasks()
            } else {
                toast.success(`${selectedIds.length} tasks deleted`)
            }
        } catch (error) {
            setTasks(snapshot)
            toast.error("An error occurred during batch deletion")
        } finally {
            setIsSubmitting(false)
            onActionComplete()
        }
    }

    const handleBatchArchive = async (archive: boolean) => {
        setIsSubmitting(true)
        const snapshot = [...tasks]
        
        // Optimistic
        setTasks(tasks.map(t => 
            selectedIds.includes(t.id.toString()) 
                ? { ...t, is_archived: archive } 
                : t
        ))

        try {
            const results = await Promise.all(
                selectedIds.map(id => {
                    const fd = new FormData()
                    fd.append("id", id)
                    fd.append("is_archived", archive ? "true" : "false")
                    return updateTask(fd)
                })
            )

            if (results.some(r => !r.success)) {
                toast.error("Some tasks failed to update")
                await refreshTasks()
            } else {
                toast.success(`${selectedIds.length} tasks ${archive ? "archived" : "restored"}`)
            }
        } catch (error) {
            setTasks(snapshot)
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
            onActionComplete()
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 shadow-sm border-dashed" disabled={isSubmitting}>
                    <MoreHorizontal className="h-4 w-4" />
                    <span>Batch actions</span>
                    <span className="ml-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 min-w-[1.25rem]">
                        {selectedIds.length}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Update Status
                </div>
                {activeTab !== "archived" ? (
                    <DropdownMenuItem onClick={() => handleStatusUpdate("done")} className="gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" /> 
                        Mark as Complete
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={() => handleStatusUpdate("todo")} className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Mark as Active
                    </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Organization
                </div>
                {activeTab !== "archived" ? (
                    <DropdownMenuItem onClick={() => handleBatchArchive(true)} className="gap-2">
                        <Archive className="h-4 w-4" />
                        Archive Tasks
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={() => handleBatchArchive(false)} className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Restore from Archive
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleBatchDelete} className="gap-2 text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete Tasks
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
