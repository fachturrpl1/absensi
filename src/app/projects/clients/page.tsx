"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Plus, Search } from "lucide-react"
import { AddClientDialog, type ClientFormData } from "@/components/projects/AddClientDialog"
import { ClientsTable, type Client } from "@/components/projects/ClientsTable"
import { DUMMY_CLIENTS } from "@/lib/data/dummy-data"
import { PaginationFooter } from "@/components/pagination-footer"

export default function ClientsPage() {
    const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
    const [searchQuery, setSearchQuery] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Archive confirmation dialog
    const [archiveOpen, setArchiveOpen] = useState(false)
    const [archiveTargets, setArchiveTargets] = useState<string[]>([])
    const [clientToDelete, setClientToDelete] = useState<string | null>(null)

    // Use dummy data from file
    const [clients, setClients] = useState<Client[]>(DUMMY_CLIENTS)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const activeClients = clients.filter((c) => !c.isArchived)
    const archivedClients = clients.filter((c) => c.isArchived)
    const displayedClients = activeTab === "active" ? activeClients : archivedClients

    const filteredClients = searchQuery
        ? displayedClients.filter((c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : displayedClients

    const paginatedClients = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return filteredClients.slice(start, end)
    }, [filteredClients, currentPage, pageSize])

    const totalPages = Math.ceil(filteredClients.length / pageSize) || 1

    const handleAddClient = (formData: ClientFormData) => {
        const newClient: Client = {
            id: Date.now().toString(),
            name: formData.name,
            budget: "Budget: none",
            autoInvoicing: false,
            isArchived: false,
            address: formData.address,
            phone: formData.phone,
            emails: formData.emails ? formData.emails.split(",").map((e) => e.trim()) : [],
        }
        setClients([...clients, newClient])
        setSelectedIds([])
    }

    const handleEditClient = (client: Client) => {
        setEditingClient(client)
        setDialogOpen(true)
    }

    const handleUpdateClient = (formData: ClientFormData) => {
        if (!editingClient) return
        setClients(
            clients.map((c) =>
                c.id === editingClient.id
                    ? {
                        ...c,
                        name: formData.name,
                        address: formData.address,
                        phone: formData.phone,
                        emails: formData.emails ? formData.emails.split(",").map((e) => e.trim()) : [],
                    }
                    : c
            )
        )
        setEditingClient(null)
    }

    const handleArchive = (id: string) => {
        setArchiveTargets([id])
        setArchiveOpen(true)
    }

    const handleRestore = (id: string) => {
        setClients(clients.map((c) => (c.id === id ? { ...c, isArchived: false } : c)))
        setSelectedIds(selectedIds.filter((sid) => sid !== id))
        setActiveTab("active")
    }

    const handleBatchArchive = () => {
        if (selectedIds.length === 0) return
        setArchiveTargets(selectedIds)
        setArchiveOpen(true)
    }

    const handleBatchRestore = () => {
        if (selectedIds.length === 0) return
        setClients(
            clients.map((c) => (selectedIds.includes(c.id) ? { ...c, isArchived: false } : c))
        )
        setSelectedIds([])
        setActiveTab("active")
        setActiveTab("active")
    }

    const handleDelete = (id: string) => {
        setClientToDelete(id)
    }

    const confirmDelete = () => {
        if (clientToDelete) {
            setClients(clients.filter(c => c.id !== clientToDelete))
            setSelectedIds(selectedIds.filter(sid => sid !== clientToDelete))
            setClientToDelete(null)
        }
    }

    const confirmArchive = () => {
        if (archiveTargets.length > 0) {
            setClients(clients.map((c) =>
                archiveTargets.includes(c.id) ? { ...c, isArchived: true } : c
            ))
            setSelectedIds(prev => prev.filter(id => !archiveTargets.includes(id)))
            setActiveTab("archived")
        }
        setArchiveOpen(false)
        setArchiveTargets([])
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Clients</h1>
            </div>

            {/* Custom Tabs - matching Projects page style */}
            <div className="flex items-center gap-6 text-sm">
                <button
                    className={`pb-2 border-b-2 ${activeTab === "active"
                        ? "border-foreground font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    onClick={() => {
                        setActiveTab("active")
                        setSelectedIds([])
                    }}
                >
                    ACTIVE ({activeClients.length})
                </button>
                <button
                    className={`pb-2 border-b-2 ${activeTab === "archived"
                        ? "border-foreground font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    onClick={() => {
                        setActiveTab("archived")
                        setSelectedIds([])
                    }}
                >
                    ARCHIVED ({archivedClients.length})
                </button>
            </div>

            <div>
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between gap-3">
                        {/* Search */}
                        <div className="w-full sm:w-auto min-w-[260px] max-w-[360px] relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search clients"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ps-10 pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <Button
                                    variant="outline"
                                    className="px-3"
                                    onClick={activeTab === "active" ? handleBatchArchive : handleBatchRestore}
                                >
                                    {activeTab === "active" ? "Archive" : "Restore"} ({selectedIds.length})
                                </Button>
                            )}
                            {/* <Button variant="outline" className="px-3 hidden md:inline-flex">
                                Import clients
                            </Button> */}
                            <Button
                                className="px-3"
                                onClick={() => {
                                    setEditingClient(null)
                                    setDialogOpen(true)
                                }}
                            >
                                <Plus />Add
                            </Button>
                        </div>
                    </div>

                    {/* Selected count */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-sm text-muted-foreground">
                                {selectedIds.length} / {filteredClients.length} selected
                            </span>
                        </div>
                    )}

                    <Separator className="my-8" />

                    {/* Table */}
                    <div className="overflow-x-auto w-full mt-4 md:mt-6">
                        <ClientsTable
                            clients={paginatedClients}
                            selectedIds={selectedIds}
                            onSelectClient={(id, selected) => {
                                setSelectedIds(
                                    selected ? [...selectedIds, id] : selectedIds.filter((sid) => sid !== id)
                                )
                            }}
                            onSelectAll={(selected) => {
                                setSelectedIds(selected ? paginatedClients.map((c) => c.id) : [])
                            }}
                            onEdit={handleEditClient}
                            onArchive={handleArchive}
                            onRestore={handleRestore}
                            onDelete={handleDelete}
                        />
                    </div>

                    <PaginationFooter
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={(p) => setCurrentPage(p)}
                        isLoading={false}
                        from={paginatedClients.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                        to={Math.min(currentPage * pageSize, filteredClients.length)}
                        total={filteredClients.length}
                        pageSize={pageSize}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
                    />
                </div>
            </div>

            {/* Add/Edit Client Dialog */}
            <AddClientDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) setEditingClient(null)
                }}
                onSave={editingClient ? handleUpdateClient : handleAddClient}
                initialData={
                    editingClient
                        ? {
                            name: editingClient.name,
                            address: editingClient.address || "",
                            phone: editingClient.phone || "",
                            phoneCountry: "id",
                            emails: editingClient.emails?.join(", ") || "",
                            projects: [],
                            teams: [],
                            // Budget
                            budgetType: "",
                            budgetBasedOn: "",
                            budgetCost: "",
                            budgetNotifyAt: "80",
                            budgetResets: "never",
                            budgetStartDate: "",
                            budgetIncludeNonBillable: false,
                            // Invoicing
                            invoiceNotesCustom: false,
                            invoiceNotes: "",
                            invoiceNetTermsCustom: false,
                            invoiceNetTerms: "30",
                            invoiceTaxRateCustom: false,
                            invoiceTaxRate: "",
                            autoInvoicing: "off",
                            aiAmountBasedOn: "hourly",
                            aiFixedPrice: "",
                            aiFrequency: "monthly",
                            aiDelaySending: "0",
                            aiSendReminder: "0",
                            aiLineItems: "user-project-date",
                            aiIncludeNonBillable: false,
                            aiIncludeExpenses: false
                        }
                        : undefined
                }
            />

            {/* Archive Confirmation Dialog */}
            <Dialog
                open={archiveOpen}
                onOpenChange={(o) => {
                    setArchiveOpen(o)
                    if (!o) setArchiveTargets([])
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {archiveTargets.length <= 1
                                ? "Archive client?"
                                : `Archive ${archiveTargets.length} clients?`}
                        </DialogTitle>
                        <DialogDescription>
                            This will move {archiveTargets.length <= 1 ? "the client" : "the selected clients"} to
                            Archived. You can restore later.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setArchiveOpen(false)
                                setArchiveTargets([])
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmArchive}>
                            Archive
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete client</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this client? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
