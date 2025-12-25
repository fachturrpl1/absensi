"use client"

import React from "react"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Group as GroupIcon, Pencil, Trash, Search, RotateCcw, ChevronRight } from "lucide-react"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IGroup } from "@/interface"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteGroup } from "@/action/group"
import {
  createGroup,
  getAllGroups,
  updateGroup,
} from "@/action/group"
import { getAllOrganization } from "@/action/organization"
import { Can } from "@/components/can"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOrgGuard } from "@/hooks/use-org-guard"
import { useHydration } from "@/hooks/useHydration"
import Link from "next/link"

const groupSchema = z.object({
  organization_id: z.string().min(1, "Organization is required"),
  code: z.string().min(2, "min 2 characters"),
  name: z.string().min(2, "min 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type GroupForm = z.infer<typeof groupSchema>

export default function GroupsPage() {
  const { isHydrated, organizationId } = useHydration()
  useOrgGuard()

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingDetail, setEditingDetail] = React.useState<IGroup | null>(null)
  const [groups, setGroups] = React.useState<IGroup[]>([])
  const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortOrder, setSortOrder] = React.useState("newest")

  const filteredAndSortedGroups = React.useMemo(() => {
    let result = [...groups]

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase()
      result = result.filter(
        (group) =>
          (group.code || "").toLowerCase().includes(lowercasedQuery) ||
          (group.name || "").toLowerCase().includes(lowercasedQuery) ||
          (group.description || "").toLowerCase().includes(lowercasedQuery)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((group) =>
        statusFilter === "active" ? group.is_active : !group.is_active
      )
    }

    switch (sortOrder) {
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        break
      case "a-z":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        break
      case "z-a":
        result.sort((a, b) => (b.name || "").localeCompare(a.name || ""))
        break
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
    }

    return result
  }, [groups, searchQuery, statusFilter, sortOrder])

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteGroup(id)
      if (result.success) {
        toast.success("Group deleted successfully")
        fetchGroups()
      } else {
        toast.error(result.message || "Failed to delete group")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const columns: ColumnDef<IGroup>[] = [
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description || "-",
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge className="bg-green-500">Active</Badge>
        ) : (
          <Badge variant="destructive">Inactive</Badge>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setEditingDetail(row.original)
              form.reset({
                organization_id: String(row.original.organization_id),
                code: row.original.code || "",
                name: row.original.name,
                description: row.original.description || "",
                is_active: row.original.is_active ?? true,
              })
              setIsModalOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <Link href={`/group/move?id=${row.original.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Group</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {row.original.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(row.original.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]


  const fetchGroups = React.useCallback(async () => {
    try {
      setLoading(true)
      
      if (!organizationId) {
        toast.error('Please select an organization')
        setLoading(false)
        return
      }
      
      const result = await getAllGroups(organizationId)
      if (!result.success) throw new Error(result.message)
      
      setGroups(result.data)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  const fetchOrganizations = async () => {
    try {
      const response = await getAllOrganization()
      if (!response.success) throw new Error(response.message)
      setOrganizations(response.data)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error')
    }
  }

  React.useEffect(() => {
    fetchOrganizations()
  }, [])

  React.useEffect(() => {
    if (isHydrated && organizationId) {
      console.log('[GROUP-PAGE] Hydration complete, fetching groups')
      fetchGroups()
    }
  }, [isHydrated, organizationId, fetchGroups])

  const form = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      organization_id: "",
      code: "",
      name: "",
      description: "",
      is_active: true,
    },
  })

  // sinkronkan orgId ke form setelah didapat dari store
  React.useEffect(() => {
    if (organizationId && !isModalOpen) {
      form.reset({
        organization_id: String(organizationId),
        code: "",
        name: "",
        description: "",
        is_active: true,
      })
    }
  }, [organizationId, form, isModalOpen])

  const handleSubmit = async (values: GroupForm) => {
    try {
      let res
      if (editingDetail) {
        res = await updateGroup(editingDetail.id, values)
      } else {
        res = await createGroup(values)
      }
      if (!res.success) throw new Error(res.message)
      toast.success(editingDetail ? 'Saved successfully' : 'Group created successfully')
      setIsModalOpen(false)
      setEditingDetail(null)
      fetchGroups()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err instanceof Error ? err.message : 'Unknown error' : 'Unknown error')
    }
  }


  const handleDialogOpenChange = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setEditingDetail(null)
      form.reset({
        organization_id: organizationId ? String(organizationId) : "",
        code: "",
        name: "",
        description: "",
        is_active: true,
      })
    }
  }



  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <div className="w-full">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
          
          <div className="p-4 md:p-6 space-y-4 overflow-x-auto">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3 sm:gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => fetchGroups()} className="whitespace-nowrap">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex gap-3 sm:gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="a-z">A-Z</SelectItem>
                        <SelectItem value="z-a">Z-A</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 sm:gap-2 flex-wrap">
                <Link href="/group/import">
                  <Button
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    Import
                  </Button>
                </Link>
                <Dialog open={isModalOpen} onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingDetail(null)
                        form.reset({
                          organization_id: organizationId ? String(organizationId) : "",
                          code: "",
                          name: "",
                          description: "",
                          is_active: true,
                        })
                        setIsModalOpen(true)
                      }}
                      className="whitespace-nowrap"
                    >
                      Add<Plus className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingDetail ? 'Edit' : 'Add'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                      >
                        {/* Organization field */}
                        {organizationId ? (
                          <FormField
                            control={form.control}
                            name="organization_id"
                            render={({ field }) => (
                              <input
                                type="hidden"
                                value={String(organizationId || "")}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        ) : (
                          <Can permission="view_departments">
                            <FormField
                              control={form.control}
                              name="organization_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Organization</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Organization" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {organizations.map((org) => (
                                        <SelectItem key={org.id} value={String(org.id)}>
                                          {org.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </Can>
                        )}

                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Code</FormLabel>
                              <FormControl>
                                <Input type="text" placeholder="e.g., x_rpl" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input type="text" placeholder="e.g., X RPL" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input type="text" placeholder="e.g., Rekayasa Perangkat Lunak" {...field ?? ""} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="is_active"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Active</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full">
                          {editingDetail ? 'Update' : 'Create'}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <TableSkeleton rows={6} columns={4} />
              ) : groups.length === 0 ? (
                <div className="mt-20">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <GroupIcon className="h-14 w-14 text-muted-foreground mx-auto" />
                      </EmptyMedia>
                      <EmptyTitle>No groups yet</EmptyTitle>
                      <EmptyDescription>
                        There are no groups for this organization. Use the "Add" button to create one.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              ) : (
                <DataTable columns={columns} data={filteredAndSortedGroups} showColumnToggle={false} />
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
