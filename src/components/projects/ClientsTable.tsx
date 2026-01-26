"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ClientActionsDropdown } from "./ClientActionsDropdown"
import { getProjectCountByClientId, getTaskCountByClientId } from "@/lib/data/dummy-data"

export interface Client {
    id: string
    name: string
    budget: string
    autoInvoicing: boolean
    isArchived: boolean
    address?: string
    phone?: string
    emails?: string[]
}

interface ClientsTableProps {
    clients: Client[]
    selectedIds: string[]
    onSelectClient: (id: string, selected: boolean) => void
    onSelectAll: (selected: boolean) => void
    onEdit: (client: Client) => void
    onArchive: (id: string) => void
    onRestore: (id: string) => void
}

export function ClientsTable({
    clients,
    selectedIds,
    onSelectClient,
    onSelectAll,
    onEdit,
    onArchive,
    onRestore,
}: ClientsTableProps) {
    const allSelected = clients.length > 0 && selectedIds.length === clients.length

    return (
        <table className="w-full min-w-[880px] table-fixed">
            <colgroup>
                {/* Checkbox */}
                <col className="w-10" />
                {/* Name */}
                <col className="w-48" />
                {/* Projects */}
                <col className="w-24" />
                {/* Tasks */}
                <col className="w-24" />
                {/* Budget */}
                <col className="w-40" />
                {/* Auto Invoicing */}
                <col />
                {/* Actions */}
                <col className="w-24" />
            </colgroup>
                <thead className="border-b bg-muted/50">
                    <tr>
                        <th className="px-4 py-3 text-left">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => onSelectAll(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Projects</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Tasks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Budget</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Auto Invoicing</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Actions</th>
                    </tr>
                </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-muted/40">
                {clients.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                            No clients found
                        </td>
                    </tr>
                ) : (
                    clients.map((client) => {
                        const isSelected = selectedIds.includes(client.id)
                        const initials = client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        const projectCount = getProjectCountByClientId(client.id)
                        const taskCount = getTaskCountByClientId(client.id)

                        return (
                            <tr key={client.id} className="border-b hover:bg-muted/30 transition-colors">
                                <td className="px-4 p-3 align-top">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => onSelectClient(client.id, e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-semibold">{client.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {projectCount} project{projectCount !== 1 ? "s" : ""}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {taskCount} task{taskCount !== 1 ? "s" : ""}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">{client.budget}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {client.autoInvoicing ? "On" : "Off"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <ClientActionsDropdown
                                        isArchived={client.isArchived}
                                        onEdit={() => onEdit(client)}
                                        onArchive={() => onArchive(client.id)}
                                        onRestore={() => onRestore(client.id)}
                                    />
                                </td>
                            </tr>
                        )
                    })
                )}
            </tbody>
        </table>
    )
}

