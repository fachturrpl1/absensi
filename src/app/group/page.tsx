"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Plus, Group as GroupIcon } from "lucide-react"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
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
import {
  createGroup,
  deleteGroup,
  getAllGroups,
  updateGroup,
} from "@/action/group"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAllOrganization } from "@/action/organization"
import { createClient } from "@/utils/supabase/client"
import { Can } from "@/components/can"

const groupSchema = z.object({
  organization_id: z.string().min(1, "Organization is required"),
  code: z.string().min(2, "min 2 characters"),
  name: z.string().min(2, "min 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type GroupForm = z.infer<typeof groupSchema>

export default function GroupsPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingDetail, setEditingDetail] = React.useState<IGroup | null>(null)
  const [groups, setGroups] = React.useState<IGroup[]>([])
  const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [organizationId, setOrganizationId] = React.useState<string>("")
  const supabase = createClient()

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const response = await getAllGroups()
      if (!response.success) throw new Error(response.message)
      
      // Filter by organization if user has one
      const filteredGroups = organizationId 
        ? response.data.filter((g: IGroup) => String(g.organization_id) === organizationId)
        : response.data
      
      setGroups(filteredGroups)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await getAllOrganization()
      if (!response.success) throw new Error(response.message)
      setOrganizations(response.data)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error')
    }
  }

  const fetchOrganizationId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)

      if (error) throw error
      if (data && data.length > 0 && data[0]?.organization_id) {
        setOrganizationId(String(data[0].organization_id))
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error')
    }
  }

  React.useEffect(() => {
    fetchOrganizationId()
    fetchOrganizations()
  }, [])

  React.useEffect(() => {
    if (organizationId) {
      fetchGroups()
    }
  }, [organizationId])

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

  // sinkronkan orgId ke form setelah didapat dari supabase
  React.useEffect(() => {
    if (organizationId && !isModalOpen) {
      form.reset({
        organization_id: organizationId,
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

  const handleDelete = async (scheduleId: string | number) => {
    try {
      setLoading(true)
      const response = await deleteGroup(scheduleId)
      if (!response.success) throw new Error(response.message)
      toast.success('Group deleted successfully')
      fetchGroups()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setEditingDetail(null)
      form.reset({
        organization_id: organizationId || "",
        code: "",
        name: "",
        description: "",
        is_active: true,
      })
    }
  }

  // --- definisi kolom ---
  const columns: ColumnDef<IGroup>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "description", header: "Description" },
    {
      id: "actions",
      header: 'Actions',
      cell: ({ row }) => {
        const ws = row.original
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-0 cursor-pointer"
              onClick={() => {
                setEditingDetail(ws)
                form.reset(ws)
                setIsModalOpen(true)
              }}
            >
              <Pencil />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 border-0 cursor-pointer"
                >
                  <Trash />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this group? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await handleDelete(ws.id)
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="items-center my-7">
          <Dialog open={isModalOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild className="float-end ml-5">
              <Button
                onClick={() => {
                  setEditingDetail(null)
                  form.reset({
                    organization_id: organizationId || "",
                    code: "",
                    name: "",
                    description: "",
                    is_active: true,
                  })
                  setIsModalOpen(true)
                }}
              >
                Add Group <Plus className="ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>
                  {editingDetail ? 'Edit Group' : 'Add Group'}
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
                          value={organizationId}
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
                          <Input type="text" {...field} />
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
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} />
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
                          <Input type="text" {...field ?? ""} />
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
                  There are no groups for this organization. Use the "Add Group" button to create one.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setIsModalOpen(true)}>Add Group</Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <DataTable columns={columns} data={groups} />
        )}
      </div>
    </div>
  )
}
