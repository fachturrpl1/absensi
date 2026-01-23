"use client"

import { useMemo, useState, useEffect } from "react"
// import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Pencil, Trash2, Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { DUMMY_MEMBERS, DUMMY_PROJECTS, DUMMY_TASKS, getClientNameByProjectName } from "@/lib/data/dummy-data"
import { PaginationFooter } from "@/components/pagination-footer"

// Helper for initials
function initialsFromName(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ""
    const second = parts[1]?.[0] ?? ""
    return (first + second).toUpperCase()
}

type TaskRow = typeof DUMMY_TASKS[number]

export default function ListView() {
    const [tasks, setTasks] = useState<TaskRow[]>(DUMMY_TASKS)
    const [activeTab, setActiveTab] = useState<"active" | "completed">("active")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
    const [isGlobalTaskDialogOpen, setIsGlobalTaskDialogOpen] = useState(false)
    const [taskToDelete, setTaskToDelete] = useState<TaskRow | null>(null)
    const [editingTask, setEditingTask] = useState<TaskRow | null>(null)

    // Form states
    const [editedTitle, setEditedTitle] = useState("")
    const [editedAssignee, setEditedAssignee] = useState("")
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [newTaskAssignee, setNewTaskAssignee] = useState("")

    // Filter states
    const [selectedProject, setSelectedProject] = useState("all")
    const [selectedAssignee, setSelectedAssignee] = useState("all")

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const projectOptions = useMemo(() => DUMMY_PROJECTS.map((project) => project.name).filter(Boolean), [])
    const uniqueAssignees = useMemo(() => {
        const taskNames = tasks.map((task) => task.assignee)
        const memberNames = DUMMY_MEMBERS.map((member) => member.name)
        return Array.from(new Set([...memberNames, ...taskNames].filter(Boolean)))
    }, [tasks])

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            // Tab filter
            if (activeTab === "active" && task.completed) return false
            if (activeTab === "completed" && !task.completed) return false

            // Dropdown filters
            if (selectedProject !== "all" && task.project !== selectedProject) return false
            if (selectedAssignee !== "all" && task.assignee !== selectedAssignee) return false

            // Search
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesTitle = task.title.toLowerCase().includes(query)
                const matchesAssignee = task.assignee.toLowerCase().includes(query)
                if (!matchesTitle && !matchesAssignee) return false
            }
            return true
        })
    }, [tasks, activeTab, selectedProject, selectedAssignee, searchQuery])

    const paginatedTasks = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        return filteredTasks.slice(startIndex, endIndex)
    }, [filteredTasks, currentPage, pageSize])

    const totalPages = Math.ceil(filteredTasks.length / pageSize)

    const allSelected = paginatedTasks.length > 0 && paginatedTasks.every(t => selectedIds.includes(t.id))

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !paginatedTasks.find(t => t.id === id)))
        } else {
            const newIds = [...selectedIds]
            paginatedTasks.forEach(t => {
                if (!newIds.includes(t.id)) newIds.push(t.id)
            })
            setSelectedIds(newIds)
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1)
        setSelectedIds([])
    }, [activeTab, selectedProject, selectedAssignee, searchQuery])

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Tasks</h1>
            </div>

            {/* View Switcher (List / Kanban / Timeline) */}
            {/* <div className="flex justify-center my-4">
                <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
                    <button className="px-6 py-1.5 rounded-full bg-white shadow-sm text-sm font-medium text-gray-900">
                        List
                    </button>
                    <Link href="/projects/tasks/kanban" className="px-6 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900">
                        Kanban
                    </Link>
                    <Link href="/projects/tasks/timeline" className="px-6 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900">
                        Timeline
                    </Link>
                </div>
            </div> */}


            {/* Tabs */}
            <div className="flex items-center gap-6 text-sm">
                <button
                    className={`pb-2 border-b-2 ${activeTab === "active" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveTab("active")}
                >
                    ACTIVE ({tasks.filter(t => !t.completed).length})
                </button>
                <button
                    className={`pb-2 border-b-2 ${activeTab === "completed" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveTab("completed")}
                >
                    COMPLETED ({tasks.filter(t => t.completed).length})
                </button>
            </div>

            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        {/* Search */}
                            <div className="relative w-full sm:w-auto min-w-[260px] max-w-[360px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search tasks"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 border-gray-300"
                            />
                            </div>

                        {/* Filters inline with search for better density */}
                        <Select value={selectedProject} onValueChange={(value) => setSelectedProject(value)}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="All projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All projects</SelectItem>
                                {projectOptions.map((projectName) => (
                                    <SelectItem key={projectName} value={projectName}>{projectName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedAssignee} onValueChange={(value) => setSelectedAssignee(value)}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="All assignees" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All assignees</SelectItem>
                                {uniqueAssignees.map((assignee) => (
                                    <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="px-3">
                                    <Plus className="w-4 h-4 mr-2" />Add
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setIsNewTaskDialogOpen(true)}>
                                    Add task
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setIsGlobalTaskDialogOpen(true)}>
                                    Add global task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Batch Actions + Selection Count */}
                <div className="flex items-center gap-3 text-sm">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="px-3" disabled={selectedIds.length === 0}>
                                Batch actions
                            </Button>
                        </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem
                                onSelect={() => {
                                if (activeTab === "active") {
                                    setTasks(prev => prev.map(t => selectedIds.includes(t.id) ? { ...t, completed: true } : t))
                                } else {
                                    setTasks(prev => prev.map(t => selectedIds.includes(t.id) ? { ...t, completed: false } : t))
                                }
                                setSelectedIds([])
                                }}
                            >
                                {activeTab === "active" ? "Mark as completed" : "Mark as active"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => {
                                // Dummy delete
                                setTasks(prev => prev.filter(t => !selectedIds.includes(t.id)))
                                setSelectedIds([])
                            }} className="text-destructive">
                                Delete tasks
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-sm text-muted-foreground min-w-[90px]">
                        {selectedIds.length} / {filteredTasks.length} selected
                    </span>
                </div>

                <Separator className="my-8" />

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[40px] px-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 translate-y-[1px]"
                                    />
                                </TableHead>
                                <TableHead className="px-6 py-4 font-medium text-xs uppercase text-muted-foreground">Task</TableHead>
                                <TableHead className="px-6 py-4 font-medium text-xs uppercase text-muted-foreground">Assignee</TableHead>
                                <TableHead className="px-6 py-4 font-medium text-xs uppercase text-muted-foreground">Project</TableHead>
                                <TableHead className="px-6 py-4 font-medium text-xs uppercase text-muted-foreground">Client</TableHead>
                                <TableHead className="px-6 py-4 font-medium text-xs uppercase text-muted-foreground">Created</TableHead>
                                <TableHead className="px-6 py-4 font-medium text-xs uppercase text-muted-foreground text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="[&>tr:nth-child(even)]:bg-muted/50">
                            {filteredTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No tasks found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTasks.map((task) => (
                                    <TableRow key={task.id} className="border-b">
                                        <TableCell className="px-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(task.id)}
                                                onChange={() => toggleSelect(task.id)}
                                                className="rounded border-gray-300 translate-y-[1px]"
                                            />
                                        </TableCell>
                                        <TableCell className="px-6 py-4 font-medium text-foreground">{task.title}</TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-[10px] bg-gray-100 text-gray-700">
                                                        {initialsFromName(task.assignee)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm text-muted-foreground">{task.assignee}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-muted-foreground text-sm">{task.project}</TableCell>
                                        <TableCell className="px-6 py-4 text-muted-foreground text-sm">{getClientNameByProjectName(task.project) ?? "—"}</TableCell>
                                        <TableCell className="px-6 py-4 text-muted-foreground text-sm">{task.created}</TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-1 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-gray-900"
                                                    onClick={() => {
                                                        setEditingTask(task)
                                                        setEditedTitle(task.title)
                                                        setEditedAssignee(task.assignee)
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-red-600"
                                                    onClick={() => setTaskToDelete(task)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <PaginationFooter
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    isLoading={false}
                    from={paginatedTasks.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                    to={Math.min(currentPage * pageSize, filteredTasks.length)}
                    total={filteredTasks.length}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                />
            </div>

            {/* DIALOGS (Preserved) */}
            <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>New task</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to create a new task and assign it immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">TASK*</div>
                            <Input
                                className="px-4"
                                placeholder="Enter task"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-medium">ASSIGNEE</div>
                            <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueAssignees.map((assignee) => (
                                        <SelectItem key={assignee} value={assignee}>
                                            {assignee}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                            <p>
                                An agile project management tool with automated workflows.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (newTaskTitle.trim()) {
                                    const newTask: TaskRow = {
                                        id: `task-${Date.now()}`,
                                        title: newTaskTitle,
                                        assignee: newTaskAssignee || uniqueAssignees[0] || DUMMY_MEMBERS[0]?.name || "Unassigned",
                                        project: selectedProject !== "all" ? selectedProject : projectOptions[0] || "Default Project",
                                        type: "Task",
                                        created: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
                                        status: "task",
                                        completed: false
                                    }
                                    setTasks([...tasks, newTask])
                                    setNewTaskTitle("")
                                    setNewTaskAssignee("")
                                    setIsNewTaskDialogOpen(false)
                                }
                            }}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isGlobalTaskDialogOpen} onOpenChange={setIsGlobalTaskDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add global task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="rounded-md bg-gray-50 p-4 text-sm text-foreground">
                            <p>
                                Global tasks can be added to multiple projects that all members can track.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-medium">GLOBAL TASK*</div>
                            <Select>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select global task" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global-1">Global task 1</SelectItem>
                                    <SelectItem value="global-2">Global task 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGlobalTaskDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => setIsGlobalTaskDialogOpen(false)}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(taskToDelete)} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <DialogContent className="max-w-md space-y-6">
                    <DialogHeader>
                        <DialogTitle>Delete task</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Are you sure you want to delete{taskToDelete ? ` "${taskToDelete.title}"` : ""}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <DialogClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            className="w-full sm:w-auto"
                            variant="destructive"
                            onClick={() => {
                                if (taskToDelete) {
                                    setTasks(tasks.filter(task => task.id !== taskToDelete.id))
                                }
                                setTaskToDelete(null)
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit task</DialogTitle>
                        <DialogDescription>
                            Update the fields below before saving your changes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">TASK*</div>
                            <Input className="px-4" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-medium">ASSIGNEE</div>
                            <Select value={editedAssignee} onValueChange={(value) => setEditedAssignee(value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {uniqueAssignees.map((assignee) => (
                                        <SelectItem key={assignee} value={assignee}>
                                            {assignee}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTask(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (!editingTask) return
                                setTasks((prev) =>
                                    prev.map((task) =>
                                        task.id === editingTask.id
                                            ? { ...task, title: editedTitle, assignee: editedAssignee }
                                            : task
                                    )
                                )
                                setEditingTask(null)
                            }}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
