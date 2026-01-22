"use client"

import { useMemo, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Pencil, Trash2, Check, X, Copy, Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
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
import { DUMMY_MEMBERS, DUMMY_PROJECTS, DUMMY_TASKS } from "@/lib/data/dummy-data"
type TaskRow = typeof DUMMY_TASKS[number]

export default function ListView() {
    const [tasks, setTasks] = useState<TaskRow[]>(DUMMY_TASKS)
    const [showCompleted, setShowCompleted] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
    const [isGlobalTaskDialogOpen, setIsGlobalTaskDialogOpen] = useState(false)
    const [taskToDelete, setTaskToDelete] = useState<TaskRow | null>(null)
    const [editingTask, setEditingTask] = useState<TaskRow | null>(null)
    const [editedTitle, setEditedTitle] = useState("")
    const [editedAssignee, setEditedAssignee] = useState("")
    const [selectedProject, setSelectedProject] = useState("all")
    const [selectedAssignee, setSelectedAssignee] = useState("all")
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [newTaskAssignee, setNewTaskAssignee] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const projectOptions = useMemo(() => DUMMY_PROJECTS.map((project) => project.name).filter(Boolean), [])
    const uniqueAssignees = useMemo(() => {
        const taskNames = tasks.map((task) => task.assignee)
        const memberNames = DUMMY_MEMBERS.map((member) => member.name)
        return Array.from(new Set([...memberNames, ...taskNames].filter(Boolean)))
    }, [tasks])

    const displayedTasks = useMemo(() => {
        const filtered = tasks.filter((task) => {
            if (selectedProject !== "all" && task.project !== selectedProject) {
                return false
            }
            if (selectedAssignee !== "all" && task.assignee !== selectedAssignee) {
                return false
            }
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesTitle = task.title.toLowerCase().includes(query)
                const matchesAssignee = task.assignee.toLowerCase().includes(query)
                if (!matchesTitle && !matchesAssignee) {
                    return false
                }
            }
            if (!showCompleted && task.completed) {
                return false
            }
            return true
        })

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return filtered.slice(startIndex, endIndex)
    }, [tasks, selectedProject, selectedAssignee, searchQuery, showCompleted, currentPage, itemsPerPage])

    const totalFilteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (selectedProject !== "all" && task.project !== selectedProject) {
                return false
            }
            if (selectedAssignee !== "all" && task.assignee !== selectedAssignee) {
                return false
            }
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesTitle = task.title.toLowerCase().includes(query)
                const matchesAssignee = task.assignee.toLowerCase().includes(query)
                if (!matchesTitle && !matchesAssignee) {
                    return false
                }
            }
            if (!showCompleted && task.completed) {
                return false
            }
            return true
        }).length
    }, [tasks, selectedProject, selectedAssignee, searchQuery, showCompleted])

    const totalPages = Math.ceil(totalFilteredTasks / itemsPerPage)

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedProject, selectedAssignee, searchQuery, showCompleted])

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-end gap-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Project</span>
                        <Select value={selectedProject} onValueChange={(value) => setSelectedProject(value)}>
                            <SelectTrigger className="rounded-lg bg-white px-4 py-2">
                                <SelectValue placeholder="All projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All projects</SelectItem>
                                {projectOptions.map((projectName) => (
                                    <SelectItem key={projectName} value={projectName}>
                                        {projectName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Assignee</span>
                        <Select value={selectedAssignee} onValueChange={(value) => setSelectedAssignee(value)}>
                            <SelectTrigger className="rounded-lg bg-white px-4 py-2">
                                <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All assignees</SelectItem>
                                {uniqueAssignees.map((assignee) => (
                                    <SelectItem key={assignee} value={assignee}>
                                        {assignee}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* <Button variant="outline" className="rounded-lg px-5 py-2 text-sm gap-1">
                        <Copy className="h-4 w-4" />
                        Duplicate project
                    </Button> */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="rounded-lg px-5 py-2 text-sm gap-1 flex items-center"
                                variant="outline"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem
                                onSelect={() => setIsNewTaskDialogOpen(true)}
                                className="py-2 px-3 text-sm"
                            >
                                Add task
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => setIsGlobalTaskDialogOpen(true)}
                                className="py-2 px-3 text-sm"
                            >
                                Add global task
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
                <DialogContent className="max-w-md space-y-6">
                    <DialogHeader>
                        <DialogTitle>New task</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Fill in the details below to create a new task and assign it immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Task*</label>
                            <Input
                                placeholder="Enter task"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Assignee</label>
                            <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                                <SelectTrigger className="rounded-lg bg-white px-4 py-2 text-base">
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
                        <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="font-semibold text-foreground">Hubstaff Tasks</div>
                                <a href="#" className="text-xs font-semibold text-primary">
                                    Learn more
                                </a>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                An agile project management tool with automated workflows, sprints, and more task options (multiple
                                assignees, labels, checklists, due dates and more).
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <DialogClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            className="w-full sm:w-auto"
                            onClick={() => {
                                if (newTaskTitle.trim()) {
                                    const newTask: TaskRow = {
                                        id: `task-${Date.now()}`,
                                        title: newTaskTitle,
                                        assignee: newTaskAssignee || uniqueAssignees[0],
                                        project: selectedProject !== "all" ? selectedProject : projectOptions[0] || "Default Project",
                                        type: "Task",
                                        created: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
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
                <DialogContent className="max-w-md space-y-6">
                    <DialogHeader>
                        <DialogTitle>Add global task</DialogTitle>
                    </DialogHeader>
                    <div className="rounded-xl border border-border bg-blue-50 p-4 text-sm text-foreground">
                        <p>
                            Global tasks can be added to multiple projects that all members can track, and they cannot be marked as
                            completed. Create or edit global tasks in your organization settings.
                        </p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Global task*</label>
                        <Select>
                            <SelectTrigger className="rounded-lg bg-white px-4 py-2 text-base">
                                <SelectValue placeholder="Select global task" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global-1">Global task 1</SelectItem>
                                <SelectItem value="global-2">Global task 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <DialogClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button className="w-full sm:w-auto">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    <span>Show completed tasks</span>
                    <button
                        type="button"
                        onClick={() => setShowCompleted(!showCompleted)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full border transition-all duration-300 focus:outline-none ${showCompleted ? "bg-gray-800 border-gray-800" : "bg-gray-200 border-gray-300"
                            }`}
                    >
                        <span
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-in-out"
                            style={{
                                transform: showCompleted ? "translateX(28px)" : "translateX(2px)",
                            }}
                        >
                            {showCompleted ? (
                                <Check className="h-3.5 w-3.5 text-gray-800" />
                            ) : (
                                <X className="h-3.5 w-3.5 text-gray-500" />
                            )}
                        </span>
                    </button>
                </div>
                <div className="relative flex-1 max-w-md">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                        type="search"
                        placeholder="Search tasks"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-full border border-border bg-white py-2 pr-4 text-sm focus:ring-2 focus:ring-primary w-full"
                        style={{ paddingLeft: '3rem' }}
                    />
                </div>
            </div>

            <div className="border border-transparent">
                <Table className="w-full table-fixed bg-white shadow">
                    <TableHeader>
                        <TableRow className="bg-white text-sm font-semibold text-foreground">
                            <TableHead className="px-6 py-4 text-left">Task</TableHead>
                            <TableHead className="px-6 py-4 text-left">Assignee</TableHead>
                            <TableHead className="px-6 py-4 text-left">Task type</TableHead>
                            <TableHead className="px-6 py-4 text-left">Created</TableHead>
                            <TableHead className="px-6 py-4 text-left">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedTasks.map((todo) => (
                            <TableRow key={todo.id} className="bg-white border-b">
                                <TableCell className="px-6 py-4 text-left font-medium text-foreground">{todo.title}</TableCell>
                                <TableCell className="px-6 py-4 text-left text-muted-foreground">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-6 w-6 bg-gray-200 text-gray-500">
                                            <AvatarFallback>{todo.assignee.split(" ").map((w) => w[0]).join("")}</AvatarFallback>
                                        </Avatar>
                                        <span>{todo.assignee}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-left text-muted-foreground">{todo.type}</TableCell>
                                <TableCell className="px-6 py-4 text-left text-muted-foreground">{todo.created}</TableCell>
                                <TableCell className="px-6 py-4 text-left text-foreground">
                                    <div className="inline-flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                setEditingTask(todo)
                                                setEditedTitle(todo.title)
                                                setEditedAssignee(todo.assignee)
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setTaskToDelete(todo)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={Boolean(taskToDelete)} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <DialogContent className="max-w-md space-y-6">
                    <DialogHeader>
                        <DialogTitle>Delete task</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Are you sure you want to delete{taskToDelete ? ` "${taskToDelete.title}"` : ""}? This action cannot be undone.
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
                <DialogContent className="max-w-md space-y-6">
                    <DialogHeader>
                        <DialogTitle>Edit task</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Update the fields below before saving your changes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Task*</label>
                            <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Assignee</label>
                            <Select value={editedAssignee} onValueChange={(value) => setEditedAssignee(value)}>
                                <SelectTrigger className="rounded-lg bg-white px-4 py-2 text-base">
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
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                        <DialogClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            className="w-full sm:w-auto"
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Showing {displayedTasks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalFilteredTasks)} of {totalFilteredTasks} tasks
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-8 w-20"
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className="h-8 w-8 p-0"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8 w-20"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

