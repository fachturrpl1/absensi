"use client"

import React from "react"
import { GroupsTable } from "@/components/groups-table"
import { Button } from "@/components/ui/button"
import { Plus, Group as GroupIcon } from "lucide-react"
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
import {
  createGroup,
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
import { Can } from "@/components/can"
import { useOrgStore } from "@/store/org-store"
import { useOrgGuard } from "@/hooks/use-org-guard"

const groupSchema = z.object({
  organization_id: z.string().min(1, "Organization is required"),
  code: z.string().min(2, "min 2 characters"),
  name: z.string().min(2, "min 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type GroupForm = z.infer<typeof groupSchema>

export default function GroupsPage() {
  const orgStore = useOrgStore()
  useOrgGuard()
  
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingDetail, setEditingDetail] = React.useState<IGroup | null>(null)
  const [groups, setGroups] = React.useState<IGroup[]>([])
  const [organizations, setOrganizations] = React.useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)

  const fetchGroups = async () => {
    try {
      setLoading(true)
      
      if (!orgStore.organizationId) {
        toast.error('Please select an organization')
        setLoading(false)
        return
      }
      
      const response = await getAllGroups(orgStore.organizationId)
      if (!response.success) throw new Error(response.message)
      
      setGroups(response.data)
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

  React.useEffect(() => {
    fetchOrganizations()
  }, [])

  React.useEffect(() => {
    if (orgStore.organizationId) {
      fetchGroups()
    }
  }, [orgStore.organizationId])

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
    if (orgStore.organizationId && !isModalOpen) {
      form.reset({
        organization_id: String(orgStore.organizationId),
        code: "",
        name: "",
        description: "",
        is_active: true,
      })
    }
  }, [orgStore.organizationId, form, isModalOpen])

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
        organization_id: orgStore.organizationId ? String(orgStore.organizationId) : "",
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
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex gap-3 sm:gap-2 flex-wrap">
                <Dialog open={isModalOpen} onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingDetail(null)
                        form.reset({
                          organization_id: orgStore.organizationId ? String(orgStore.organizationId) : "",
                          code: "",
                          name: "",
                          description: "",
                          is_active: true,
                        })
                        setIsModalOpen(true)
                      }}
                      className="whitespace-nowrap"
                    >
                      Add Group <Plus className="ml-2 h-4 w-4" />
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
                        {orgStore.organizationId ? (
                          <FormField
                            control={form.control}
                            name="organization_id"
                            render={({ field }) => (
                              <input
                                type="hidden"
                                value={String(orgStore.organizationId || "")}
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
                        There are no groups for this organization. Use the "Add Group" button to create one.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              ) : (
                <GroupsTable 
                  groups={groups}
                  isLoading={loading}
                  onDelete={fetchGroups}
                  onEdit={(group) => {
                    setEditingDetail(group)
                    form.reset(group)
                    setIsModalOpen(true)
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
