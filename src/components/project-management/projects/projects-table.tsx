"use client"

import React from "react"
import Link from "next/link"
import { Lock, CalendarClock, Pencil, Users, User } from "lucide-react"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip"
import { ProjectRow } from "@/app/projects/page"
import { useOrgDateFormat, isDateInFuture } from "@/hooks/organization/settings/use-org-date-format"

// ─── Priority Badge ───────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }: { priority: string | null }) => {
  const colors: Record<string, string> = {
    high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  }
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${priority ? colors[priority] : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"}`}>
      {priority || "None"}
    </span>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50 " +
      "dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
  },
  on_hold: {
    label: "On Hold",
    className:
      "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50 " +
      "dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
  },
  completed: {
    label: "Completed",
    className:
      "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50 " +
      "dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
  },
  archived: {
    label: "Archived",
    className:
      "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 " +
      "dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
  },
}

const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    className:
      "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 " +
      "dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
  }
  return (
    <Badge variant="outline" className={`font-medium capitalize ${config.className}`}>
      {config.label}
    </Badge>
  )
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────
const SortIcon = ({ field, current, dir }: { field: string; current: string; dir: string }) => {
  if (field !== current) return null
  return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface TableProjectsProps {
  isLoading: boolean
  fetchError: string | null
  data: ProjectRow[]
  selectedIds: string[]
  allSelected: boolean
  isAdmin: boolean
  sortField: string
  sortDir: string
  activeFilterCount: number
  onSort: (field: string) => void
  onToggleSelectAll: () => void
  onToggleSelect: (id: string) => void
  onClearFilters: () => void
  onRowClick: (p: ProjectRow) => void
  onEdit: (p: ProjectRow, tab: "general" | "members" | "budget" | "teams") => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (p: ProjectRow) => void
  onTransfer: (p: ProjectRow) => void
}

export function ProjectsTable(props: TableProjectsProps) {
  const {
    isLoading, fetchError, data, selectedIds, allSelected,
    isAdmin, sortField, sortDir, activeFilterCount,
    onSort, onToggleSelectAll, onToggleSelect, onClearFilters, onRowClick,
    onEdit, onArchive, onRestore, onDelete, onTransfer,
  } = props

  const { formatDate } = useOrgDateFormat()

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1200px]">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="rounded border-gray-300"
              />
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground"
                onClick={() => onSort("name")}
              >
                Name <SortIcon field="name" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wide">Description</span>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground"
                onClick={() => onSort("priority")}
              >
                Priority <SortIcon field="priority" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground"
                onClick={() => onSort("lifecycleStatus")}
              >
                Status <SortIcon field="lifecycleStatus" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wide">Billable</span>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground"
                onClick={() => onSort("budgetAmount")}
              >
                Budget <SortIcon field="budgetAmount" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground"
                onClick={() => onSort("startDate")}
              >
                Start Date <SortIcon field="startDate" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground"
                onClick={() => onSort("endDate")}
              >
                End Date <SortIcon field="endDate" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wide">Client</span>
            </TableHead>
            {/* ── Kolom baru ── */}
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wide">Teams</span>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wide">Members</span>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-foreground"
                onClick={() => onSort("createdAt")}
              >
                Created At <SortIcon field="createdAt" current={sortField} dir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="w-16">
              <span className="text-xs font-medium uppercase tracking-wide">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              {/* colSpan naik dari 12 → 14 karena +2 kolom */}
              <TableCell colSpan={14} className="text-center text-muted-foreground py-16">
                {fetchError ? (
                  <div className="text-destructive font-medium">Error: {fetchError}</div>
                ) : isLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm">Loading projects...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-medium">No projects found</span>
                    {activeFilterCount > 0 && (
                      <button
                        className="text-xs text-primary underline underline-offset-4"
                        onClick={onClearFilters}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map(p => {
              const notStarted = isDateInFuture(p.startDate)
              const readOnly   = notStarted && !isAdmin

              return (
                <TableRow
                  key={p.id}
                  className={`transition-colors ${
                    readOnly
                      ? "opacity-60 cursor-not-allowed bg-muted/20"
                      : "cursor-pointer hover:bg-muted/40"
                  }`}
                  onClick={() => onRowClick(p)}
                >
                  {/* Checkbox */}
                  <TableCell onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => onToggleSelect(p.id)}
                      className="rounded border-gray-300"
                      disabled={readOnly}
                    />
                  </TableCell>

                  {/* Name */}
                  <TableCell className="max-w-[180px]">
                    <div className="flex items-center gap-1.5">
                      {readOnly ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-medium text-sm truncate block text-muted-foreground">
                              {p.name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-1.5">
                            <Lock className="h-3 w-3" />
                            <span>Project starts on {formatDate(p.startDate)}</span>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link
                          href={`/projects/${p.id}/tasks/list`}
                          className="font-medium text-sm hover:underline truncate block"
                          onClick={e => e.stopPropagation()}
                        >
                          {p.name}
                        </Link>
                      )}
                      {notStarted && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Badge
                                variant="outline"
                                className="text-[10px] gap-1 border-orange-300 text-orange-600 bg-orange-50 shrink-0"
                              >
                                <CalendarClock className="h-3 w-3" />
                                Not started
                              </Badge>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Starts {formatDate(p.startDate)}
                            {isAdmin && " · You can access as admin"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>

                  {/* Description */}
                  <TableCell className="max-w-[200px]">
                    {p.description ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-muted-foreground truncate block cursor-pointer">
                            {p.description}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm whitespace-pre-wrap">
                          {p.description}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-sm text-muted-foreground italic opacity-40 truncate block">
                        No description
                      </span>
                    )}
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <PriorityBadge priority={p.priority} />
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusBadge status={p.lifecycleStatus} />
                  </TableCell>

                  {/* Billable */}
                  <TableCell>
                    <span className={`text-xs font-medium ${p.isBillable ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {p.isBillable ? "Billable" : "Non-billable"}
                    </span>
                  </TableCell>

                  {/* Budget */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground font-mono">{p.budgetLabel}</span>
                  </TableCell>

                  {/* Start Date */}
                  <TableCell>
                    <span className={`text-sm ${notStarted ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                      {formatDate(p.startDate)}
                    </span>
                  </TableCell>

                  {/* End Date */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(p.endDate)}
                    </span>
                  </TableCell>

                  {/* Client */}
                  <TableCell className="max-w-[150px]">
                    {p.clientName !== "-" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-muted-foreground truncate block cursor-pointer">
                            {p.clientName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          {p.clientName}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-sm text-muted-foreground italic opacity-40 truncate block">
                        -
                      </span>
                    )}
                  </TableCell>

                  {/* ── Teams ── */}
                  <TableCell
                    onClick={e => e.stopPropagation()}
                    className="cursor-default"
                  >
                    {p.teamCount === 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground opacity-50">
                        <Users className="h-3 w-3" />
                        0
                      </span>
                    ) : (
                      <Link
                        href={`/teams?project=${p.id}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        <Users className="h-3 w-3" />
                        {p.teamCount}
                      </Link>
                    )}
                  </TableCell>

                  {/* ── Direct Members ── */}
                  <TableCell
                    onClick={e => e.stopPropagation()}
                    className="cursor-default"
                  >
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(p, "members") }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
                      disabled={readOnly}
                    >
                      <User className="h-3 w-3" />
                      {p.directMembersCount}
                    </button>
                  </TableCell>

                  {/* Created At */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={readOnly}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {!p.isArchived ? (
                          <>
                            <DropdownMenuItem onSelect={() => onEdit(p, "general")}>Edit project</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEdit(p, "members")}>Manage members</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEdit(p, "teams")}>Manage teams</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEdit(p, "budget")}>Edit budget</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => onArchive(p.id)}>Archive project</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onTransfer(p)}>Transfer</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => onDelete(p)}
                            >
                              Delete project
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem disabled>Edit project</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEdit(p, "members")}>Manage members</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEdit(p, "teams")}>Manage teams</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onRestore(p.id)}>Restore project</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => onDelete(p)}
                            >
                              Delete project
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}