"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { List, LayoutGrid, GanttChart } from "lucide-react"
import { getTasks } from "@/action/task"
import { ITask, ITaskAssignee } from "@/interface"
import { toast } from "sonner"
import { UserAvatar } from "@/components/common/user-avatar"

const COLUMNS = [
    { key: "todo", label: "To Do" },
    { key: "in_progress", label: "In Progress" },
    { key: "review", label: "In Review" },
    { key: "done", label: "Done" },
]


function AssigneeAvatar({ asgn }: { asgn: ITaskAssignee }) {
    const user = asgn.member?.user || (asgn as any).organization_member?.user
    const name = user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || "Unknown"

    return (
        <UserAvatar
            name={name}
            photoUrl={user?.profile_photo_url}
            userId={user?.id}
            size={5}
            className="ring-1 ring-background"
        />
    )
}

const STATUS_COLORS: Record<string, string> = {
    todo: "border-t-zinc-400",
    in_progress: "border-t-blue-500",
    review: "border-t-amber-500",
    done: "border-t-green-500",
}

export default function KanbanPage() {
    const pathname = usePathname()
    const [tasks, setTasks] = useState<ITask[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const viewLinks = [
        { label: "List", href: "/projects/tasks/list", icon: List },
        { label: "Kanban", href: "/projects/tasks/kanban", icon: LayoutGrid },
        { label: "Timeline", href: "/projects/tasks/timeline", icon: GanttChart },
    ]

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const tasksRes = await getTasks()
                if (tasksRes.success) setTasks(tasksRes.data)
            } catch (error) {
                console.error("Error fetching tasks:", error)
                toast.error("Failed to load tasks")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const topLevelTasks = tasks.filter(t => !t.parent_task_id)

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Tasks</h1>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 border rounded-md w-fit p-1">
                {viewLinks.map(({ label, href, icon: Icon }) => {
                    const isActive = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${isActive
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    )
                })}
            </div>

            {/* Kanban Board */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                    Loading tasks...
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
                    {COLUMNS.map(col => {
                        const colTasks = topLevelTasks.filter(t => (t.status || "todo") === col.key)
                        return (
                            <div key={col.key} className="flex flex-col gap-3 min-w-[220px]">
                                {/* Column Header */}
                                <div className={`bg-card border border-t-4 rounded-lg p-3 ${STATUS_COLORS[col.key]}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">{col.label}</span>
                                        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                                            {colTasks.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Task Cards */}
                                <div className="flex flex-col gap-2">
                                    {colTasks.length === 0 ? (
                                        <div className="border border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                                            No tasks
                                        </div>
                                    ) : (
                                        colTasks.map(task => (
                                            <div
                                                key={task.id}
                                                className="bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <p className="text-sm font-medium leading-snug">{task.name}</p>
                                                <div className="flex items-center justify-between mt-3">
                                                    <div>
                                                        {task.project?.name && (
                                                            <p className="text-[10px] text-muted-foreground truncate">{task.project.name}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex -space-x-1.5">
                                                        {(task.assignees as any[])?.slice(0, 3).map((a, i) => (
                                                            <AssigneeAvatar key={i} asgn={a} />
                                                        ))}
                                                        {(task.assignees as any[])?.length > 3 && (
                                                            <div className="h-5 w-5 rounded-full bg-muted text-[8px] grid place-items-center ring-1 ring-background text-muted-foreground">
                                                                +{(task.assignees as any[]).length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
