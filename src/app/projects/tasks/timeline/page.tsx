"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { List, LayoutGrid, GanttChart, ChevronRight, ChevronDown, Users, AlignLeft, ChevronsDownUp, ChevronsUpDown } from "lucide-react"
import { getTasks } from "@/action/task"
import { ITask } from "@/interface"
import { toast } from "sonner"
import { DateRangePicker } from "@/components/insights/DateRangePicker"
import type { DateRange } from "@/components/insights/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/common/user-avatar"

// ─── Types ──────────────────────────────────────────────────────────────────

type GroupBy = "task" | "assignee"

type TaskNode = ITask & { children: TaskNode[] }

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    todo: "bg-zinc-400",
    in_progress: "bg-blue-500",
    review: "bg-amber-500",
    done: "bg-green-500",
}



// ─── Pure helper functions ───────────────────────────────────────────────────

function startOfDay(d: Date): Date {
    const dt = new Date(d)
    dt.setHours(0, 0, 0, 0)
    return dt
}

function addDays(d: Date, days: number): Date {
    const dt = new Date(d)
    dt.setDate(dt.getDate() + days)
    return dt
}

function getDaysBetween(start: Date, end: Date): number {
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1)
}

function toDateOnly(d: Date): Date {
    return startOfDay(d)
}

/** Build tree from flat task list */
function buildTaskTree(tasks: ITask[]): TaskNode[] {
    const map = new Map<number, TaskNode>()
    tasks.forEach(t => map.set(t.id, { ...t, children: [] }))
    const roots: TaskNode[] = []
    map.forEach(node => {
        if (node.parent_task_id && map.has(node.parent_task_id)) {
            map.get(node.parent_task_id)!.children.push(node)
        } else {
            roots.push(node)
        }
    })
    return roots
}

/** Flatten tree respecting expandedIds */
function flattenTree(nodes: TaskNode[], expandedIds: Set<number>, depth = 0): { node: TaskNode; depth: number; hasChildren: boolean }[] {
    const result: { node: TaskNode; depth: number; hasChildren: boolean }[] = []
    for (const node of nodes) {
        result.push({ node, depth, hasChildren: node.children.length > 0 })
        if (expandedIds.has(node.id) && node.children.length > 0) {
            result.push(...flattenTree(node.children, expandedIds, depth + 1))
        }
    }
    return result
}

/** Get rollup date range for a node (min start, max end across all descendants) */
function getRollupDates(node: TaskNode): { start: Date | null; end: Date | null } {
    const starts: Date[] = []
    const ends: Date[] = []

    const collect = (n: TaskNode) => {
        if (n.created_at) starts.push(startOfDay(new Date(n.created_at)))
        if ((n as any).due_date) ends.push(startOfDay(new Date((n as any).due_date)))
        n.children.forEach(collect)
    }
    collect(node)

    return {
        start: starts.length > 0 ? starts.reduce((a, b) => a < b ? a : b) : null,
        end: ends.length > 0 ? ends.reduce((a, b) => a > b ? a : b) : null,
    }
}

