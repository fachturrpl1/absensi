"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { DataTable } from "@/components/data-table-move"
import { ColumnDef, useReactTable, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { PlusCircle, Search, RotateCcw } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useSearchParams } from 'next/navigation'
import { getGroupById, getAllGroups, createGroup } from '@/action/group'
import { getMembersByGroupId, moveMembersToGroup } from '@/action/members'
import { IGroup, IOrganization_member } from '@/interface'
import { toast } from 'sonner'

const createGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean(),
})

export default function MoveGroupPage() {
  const searchParams = useSearchParams()
  const groupId = searchParams.get('id')

  const [group, setGroup] = useState<IGroup | null>(null)
  const [members, setMembers] = useState<IOrganization_member[]>([])   
  const [loading, setLoading] = useState(true)
  const [allGroups, setAllGroups] = useState<IGroup[]>([])
  const [targetGroupId, setTargetGroupId] = useState<string>("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState("newest")

  const form = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      is_active: true,
    },
  })

  // Helper function to refresh group list
  const refreshGroupList = React.useCallback(async (orgId: string | number) => {
    try {
      const allGroupsRes = await getAllGroups(Number(orgId));
      if (allGroupsRes.success && allGroupsRes.data) {
        const destinationGroups = allGroupsRes.data.filter((g: IGroup) => g.id !== groupId);
        setAllGroups(destinationGroups);
        if (destinationGroups.length === 0) {
          toast.info("No other groups available to move to.");
        }
      }
    } catch (error) {
      console.error('Failed to refresh group list:', error);
    }
  }, [groupId]);

  const fetchData = React.useCallback(async () => {
      if (!groupId) {
        toast.error('Group ID is missing')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const groupRes = await getGroupById(groupId)
        if (!groupRes.success || !groupRes.data) throw new Error(groupRes.message)
        setGroup(groupRes.data)

        const membersRes = await getMembersByGroupId(groupId)
        if (!membersRes.success) throw new Error(membersRes.message)
        setMembers(membersRes.data)

        // Get organization_id from the source group
        const organizationId = groupRes.data.organization_id;
        if (!organizationId) {
          throw new Error('Organization ID not found in source group.');
        }

        // Refresh group list
        await refreshGroupList(organizationId);

      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }, [groupId, refreshGroupList]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = useMemo<ColumnDef<IOrganization_member>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "user.first_name",
        header: "Nickname",
        cell: ({ row }) => row.original.user?.first_name || "-",
      },
      {
        id: "fullName",
        header: "Full Name",
        cell: ({ row }) => {
          const user = row.original.user
          return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '-'
        },
      },
    ],
    []
  )

  const [rowSelection, setRowSelection] = useState({})

  const filteredAndSortedMembers = useMemo(() => {
    let result = [...members];

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      result = result.filter(
        (member) => {
          const displayName = member.user?.display_name || 
                             `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim();
          return (
            displayName.toLowerCase().includes(lowercasedQuery) ||
            (member.user?.email?.toLowerCase() || "").includes(lowercasedQuery)
          );
        }
      );
    }

    switch (sortOrder) {
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "z-a":
        result.sort((a, b) => {
          const nameA = a.user?.display_name || `${a.user?.first_name || ''} ${a.user?.last_name || ''}`.trim();
          const nameB = b.user?.display_name || `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.trim();
          return nameB.localeCompare(nameA);
        });
        break;
      case "a-z":
        result.sort((a, b) => {
          const nameA = a.user?.display_name || `${a.user?.first_name || ''} ${a.user?.last_name || ''}`.trim();
          const nameB = b.user?.display_name || `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.trim();
          return nameA.localeCompare(nameB);
        });
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [members, searchQuery, sortOrder]);

  const table = useReactTable({
    data: filteredAndSortedMembers,
    columns,
    getRowId: (row) => {
      console.log('[DEBUG] getRowId called for:', { id: row.id, user: row.user?.first_name });
      return row.id;
    },
    state: {
      rowSelection,
      pagination,
    },
    onRowSelectionChange: (updater) => {
      console.log('[DEBUG] onRowSelectionChange called');
      console.log('[DEBUG] Current rowSelection:', rowSelection);
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      console.log('[DEBUG] New rowSelection:', newSelection);
      setRowSelection(newSelection);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  })

  const handleCreateGroup = async (values: z.infer<typeof createGroupSchema>): Promise<void> => {
    if (!group?.organization_id) {
      toast.error("Source organization not found!")
      return
    }

    try {
      const payload = { 
        ...values, 
        organization_id: group.organization_id
      }
      const result = await createGroup(payload)
      if (!result.success || !result.data) throw new Error(result.message)

      toast.success(`Group "${result.data.name}" created successfully.`)
      setIsCreateModalOpen(false)
      form.reset()

      // Refresh group list and select the new one
      await refreshGroupList(group.organization_id);
      setTargetGroupId(result.data.id)

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create group")
    }
  }

  const handleMoveMembers = async () => {
    // rowSelection now contains member IDs as keys (not indexes)
    const selectedMemberIds = Object.keys(rowSelection);
    
    console.log('[DEBUG] handleMoveMembers called');
    console.log('[DEBUG] rowSelection:', rowSelection);
    console.log('[DEBUG] selectedMemberIds:', selectedMemberIds);
    console.log('[DEBUG] filteredAndSortedMembers:', filteredAndSortedMembers.map(m => ({ id: m.id, name: m.user?.first_name })));

    if (selectedMemberIds.length === 0) {
      toast.warning("Please select at least one member to move.");
      return;
    }

    if (!targetGroupId) {
      toast.warning("Please select a destination group.");
      return;
    }

    try {
      const result = await moveMembersToGroup(selectedMemberIds, targetGroupId);
      if (!result.success) throw new Error(result.message);

      toast.success(result.message);
      setRowSelection({}); // Reset selection
      
      // Refresh data
      const membersRes = await getMembersByGroupId(groupId!);
      if (membersRes.success) {
        setMembers(membersRes.data);
      } else {
        throw new Error(membersRes.message);
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move members');
    }
  };

  
  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 md:p-6 bg-white rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Move from
            <Badge variant="outline">{group?.name || '...'}</Badge>
            to
          </div>
          <Select value={targetGroupId} onValueChange={setTargetGroupId}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select destination group" />
            </SelectTrigger>
            <SelectContent>
              <div 
                className="flex items-center p-2 cursor-pointer hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsCreateModalOpen(true)
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Group
              </div>
                {allGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleMoveMembers}
            disabled={!targetGroupId || Object.keys(rowSelection).length === 0}
          >
            Move Selected ({Object.keys(rowSelection).length})
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-4">
            <Button variant="outline" size="sm" onClick={fetchData} className="whitespace-nowrap">
              <RotateCcw className="h-4 w-4" />
            </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3 sm:gap-2 flex-wrap">
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
        </div>

        <div className="mt-2">
          {loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : (
            <DataTable table={table} />
          )}
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateGroup)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., x_rpl" {...field} />
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
                      <Input placeholder="e.g., X RPL" {...field} />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rekayasa Perangkat Lunak" {...field} />
                    </FormControl>
                    <FormMessage />
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
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
