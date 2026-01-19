"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ClientActionsDropdown } from "./ClientActionsDropdown"

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
                {/* Name: samakan dengan Budget */}
                <col className="w-64" />
                {/* Budget: samakan dengan Name */}
                <col className="w-64" />
                {/* Auto Invoicing: biarkan fleksibel */}
                <col />
                {/* Actions */}
                <col className="w-24" />
            </colgroup>
            <thead className="border-b bg-muted/50">
                <tr>
                    <th className="p-3 text-left">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={(e) => onSelectAll(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                    </th>
                    <th className="p-3 text-left text-xs font-medium">Name</th>
                    <th className="p-3 text-left text-xs font-medium">Budget</th>
                    <th className="p-3 text-left text-xs font-medium">Auto Invoicing</th>
                    <th className="p-3 text-left text-xs font-medium">Actions</th>
                </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-muted/50">
                {clients.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
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

                        return (
                            <tr key={client.id} className="border-b">
                                <td className="p-3 align-top">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => onSelectClient(client.id, e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-purple-600 text-white text-xs">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium truncate">{client.name}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">{client.budget}</td>
                                <td className="p-3 text-sm text-muted-foreground">
                                    {client.autoInvoicing ? "On" : "Off"}
                                </td>
                                <td className="p-3">
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