/** Get assignee display info from a task assignee object */
function getAssigneeInfo(assignee: any): { id: string; name: string; photoUrl?: string; userId?: string } {
    const user = assignee?.organization_member?.user || assignee?.member?.user
    if (user) {
        return {
            id: String(assignee.organization_member_id || assignee.id || "unknown"),
            name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown",
            photoUrl: user.profile_photo_url,
            userId: user.id
        }
    }
    return { id: "unassigned", name: "Unassigned" }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AssigneeAvatar({ name, photoUrl, userId, size = 6 }: { name: string; photoUrl?: string; userId?: string; size?: number }) {
    return (
        <UserAvatar
            name={name}
            photoUrl={photoUrl}
            userId={userId}
            size={size}
            className="rounded-full shadow-sm shrink-0"
        />
    )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TimelinePage() {
    const pathname = usePathname()
    const [tasks, setTasks] = useState<ITask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [groupBy, setGroupBy] = useState<GroupBy>("task")
    const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set())
    const [dateRange, setDateRange] = useState<DateRange>(() => ({
        startDate: addDays(startOfDay(new Date()), -7),
        endDate: addDays(startOfDay(new Date()), 13),
    }))

    const viewLinks = [
        { label: "List", href: "/projects/tasks/list", icon: List },
        { label: "Kanban", href: "/projects/tasks/kanban", icon: LayoutGrid },
        { label: "Timeline", href: "/projects/tasks/timeline", icon: GanttChart },
    ]

    // ─── Fetch ──────────────────────────────────────────────────────────────

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

    // ─── Date helpers ────────────────────────────────────────────────────────

    const days = useMemo(() => {
        const total = getDaysBetween(dateRange.startDate, dateRange.endDate)
        return Array.from({ length: total }, (_, i) => addDays(startOfDay(dateRange.startDate), i))
    }, [dateRange.startDate, dateRange.endDate])

    const todayIndex = useMemo(() => {
        const today = startOfDay(new Date()).getTime()
        return days.findIndex(d => d.getTime() === today)
    }, [days])

    // ─── Tree computation ────────────────────────────────────────────────────

    const taskTree = useMemo(() => buildTaskTree(tasks), [tasks])



    const toggleExpand = useCallback((id: number) => {
        setExpandedTaskIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const expandAll = useCallback(() => {
        setExpandedTaskIds(new Set(tasks.filter(t => !t.parent_task_id).map(t => t.id)))
    }, [tasks])

    const collapseAll = useCallback(() => {
        setExpandedTaskIds(new Set())
    }, [])

    // ─── Row computation (Task View) ─────────────────────────────────────────

    const taskViewRows = useMemo(() => {
        return flattenTree(taskTree, expandedTaskIds)
    }, [taskTree, expandedTaskIds])

    // ─── Row computation (Assignee View) ─────────────────────────────────────

    const assigneeViewRows = useMemo(() => {
        // Flatten all tasks (including subtasks) and expand them per assignee
        const list: { assigneeId: string; name: string; photoUrl?: string; userId?: string; task: ITask; parentName?: string }[] = []

        const processTask = (task: ITask, parentName?: string) => {
            const taskAsNode = task as TaskNode
            const assignees: any[] = (task.assignees as any[]) || []
            if (assignees.length > 0) {
                assignees.forEach((a: any) => {
                    const info = getAssigneeInfo(a)
                    list.push({ assigneeId: info.id, name: info.name, photoUrl: info.photoUrl, userId: info.userId, task, parentName })
                })
            } else {
                list.push({ assigneeId: "unassigned", name: "Unassigned", task, parentName })
            }
            // Also process children
            if (taskAsNode.children) taskAsNode.children.forEach(c => processTask(c, task.name))
        }

        taskTree.forEach(root => processTask(root))

        // Sort by assignee name (Unassigned last)
        list.sort((a, b) => {
            if (a.assigneeId === "unassigned" && b.assigneeId !== "unassigned") return 1
            if (b.assigneeId === "unassigned" && a.assigneeId !== "unassigned") return -1
            return a.name.localeCompare(b.name) || a.assigneeId.localeCompare(b.assigneeId)
        })

        // Mark group starts/ends
        return list.map((item, index) => ({
            ...item,
            isFirst: index === 0 || list[index - 1]?.assigneeId !== item.assigneeId,
            isLast: index === list.length - 1 || list[index + 1]?.assigneeId !== item.assigneeId,
        }))
    }, [taskTree])

    // Calculate rowSpan for each assignee group start
    const assigneeRowSpans = useMemo(() => {
        const spans: Record<number, number> = {}
        let i = 0
        while (i < assigneeViewRows.length) {
            if (assigneeViewRows[i]!.isFirst) {
                let span = 1
                for (let j = i + 1; j < assigneeViewRows.length; j++) {
                    if (assigneeViewRows[j]!.assigneeId === assigneeViewRows[i]!.assigneeId) span++
                    else break
                }
                spans[i] = span
            }
            i++
        }
        return spans
    }, [assigneeViewRows])

    // ─── Bar helpers ─────────────────────────────────────────────────────────

    const getBarCols = useCallback((barStart: Date | null, barEnd: Date | null, totalCols: number, colOffset: number) => {
        const timelineStart = days[0]!
        const timelineEnd = days[days.length - 1]!

        if (!barStart || !barEnd) return null
        const bs = toDateOnly(barStart)
        const be = toDateOnly(barEnd)

        if (be < timelineStart || bs > timelineEnd) return null

        let startCol = colOffset
        let endCol = totalCols + colOffset

        if (bs > timelineStart) {
            startCol = colOffset + Math.round((bs.getTime() - timelineStart.getTime()) / 86400000)
        }
        if (be < timelineEnd) {
            endCol = colOffset + Math.round((be.getTime() - timelineStart.getTime()) / 86400000) + 1
        }
        startCol = Math.max(colOffset, Math.min(startCol, totalCols + colOffset))
        endCol = Math.max(startCol + 1, Math.min(endCol, totalCols + colOffset))
        return { startCol, endCol }
    }, [days])

    // ─── Render helpers ───────────────────────────────────────────────────────

    const renderDayCells = (rowIndex: number, borderBottom: boolean, colOffset: number) =>
        days.map((d, ci) => {
            const isToday = d.getTime() === startOfDay(new Date()).getTime()
            return (
                <div
                    key={d.toISOString()}
                    className={[
                        "border-r",
                        borderBottom ? "border-b" : "",
                        isToday ? "bg-blue-50/20 dark:bg-blue-950/20" : "",
                        "hover:bg-muted/20 transition-colors relative",
                    ].join(" ")}
                    style={{ gridRow: rowIndex + 2, gridColumn: ci + colOffset }}
                />
            )
        })

    const renderTodayLine = (_rowIndex: number, colOffset: number, totalRows: number) => {
        if (todayIndex < 0) return null
        const gridCol = todayIndex + colOffset
        return (
            <div
                key="today-line"
                className="pointer-events-none z-20"
                style={{
                    gridRow: `2 / ${totalRows + 2}`,
                    gridColumn: gridCol,
                    borderLeft: "2px solid #3b82f6",
                    opacity: 0.5,
                }}
            />
        )
    }

    // ─── TASK VIEW ────────────────────────────────────────────────────────────

    const renderTaskView = () => {
        const TASK_COL_OFFSET = 2 // column 1 = tasks sticky
        const rows = taskViewRows
        const numCols = days.length

        return (
            <div className="grid" style={{ gridTemplateColumns: `280px repeat(${numCols}, minmax(72px, 1fr))` }}>
                {/* Header row */}
                <div className="sticky left-0 top-0 z-30 bg-background border-b border-r px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center">
                    Tasks
                </div>
                {days.map((d) => {
                    const isToday = d.getTime() === startOfDay(new Date()).getTime()
                    return (
                        <div
                            key={d.toISOString()}
                            className={`sticky top-0 z-10 border-b border-r px-2 py-2 text-center ${isToday ? "bg-blue-50/30 dark:bg-blue-950/30" : "bg-background"}`}
                        >
                            <div className={`text-[10px] font-medium uppercase ${isToday ? "text-blue-600" : "text-muted-foreground"}`}>
                                {d.toLocaleDateString(undefined, { weekday: "short" })}
                            </div>
                            <div className={`text-xl font-bold tabular-nums leading-tight ${isToday ? "text-blue-600" : ""}`}>
                                {d.getDate()}
                            </div>
                            <div className={`text-[10px] ${isToday ? "text-blue-500" : "text-muted-foreground/60"}`}>
                                {d.toLocaleDateString(undefined, { month: "short" })}
                            </div>
                        </div>
                    )
                })}

                {/* Today line spanning all data rows */}
                {rows.length > 0 && renderTodayLine(0, TASK_COL_OFFSET, rows.length)}

                {/* Loading / Empty */}
                {isLoading && (
                    <div style={{ gridColumn: "1 / -1", gridRow: 2 }} className="border-b p-6 text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading tasks...
                    </div>
                )}
                {!isLoading && rows.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", gridRow: 2 }} className="border-b p-10 text-center text-sm text-muted-foreground">
                        No tasks found.
                    </div>
                )}

                {/* Data rows */}
                {!isLoading && rows.map(({ node, depth, hasChildren }, rowIndex) => {
                    const isExpanded = expandedTaskIds.has(node.id)
                    const isParent = hasChildren
                    const hasDueDate = !!(node as any).due_date

                    let barStart: Date | null = node.created_at ? startOfDay(new Date(node.created_at)) : null
                    let barEnd: Date | null = hasDueDate ? startOfDay(new Date((node as any).due_date)) : null

                    // For parent tasks: rollup from children
                    if (isParent) {
                        const rollup = getRollupDates(node)
                        barStart = rollup.start
                        barEnd = rollup.end
                    }

                    const barCols = getBarCols(barStart, barEnd, numCols, TASK_COL_OFFSET)

                    const assignees: any[] = (node.assignees as any[]) || []

                    return (
                        <React.Fragment key={node.id}>
                            {/* Left sticky task cell */}
                            <div
                                className="sticky left-0 z-10 bg-background border-b border-r px-3 py-2 flex items-center gap-1 min-w-0"
                                style={{ gridRow: rowIndex + 2, gridColumn: 1, paddingLeft: `${12 + depth * 20}px` }}
                            >
                                {hasChildren ? (
                                    <button
                                        onClick={() => toggleExpand(node.id)}
                                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label={isExpanded ? "Collapse" : "Expand"}
                                    >
                                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                    </button>
                                ) : (
                                    <span className="w-3.5 h-3.5 shrink-0 block" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm truncate ${isParent ? "font-semibold" : "font-medium"}`}>{node.name}</div>
                                    {node.project?.name && (
                                        <div className="text-[10px] text-muted-foreground truncate">{node.project.name}</div>
                                    )}
                                </div>
                                {/* Assignee avatars */}
                                {assignees.length > 0 && (
                                    <div className="flex -space-x-1 shrink-0 ml-1">
                                        {assignees.slice(0, 2).map((a: any, i: number) => {
                                            const info = getAssigneeInfo(a)
                                            return <AssigneeAvatar key={i} name={info.name} photoUrl={info.photoUrl} userId={info.userId} size={5} />
                                        })}
                                        {assignees.length > 2 && (
                                            <div className="w-5 h-5 rounded-full bg-muted border text-[9px] flex items-center justify-center text-muted-foreground">
                                                +{assignees.length - 2}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Day background cells */}
                            {renderDayCells(rowIndex, true, TASK_COL_OFFSET)}

                            {/* Bar */}
                            {barCols && (
                                <div
                                    className="flex items-center px-0.5 z-10 pointer-events-none py-1.5"
                                    style={{ gridRow: rowIndex + 2, gridColumn: `${barCols.startCol} / ${barCols.endCol}` }}
                                >
                                    {isParent ? (
                                        // Parent rollup bar: dark, diamond tips, thinner
                                        <div className="relative w-full flex items-center h-4">
                                            <div className="w-full h-full bg-zinc-700 dark:bg-zinc-300 rounded-sm opacity-80" />
                                            {/* Diamond caps */}
                                            <div className="absolute left-0 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-zinc-700 dark:border-t-zinc-300 opacity-80" />
                                            <div className="absolute right-0 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-zinc-700 dark:border-t-zinc-300 opacity-80" />
                                        </div>
                                    ) : (
                                        // Regular / Subtask bar
                                        <div className={`w-full rounded-md px-2 flex items-center shadow-sm text-[10px] font-medium text-white ${STATUS_COLORS[node.status || "todo"]} ${depth > 0 ? "h-5 opacity-80" : "h-7"}`}>
                                            <span className="truncate">{node.name}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        )
    }

    // ─── ASSIGNEE VIEW ──────────────────────────────────────────────────────

    const renderAssigneeView = () => {
        const ASSIGNEE_COL = 1
        const TASK_COL = 2
        const DAY_OFFSET = 3
        const numCols = days.length
        const rows = assigneeViewRows

        return (
            <div className="grid" style={{ gridTemplateColumns: `180px 260px repeat(${numCols}, minmax(72px, 1fr))` }}>
                {/* Header */}
                <div className="sticky left-0 top-0 z-30 bg-background border-b border-r px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center">
                    Assignee
                </div>
                <div className="sticky left-[180px] top-0 z-30 bg-background border-b border-r px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center">
                    Task
                </div>
                {days.map((d) => {
                    const isToday = d.getTime() === startOfDay(new Date()).getTime()
                    return (
                        <div
                            key={d.toISOString()}
                            className={`sticky top-0 z-10 border-b border-r px-2 py-2 text-center ${isToday ? "bg-blue-50/30 dark:bg-blue-950/30" : "bg-background"}`}
                        >
                            <div className={`text-[10px] font-medium uppercase ${isToday ? "text-blue-600" : "text-muted-foreground"}`}>
                                {d.toLocaleDateString(undefined, { weekday: "short" })}
                            </div>
                            <div className={`text-xl font-bold tabular-nums leading-tight ${isToday ? "text-blue-600" : ""}`}>
                                {d.getDate()}
                            </div>
                            <div className={`text-[10px] ${isToday ? "text-blue-500" : "text-muted-foreground/60"}`}>
                                {d.toLocaleDateString(undefined, { month: "short" })}
                            </div>
                        </div>
                    )
                })}

                {/* Today line */}
                {rows.length > 0 && renderTodayLine(0, DAY_OFFSET, rows.length)}

                {/* Empty / Loading */}
                {isLoading && (
                    <div style={{ gridColumn: "1 / -1", gridRow: 2 }} className="border-b p-6 text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading tasks...
                    </div>
                )}
                {!isLoading && rows.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", gridRow: 2 }} className="border-b p-10 text-center text-sm text-muted-foreground">
                        No tasks found.
                    </div>
                )}

                {/* Data rows */}
                {!isLoading && rows.map((row, rowIndex) => {
                    const { task, isFirst, isLast, parentName } = row
                    const borderBottom = isLast ? "border-b" : ""

                    const hasDueDate = !!(task as any).due_date
                    const barStart = task.created_at ? startOfDay(new Date(task.created_at)) : null
                    const barEnd = hasDueDate ? startOfDay(new Date((task as any).due_date)) : null
                    const barCols = getBarCols(barStart, barEnd, numCols, DAY_OFFSET)

                    const rowSpan = assigneeRowSpans[rowIndex]

                    return (
                        <React.Fragment key={`${task.id}-${row.assigneeId}-${rowIndex}`}>
                            {/* Assignee spanning cell */}
                            {isFirst && (
                                <div
                                    className="sticky left-0 z-20 bg-background border-r border-b px-3 py-3 flex flex-col justify-start pt-4 gap-2"
                                    style={{ gridRow: `${rowIndex + 2} / span ${rowSpan}`, gridColumn: ASSIGNEE_COL }}
                                >
                                    <div className="flex items-center gap-2">
                                        <AssigneeAvatar name={row.name} photoUrl={row.photoUrl} userId={row.userId} size={6} />
                                        <span className="text-sm font-semibold truncate">{row.name}</span>
                                    </div>
                                </div>
                            )}

                            {/* Task cell */}
                            <div
                                className={`sticky left-[180px] z-10 bg-background border-r px-3 py-2 flex flex-col justify-center ${borderBottom}`}
                                style={{ gridRow: rowIndex + 2, gridColumn: TASK_COL }}
                            >
                                {parentName && (
                                    <div className="text-[10px] text-muted-foreground truncate mb-0.5">
                                        {parentName} <span className="text-muted-foreground/50">›</span>
                                    </div>
                                )}
                                <span className="text-xs font-medium truncate">{task.name}</span>
                                {task.project?.name && (
                                    <span className="text-[10px] text-muted-foreground truncate">{task.project.name}</span>
                                )}
                            </div>

                            {/* Day cells */}
                            {days.map((d, ci) => {
                                const isToday = d.getTime() === startOfDay(new Date()).getTime()
                                return (
                                    <div
                                        key={d.toISOString()}
                                        className={`border-r ${borderBottom} ${isToday ? "bg-blue-50/20" : ""} hover:bg-muted/20 transition-colors`}
                                        style={{ gridRow: rowIndex + 2, gridColumn: ci + DAY_OFFSET }}
                                    />
                                )
                            })}

                            {/* Task bar */}
                            {barCols && (
                                <div
                                    className="flex items-center px-0.5 z-10 pointer-events-none py-2"
                                    style={{ gridRow: rowIndex + 2, gridColumn: `${barCols.startCol} / ${barCols.endCol}` }}
                                >
                                    <div className={`w-full h-6 rounded-md px-2 flex items-center shadow-sm text-[10px] font-medium text-white ${STATUS_COLORS[task.status || "todo"]}`}>
                                        <span className="truncate">{task.name}</span>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        )
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-4 p-4 pt-0 w-full h-full">
            {/* Page Header */}
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

            <Card className="h-full border-0 shadow-none">
                <CardContent className="p-0">
                    <div className="w-full">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-2 pb-4">
                            {/* DateRangePicker */}
                            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

                            {/* Divider */}
                            <div className="h-6 w-px bg-border mx-1" />

                            {/* Group By Toggle */}
                            <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
                                <button
                                    onClick={() => setGroupBy("task")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${groupBy === "task"
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <AlignLeft className="h-3.5 w-3.5" />
                                    Task
                                </button>
                                <button
                                    onClick={() => setGroupBy("assignee")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${groupBy === "assignee"
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    Assignee
                                </button>
                            </div>

                            {/* Expand / Collapse All (only in Task view) */}
                            {groupBy === "task" && (
                                <>
                                    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={expandAll}>
                                        <ChevronsUpDown className="h-3.5 w-3.5" />
                                        Expand All
                                    </Button>
                                    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={collapseAll}>
                                        <ChevronsDownUp className="h-3.5 w-3.5" />
                                        Collapse All
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Grid */}
                        <div className="w-full max-h-[calc(100vh-260px)] overflow-auto border rounded-lg">
                            <div className="min-w-max">
                                {groupBy === "task" ? renderTaskView() : renderAssigneeView()}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
