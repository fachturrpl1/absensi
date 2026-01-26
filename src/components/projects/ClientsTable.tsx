"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ClientActionsDropdown } from "./ClientActionsDropdown"
import { getProjectCountByClientId, getTaskCountByClientId } from "@/lib/data/dummy-data"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

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
    onDelete: (id: string) => void
}

export function ClientsTable({
    clients,
    selectedIds,
    onSelectClient,
    onSelectAll,
    onEdit,
    onArchive,
    onRestore,
    onDelete,
}: ClientsTableProps) {
    const allSelected = clients.length > 0 && selectedIds.length === clients.length

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={(e) => onSelectAll(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Auto Invoicing</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {clients.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            No clients found
                        </TableCell>
                    </TableRow>
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
                            <TableRow key={client.id}>
                                <TableCell className="align-top">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => onSelectClient(client.id, e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-gray-100 text-gray-700">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <span className="font-medium text-sm block truncate">{client.name}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {projectCount} project{projectCount !== 1 ? "s" : ""}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {taskCount} task{taskCount !== 1 ? "s" : ""}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {client.autoInvoicing ? "On" : "Off"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <ClientActionsDropdown
                                        isArchived={client.isArchived}
                                        onEdit={() => onEdit(client)}
                                        onArchive={() => onArchive(client.id)}
                                        onRestore={() => onRestore(client.id)}
                                        onDelete={() => onDelete(client.id)}
                                    />
                                </TableCell>
                            </TableRow>
                        )
                    })
                )}
            </TableBody>
        </Table>
    )
}

