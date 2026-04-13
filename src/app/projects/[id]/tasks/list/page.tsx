"use client"

import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Pencil, Trash2, ChevronRight, ChevronDown, Check } from "lucide-react"
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog, DialogContent, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { updateTask, deleteTask, assignTaskMember } from "@/action/task"
import { toast } from "sonner"
import { ITask } from "@/interface"
import { cn } from "@/lib/utils"
import { TaskNode } from "@/types/tasks"
import { useOrgDateFormat } from "@/hooks/organization/settings/use-org-date-format"
import { buildTaskTree, flattenTree, StackedAssignees } from "@/components/project-management/tasks/header"
import { useTasksContext } from "../layout"
import ManageTaskDialog from "@/components/project-management/tasks/dialogs/manage-task-dialog"

// ─── Priority Badge ───────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }: { priority: string | null }) => {
    const colors: Record<string, string> = { 
        high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        low:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    }
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priority ? colors[priority] : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"}`}>
            {priority || "None"}
        </span>
    )
}

export default function ListPage() {
    const {
        tasks, members, taskStatuses,
        isLoading, activeTab,
        setTasks, projectId, refreshTasks,
    } = useTasksContext()
    const { formatDate } = useOrgDateFormat()

    const searchParams = useSearchParams()

    // ── Local UI state ─────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
    const [selectedAssignee, setSelectedAssignee] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

    // ── Dialog state ───────────────────────────────────────────────────────────
    const [taskToDelete, setTaskToDelete] = useState<ITask | null>(null)
    const [editingTask, setEditingTask] = useState<ITask | null>(null)

    // ── Reset pagination saat filter berubah ──────────────────────────────────
    useEffect(() => {
        setRowSelection({})
        setCurrentPage(1)
    }, [activeTab, selectedAssignee, searchQuery])

    // ── Filtered tasks ─────────────────────────────────────────────────────────
    const filteredTasks = useMemo(() => {
        return tasks.filter((task: ITask) => {

            const isDone = task.task_status?.code === "done"
            const isArchived = task.is_archived

            if (activeTab === "archived") {
                if (!isArchived) return false
            } else {
                if (isArchived) return false
                if (activeTab === "active" && isDone) return false
                if (activeTab === "completed" && !isDone) return false
            }

            if (selectedAssignee !== "all") {
                const ids = task.assignees?.map(a => String(a.organization_member_id)) ?? []
                if (!ids.includes(selectedAssignee)) return false
            }

            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                const assigneeNames = task.assignees?.map(a => {
                    const u = a.member?.user
                    return (u?.display_name || `${u?.first_name || ""} ${u?.last_name || ""}`.trim()).toLowerCase()
                }) ?? []
                if (!task.name.toLowerCase().includes(q) && !assigneeNames.some(n => n.includes(q))) return false
            }

            return true
        })
    }, [tasks, projectId, activeTab, selectedAssignee, searchQuery])

    // ── Tree + pagination ──────────────────────────────────────────────────────
    const taskTree = useMemo(() => buildTaskTree(filteredTasks), [filteredTasks])
    const paginatedTree = useMemo(() => taskTree.slice((currentPage - 1) * pageSize, currentPage * pageSize), [taskTree, currentPage, pageSize])
    const displayRows = useMemo(() => flattenTree(paginatedTree, expandedTasks), [paginatedTree, expandedTasks])
    const totalPages = Math.ceil(taskTree.length / pageSize) || 1

    // ── Selection ──────────────────────────────────────────────────────────────
    const selectedIds = Object.keys(rowSelection).filter(k => rowSelection[k])
    const allSelected = paginatedTree.length > 0 && paginatedTree.every((t: TaskNode) => rowSelection[t.id.toString()])

    const toggleSelectAll = () => {
        if (allSelected) {
            setRowSelection(prev => { const next = { ...prev }; paginatedTree.forEach((t: TaskNode) => delete next[t.id.toString()]); return next })
        } else {
            setRowSelection(prev => { const next = { ...prev }; paginatedTree.forEach((t: TaskNode) => { next[t.id.toString()] = true }); return next })
        }
    }
    const toggleSelect = (id: string) =>
        setRowSelection(prev => { const next = { ...prev }; if (next[id]) delete next[id]; else next[id] = true; return next })

    // ── Mutations ──────────────────────────────────────────────────────────────

    const handleUpdate = async (fd: FormData) => {
        if (!editingTask) return
        const taskId = editingTask.id
        const assigneeId = fd.get("assignee_id")
        fd.delete("assignee_id")

        const res = await updateTask(fd)
        if (res.success) {
            if (assigneeId && assigneeId !== "none") {
                await assignTaskMember(taskId, Number(assigneeId))
            }
            await refreshTasks()
            toast.success("Task updated")
        } else {
            toast.error(res.message || "Failed to update task")
        }
    }

    const handleDelete = async () => {
        if (!taskToDelete) return
        const snapshot = taskToDelete

        setTasks(prev => prev.filter(t => t.id !== snapshot.id)) // optimistic
        setTaskToDelete(null)
        toast.success("Task deleted")

        const fd = new FormData()
        fd.append("id", snapshot.id.toString())
        const res = await deleteTask(fd)
        if (!res.success) {
            setTasks(prev => [...prev, snapshot]) // rollback
            toast.error(res.message || "Failed to delete task")
        }
    }

    const handleBatchAction = async () => {
        const newCode = activeTab === "active" ? "done" : "todo"
        const statusToApply = taskStatuses.find(s => s.code === newCode)
        if (!statusToApply) return
        const snapshot = tasks

        setTasks(prev => prev.map(t => selectedIds.includes(t.id.toString()) ? { ...t, status_id: statusToApply.id, task_status: statusToApply } : t))
        setRowSelection({})
        toast.success("Tasks updated")

        const results = await Promise.all(
            selectedIds.map(id => { const fd = new FormData(); fd.append("id", id); fd.append("status_id", statusToApply.id.toString()); return updateTask(fd) })
        )
        if (results.some(r => !r.success)) {
            setTasks(snapshot) // rollback
            toast.error("Some tasks failed to update")
        }
    }

    return (
        <div className="flex flex-col gap-4">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tasks or assignee..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
                </div>

                <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="All assignees" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All assignees</SelectItem>
                        {members.map(m => (
                            <SelectItem key={m.id} value={m.id.toString()}>
                                {m.user?.display_name || `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim() || "Unknown"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={selectedIds.length === 0}>
                            Batch actions
                            {selectedIds.length > 0 && <span className="ml-2 rounded-full bg-primary text-primary-foreground text-xs px-1.5">{selectedIds.length}</span>}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={handleBatchAction}>
                            {activeTab === "active" ? "Mark as completed" : "Reopen tasks"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} /></TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Deescription</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Completed</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right w-24">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={11} className="text-center py-16 text-muted-foreground">Loading tasks...</TableCell></TableRow>
                            ) : displayRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-16 text-muted-foreground">
                                        {searchQuery || selectedAssignee !== "all" ? "No tasks match your filters." : activeTab === "active" ? "No active tasks. Create one to get started." : "No tasks found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayRows.map(({ node: task, depth, hasChildren }) => {
                                    const isExpanded = expandedTasks.has(task.id)
                                    return (
                                        <TableRow key={task.id} className={cn(depth > 0 && "bg-muted/30")}>
                                            <TableCell><Checkbox checked={!!rowSelection[task.id.toString()]} onCheckedChange={() => toggleSelect(task.id.toString())} /></TableCell>
                                            <TableCell className="min-w-[280px]">
                                                <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 24}px` }}>
                                                    {hasChildren ? (
                                                        <button onClick={() => setExpandedTasks(prev => { const next = new Set(prev); if (next.has(task.id)) next.delete(task.id); else next.add(task.id); return next })} className="p-0.5 rounded hover:bg-muted shrink-0">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                        </button>
                                                    ) : <span className="w-5 shrink-0" />}
                                                    <span className={cn("text-sm font-medium line-clamp-2", task.task_status?.code === "done" && "line-through text-muted-foreground")}>{task.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[150px]">
                                                <span className="text-xs text-muted-foreground line-clamp-1" title={task.description || ""}>
                                                    {task.description || "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <PriorityBadge priority={task.priority} />
                                            </TableCell>
                                            <TableCell>
                                                {task.task_status
                                                    ? <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide" style={{ backgroundColor: `${task.task_status.color}20`, color: task.task_status.color }}>{task.task_status.name}</span>
                                                    : <span className="text-xs text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                {task.assignees?.length
                                                    ? <StackedAssignees assignees={task.assignees} max={3} />
                                                    : <span className="text-xs text-muted-foreground">Unassigned</span>}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {task.start_date ? formatDate(task.start_date) : "—"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {task.end_date ? formatDate(task.end_date) : "—"}
                                            </TableCell>
                                            <TableCell className="text-xs font-medium">
                                                {task.marked_completed_at ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                                        <Check className="h-3.5 w-3.5" />
                                                        {formatDate(task.marked_completed_at)}
                                                    </div>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDate(task.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTask(task)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setTaskToDelete(task)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <PaginationFooter
                page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
                isLoading={isLoading}
                from={taskTree.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                to={Math.min(currentPage * pageSize, taskTree.length)}
                total={taskTree.length} pageSize={pageSize}
                onPageSizeChange={(size: number) => { setPageSize(size); setCurrentPage(1) }}
            />

            <ManageTaskDialog
                mode="edit"
                open={!!editingTask}
                onOpenChange={v => !v && setEditingTask(null)}
                task={editingTask}
                members={members}
                taskStatuses={taskStatuses}
                onSave={handleUpdate}
            />

            {/* Delete Dialog */}
            <Dialog open={!!taskToDelete} onOpenChange={v => !v && setTaskToDelete(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Task</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Are you sure you want to delete <span className="font-medium text-foreground">"{taskToDelete?.name}"</span>? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
