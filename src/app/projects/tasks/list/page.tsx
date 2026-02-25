"use client"

import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Pencil, Trash2, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import type { RowSelectionState } from "@tanstack/react-table"
import { getTasks, createTask, updateTask, deleteTask, assignTaskMember } from "@/action/task"
import { getProjects } from "@/action/project"
import { getAllOrganization_member } from "@/action/members"
import { ITask, IProject, IOrganization_member, ITaskAssignee } from "@/interface"
import { DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { toast } from "sonner"
import { PaginationFooter } from "@/components/tables/pagination-footer"

// Helper for initials
function initialsFromName(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] ?? ""
    const second = parts[1]?.[0] ?? ""
    return (first + second).toUpperCase()
}


export default function ListView() {
    const searchParams = useSearchParams()
    const initialProject = searchParams.get("project")

    function AssigneeAvatar({ asgn }: { asgn: ITaskAssignee }) {
        const user = asgn.member?.user
        const photoUrl = useProfilePhotoUrl(user?.profile_photo_url ?? undefined, user?.id)
        const name = user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || "Unknown"

        return (
            <Link
                href={`/members/${asgn.organization_member_id}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:scale-110 transition-transform"
            >
                <Avatar className="h-6 w-6 ring-2 ring-background">
                    {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
                    <AvatarFallback className="text-[10px] bg-gray-100 text-gray-700">
                        {initialsFromName(name)}
                    </AvatarFallback>
                </Avatar>
            </Link>
        )
    }


    const [tasks, setTasks] = useState<ITask[]>([])
    const [projects, setProjects] = useState<IProject[]>([])
    const [members, setMembers] = useState<IOrganization_member[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [activeTab, setActiveTab] = useState<"active" | "completed">("active")
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
    const urlClientName = searchParams.get("client")

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const [tasksRes, projectsRes, membersRes] = await Promise.all([
                    getTasks(),
                    getProjects(),
                    getAllOrganization_member()
                ])

                if (tasksRes.success) setTasks(tasksRes.data)
                if (projectsRes.success) setProjects(projectsRes.data)
                if (membersRes.success) setMembers(membersRes.data)
            } catch (error) {
                console.error("Error fetching data:", error)
                toast.error("Failed to load data")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])


    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

    const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)

    const [taskToDelete, setTaskToDelete] = useState<ITask | null>(null)
    const [editingTask, setEditingTask] = useState<ITask | null>(null)

    // Form states
    const [editedTitle, setEditedTitle] = useState("")
    const [editedAssignee, setEditedAssignee] = useState<number | "">("")
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [newTaskAssignee, setNewTaskAssignee] = useState<number | "">("")
    const [newTaskProject, setNewTaskProject] = useState<number | "">("")
    const [newTaskTeams, setNewTaskTeams] = useState<string[]>([])

    const [editedTeams, setEditedTeams] = useState<string[]>([])

    // Filter states
    const [selectedProject, setSelectedProject] = useState(initialProject || "all")
    const [selectedAssignee, setSelectedAssignee] = useState("all")

    const projectOptions = useMemo(() => projects, [projects])

    // Assignee list for New Task
    const dynamicAssignees = useMemo(() => members, [members])

    // Assignee list for Editing Task
    const dynamicEditedAssignees = useMemo(() => members, [members])


    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            // Tab filter
            const isCompleted = task.status === 'done'
            if (activeTab === "active" && isCompleted) return false
            if (activeTab === "completed" && !isCompleted) return false

            // Client filter from URL
            if (urlClientName) {
                const clientData = (task.project as any)?.client
                const clientNames: string[] = Array.isArray(clientData)
                    ? clientData.map((c: any) => c.name)
                    : [clientData?.name].filter(Boolean)

                const isMatch = clientNames.some(name => name.toLowerCase() === urlClientName.toLowerCase())
                if (!isMatch) return false
            }

            // Dropdown filters
            if (selectedProject !== "all" && task.project?.name !== selectedProject) return false

            // Assignee filter
            const assigneeName = task.assignees?.[0]?.member?.user?.display_name ||
                `${task.assignees?.[0]?.member?.user?.first_name || ''} ${task.assignees?.[0]?.member?.user?.last_name || ''}`.trim()
            if (selectedAssignee !== "all" && assigneeName !== selectedAssignee) return false

            // Search
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesTitle = task.name.toLowerCase().includes(query)
                const matchesAssignee = assigneeName.toLowerCase().includes(query)
                if (!matchesTitle && !matchesAssignee) return false
            }
            return true
        })
    }, [tasks, activeTab, selectedProject, selectedAssignee, searchQuery, urlClientName])

    const paginatedTasks = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return filteredTasks.slice(start, end)
    }, [filteredTasks, currentPage, pageSize])

    const totalPages = Math.ceil(filteredTasks.length / pageSize) || 1

    // Reset selection on filter change
    useEffect(() => {
        setRowSelection({})
        setCurrentPage(1)
    }, [activeTab, selectedProject, selectedAssignee, searchQuery])

    // Selection helpers
    const allSelected = paginatedTasks.length > 0 && paginatedTasks.every(t => rowSelection[t.id.toString()])

    const toggleSelectAll = () => {
        if (allSelected) {
            setRowSelection(prev => {
                const next = { ...prev }
                paginatedTasks.forEach(t => delete next[t.id.toString()])
                return next
            })
        } else {
            setRowSelection(prev => {
                const next = { ...prev }
                paginatedTasks.forEach(t => { next[t.id.toString()] = true })
                return next
            })
        }
    }

    const toggleSelect = (id: string) => {
        setRowSelection(prev => {
            const next = { ...prev }
            if (next[id]) delete next[id]; else next[id] = true
            return next
        })
    }

    // Batch Actions Handler
    const selectedCount = Object.keys(rowSelection).length

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Tasks</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 text-sm">
                <button
                    className={`pb-2 border-b-2 ${activeTab === "active" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveTab("active")}
                >
                    ACTIVE ({tasks.filter(t => t.status !== 'done').length})
                </button>
                <button
                    className={`pb-2 border-b-2 ${activeTab === "completed" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setActiveTab("completed")}
                >
                    COMPLETED ({tasks.filter(t => t.status === 'done').length})
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
                                className="ps-10 pl-10"
                            />
                        </div>

                        {/* Filters inline with search for better density */}
                        <Select value={selectedProject} onValueChange={(value) => setSelectedProject(value)}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="All projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All projects</SelectItem>
                                {projectOptions.map((project) => (
                                    <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedAssignee} onValueChange={(value) => setSelectedAssignee(value)}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="All assignees" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All assignees</SelectItem>
                                {members.map((member) => {
                                    const name = `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || member.user?.display_name || "Unknown"
                                    return (
                                        <SelectItem key={member.id} value={name}>{name}</SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button className="px-3" onClick={() => setIsNewTaskDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />Add task
                        </Button>
                    </div>
                </div>

                {/* Batch Actions + Selection Count */}
                <div className="flex items-center gap-3 text-sm">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="px-3" disabled={selectedCount === 0}>
                                Batch actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem
                                onSelect={async () => {
                                    const selectedRowIds = Object.keys(rowSelection).filter(k => rowSelection[k])
                                    const newStatus = activeTab === "active" ? "done" : "todo"

                                    const results = await Promise.all(selectedRowIds.map(id => {
                                        const fd = new FormData()
                                        fd.append("id", id)
                                        fd.append("status", newStatus)
                                        return updateTask(fd)
                                    }))
                                    const successCount = results.filter(r => r.success).length

                                    if (successCount > 0) {
                                        setTasks(prev => prev.map(t => selectedRowIds.includes(t.id.toString()) ? { ...t, status: newStatus } : t))
                                        toast.success(`Updated ${successCount} tasks`)
                                    } else {
                                        toast.error("Failed to update tasks")
                                    }
                                    setRowSelection({})
                                }}
                            >
                                {activeTab === "active" ? "Mark as completed" : "Reopen tasks"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-sm text-muted-foreground min-w-[90px]">
                        {selectedCount} / {filteredTasks.length} selected
                    </span>
                </div>

                <Separator className="my-4" />

                {/* Table */}
                <div className="mt-4 md:mt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            Loading tasks...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No tasks found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTasks.map((task) => {


                                    const clientData = task.project?.client
                                    const clientName = Array.isArray(clientData)
                                        ? clientData[0]?.name
                                        : (clientData as any)?.name

                                    return (
                                        <TableRow key={task.id}>
                                            <TableCell className="align-top">
                                                <Checkbox
                                                    checked={!!rowSelection[task.id.toString()]}
                                                    onCheckedChange={() => toggleSelect(task.id.toString())}
                                                    aria-label={`Select task ${task.name}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-0">
                                                    <span className="font-medium text-sm block truncate">{task.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex -space-x-2">
                                                    {(task.assignees || []).slice(0, 3).map((asgn) => (
                                                        <AssigneeAvatar
                                                            key={asgn.id || asgn.organization_member_id}
                                                            asgn={asgn}
                                                        />
                                                    ))}
                                                    {(task.assignees || []).length > 3 && (
                                                        <div className="h-6 w-6 rounded-full bg-muted text-xs grid place-items-center ring-2 ring-background">
                                                            +{(task.assignees || []).length - 3}
                                                        </div>
                                                    )}
                                                    {(task.assignees || []).length === 0 && (
                                                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                <Link
                                                    href={`/projects/${task.project_id}/member`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="hover:text-primary hover:underline"
                                                >
                                                    {task.project?.name || "—"}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {clientName ? (
                                                    <Link
                                                        href={`/projects/clients?q=${encodeURIComponent(clientName)}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="hover:text-primary hover:underline"
                                                    >
                                                        {clientName}
                                                    </Link>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="inline-flex items-center gap-1 pr-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="px-3">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => {
                                                                setEditingTask(task)
                                                                setEditedTitle(task.name)
                                                                setEditedAssignee(Number(task.assignees?.[0]?.organization_member_id) || "")
                                                                setEditedTeams([])
                                                            }}>
                                                                Edit task
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={async () => {
                                                                const newStatus = task.status === 'done' ? 'todo' : 'done'
                                                                const fd = new FormData()
                                                                fd.append("id", task.id.toString())
                                                                fd.append("status", newStatus)
                                                                const res = await updateTask(fd)
                                                                if (res.success) {
                                                                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
                                                                    toast.success(`Task ${newStatus === 'done' ? 'completed' : 'reopened'}`)
                                                                } else {
                                                                    toast.error(res.message)
                                                                }
                                                            }}>
                                                                {task.status === 'done' ? "Reopen task" : "Mark as complete"}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="px-3"
                                                        onClick={() => setTaskToDelete(task)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <PaginationFooter
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    isLoading={isLoading}
                    from={paginatedTasks.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                    to={Math.min(currentPage * pageSize, filteredTasks.length)}
                    total={filteredTasks.length}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
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
                    <Tabs defaultValue="general" className="space-y-4 py-2">
                        <TabsList className="mb-2">
                            <TabsTrigger value="general">GENERAL</TabsTrigger>
                            <TabsTrigger value="teams">TEAMS</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <div className="space-y-4">
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
                                    <Select value={newTaskAssignee.toString()} onValueChange={(val) => setNewTaskAssignee(Number(val))}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dynamicAssignees.map((member) => {
                                                const name = `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || member.user?.display_name || "Unknown"
                                                return (
                                                    <SelectItem key={member.id} value={member.id.toString()}>
                                                        {name}
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">PROJECT</div>
                                    <Select
                                        value={newTaskProject.toString()}
                                        onValueChange={(val) => setNewTaskProject(Number(val))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projectOptions.map((project) => (
                                                <SelectItem key={project.id} value={project.id.toString()}>
                                                    {project.name}
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
                        </TabsContent>
                        <TabsContent value="teams" className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-semibold text-muted-foreground">TEAMS</div>
                                    <Button variant="link" className="h-auto p-0 text-gray-900 hover:cursor-pointer" onClick={() => setNewTaskTeams(DUMMY_TEAMS.map((t: any) => t.id))}>Select all</Button>
                                </div>
                            </div>
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                <div className="space-y-4">
                                    {DUMMY_TEAMS.map((team: any) => (
                                        <div key={team.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`task-team-${team.id}`}
                                                checked={newTaskTeams.includes(team.id)}
                                                onCheckedChange={(checked: any) => {
                                                    setNewTaskTeams((prev) => {
                                                        const set = new Set(prev)
                                                        if (checked) set.add(team.id); else set.delete(team.id)
                                                        return Array.from(set)
                                                    })
                                                }}
                                            />
                                            <label htmlFor={`task-team-${team.id}`} className="text-sm leading-none">
                                                {team.name} <span className="text-muted-foreground">({team.memberCount} members)</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (newTaskTitle.trim() && newTaskProject) {
                                    const fd = new FormData()
                                    fd.append("name", newTaskTitle)
                                    fd.append("project_id", newTaskProject.toString())
                                    fd.append("status", "todo")
                                    fd.append("priority", "medium")

                                    const res = await createTask(fd)
                                    if (res.success && res.data) {
                                        const createdTask = res.data;
                                        // Assign member if selected
                                        if (newTaskAssignee) {
                                            await assignTaskMember(createdTask.id, Number(newTaskAssignee))
                                        }

                                        // Refetch tasks to get updated list with assignees
                                        const tasksRes = await getTasks();
                                        if (tasksRes.success) setTasks(tasksRes.data);

                                        setNewTaskTitle("")
                                        setNewTaskAssignee("")
                                        setIsNewTaskDialogOpen(false)
                                        toast.success("Task created")
                                    } else {
                                        toast.error(res.message)
                                    }
                                }
                            }}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>



            <Dialog open={Boolean(taskToDelete)} onOpenChange={(open: boolean) => !open && setTaskToDelete(null)}>
                <DialogContent className="max-w-md space-y-6">
                    <DialogHeader>
                        <DialogTitle>Delete task</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Are you sure you want to delete{taskToDelete ? ` "${taskToDelete.name}"` : ""}?
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
                            onClick={async () => {
                                if (taskToDelete) {
                                    const fd = new FormData()
                                    fd.append("id", taskToDelete.id.toString())
                                    const res = await deleteTask(fd)
                                    if (res.success) {
                                        setTasks(tasks.filter(task => task.id !== taskToDelete.id))
                                        toast.success("Task deleted")
                                    } else {
                                        toast.error(res.message)
                                    }
                                }
                                setTaskToDelete(null)
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(editingTask)} onOpenChange={(open: boolean) => !open && setEditingTask(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit task</DialogTitle>
                        <DialogDescription>
                            Update the fields below before saving your changes.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="general" className="space-y-4 py-2">
                        <TabsList className="mb-2">
                            <TabsTrigger value="general">GENERAL</TabsTrigger>
                            <TabsTrigger value="teams">TEAMS</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">TASK*</div>
                                    <Input className="px-4" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">ASSIGNEE</div>
                                    <Select value={editedAssignee.toString()} onValueChange={(value) => setEditedAssignee(Number(value))}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dynamicEditedAssignees.map((member) => {
                                                const name = `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || member.user?.display_name || "Unknown"
                                                return (
                                                    <SelectItem key={member.id} value={member.id.toString()}>
                                                        {name}
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="teams" className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-semibold text-muted-foreground">TEAMS</div>
                                    <Button variant="link" className="h-auto p-0 text-gray-900 hover:cursor-pointer" onClick={() => setEditedTeams(DUMMY_TEAMS.map((t: any) => t.id))}>Select all</Button>
                                </div>
                            </div>
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                <div className="space-y-4">
                                    {DUMMY_TEAMS.map((team: any) => (
                                        <div key={team.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`edit-team-${team.id}`}
                                                checked={editedTeams.includes(team.id)}
                                                onCheckedChange={(checked: any) => {
                                                    setEditedTeams((prev) => {
                                                        const set = new Set(prev)
                                                        if (checked) set.add(team.id); else set.delete(team.id)
                                                        return Array.from(set)
                                                    })
                                                }}
                                            />
                                            <label htmlFor={`edit-team-${team.id}`} className="text-sm leading-none">
                                                {team.name} <span className="text-muted-foreground">({team.memberCount} members)</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTask(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!editingTask) return
                                const fd = new FormData()
                                fd.append("id", editingTask.id.toString())
                                fd.append("name", editedTitle)

                                const res = await updateTask(fd)
                                if (res.success) {
                                    // Update assignee if changed
                                    const currentAssigneeId = editingTask.assignees?.[0]?.organization_member_id
                                    if (editedAssignee && editedAssignee !== currentAssigneeId) {
                                        // Simplification: In a real app we might need to delete old assignee first or use a join table update action
                                        await assignTaskMember(editingTask.id, Number(editedAssignee))
                                    }

                                    const tasksRes = await getTasks();
                                    if (tasksRes.success) setTasks(tasksRes.data);

                                    setEditingTask(null)
                                    toast.success("Task updated")
                                } else {
                                    toast.error(res.message)
                                }
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
