"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash, Pencil, Eye, User, Shield, Check, X, UserPlus, Mail, Plus } from "lucide-react"
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
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery } from "@tanstack/react-query"

import { IOrganization_member } from "@/interface"
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
import { deleteOrganization_member, getAllOrganization_member } from "@/action/members"
import { getAllUsers } from "@/action/users"
import { getAllGroups } from "@/action/group"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
// ContentLayout removed - using new layout system
import { createClient } from "@/utils/supabase/client"
import { createInvitation } from "@/action/invitations"
import { getOrgRoles } from "@/lib/rbac"
import { useGroups } from "@/hooks/use-groups"
import { usePositions } from "@/hooks/use-positions"

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role_id: z.string().optional(),
  department_id: z.string().optional(),
  position_id: z.string().optional(),
  message: z.string().max(500, "Message too long (max 500 characters)").optional(),
})

type InviteFormValues = z.infer<typeof inviteSchema>

export default function MembersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [members, setMembers] = React.useState<IOrganization_member[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [submittingInvite, setSubmittingInvite] = React.useState(false)
  const [organizationId, setOrganizationId] = React.useState<string>("")

  // Auto-open invite dialog if action=invite in URL
  React.useEffect(() => {
    if (searchParams.get('action') === 'invite') {
      setInviteDialogOpen(true)
    }
  }, [searchParams])

  // Fetch data for invite form
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["org-roles"],
    queryFn: getOrgRoles,
  })
  
  const { data: departments = [], isLoading: deptLoading } = useGroups()
  const { data: positions = [], isLoading: posLoading } = usePositions()

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role_id: "",
      department_id: "",
      position_id: "",
      message: "",
    },
  })

  const isLoadingInviteData = rolesLoading || deptLoading || posLoading

  const fetchMembers = async () => {
    try {
      setLoading(true)
      
      // Get organization ID
      const { data: { user } } = await supabase.auth.getUser()
      let orgId = ""

      if (user) {
        const { data, error } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .maybeSingle()

        if (data) {
          orgId = String(data.organization_id)
          setOrganizationId(orgId)
        }
      }

      // Fetch all data
      const [memberRes, userRes, groupsRes] = await Promise.all([
        getAllOrganization_member(),
        getAllUsers(),
        getAllGroups(),
      ])

      if (!memberRes.success) throw new Error(memberRes.message)

      const membersData = memberRes.data
      const usersData = userRes.success ? userRes.data : []
      const groupsData = groupsRes?.data || []

      // Create group map
      const groupMap = new Map<string, string>()
      groupsData.forEach((g: any) => {
        if (g && g.id) groupMap.set(String(g.id), g.name)
      })

      // Manual join
      const mergedMembers = membersData.map((m: any) => {
        const u = usersData.find((usr: any) => usr.id === m.user_id)
        const groupName =
          groupMap.get(String(m.department_id)) ||
          (m.groups && (m.groups as any).name) ||
          (m.departments && (m.departments as any).name) ||
          ""
        return { ...m, user: u, groupName }
      })

      // Filter by organization
      const filteredMembers = orgId
        ? mergedMembers.filter((m: any) => String(m.organization_id) === orgId)
        : mergedMembers
      
      setMembers(filteredMembers)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchMembers()
  }, [])

  async function handleDelete(id: string) {
    try {
      setLoading(true)
      const res = await deleteOrganization_member(id)
      if (!res.success) throw new Error(res.message)
      toast.success("Member deleted successfully")
      fetchMembers()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function onSubmitInvite(values: InviteFormValues) {
    try {
      setSubmittingInvite(true)

      const result = await createInvitation({
        email: values.email,
        role_id: values.role_id || undefined,
        department_id: values.department_id || undefined,
        position_id: values.position_id || undefined,
        message: values.message || undefined,
      })

      if (result.success) {
        toast.success("Invitation sent successfully via email!")
        setInviteDialogOpen(false)
        inviteForm.reset()
        fetchMembers()
      } else {
        toast.error(result.message || "Failed to send invitation")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setSubmittingInvite(false)
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setInviteDialogOpen(open)
    if (!open) {
      inviteForm.reset()
    }
  }

  const columns: ColumnDef<IOrganization_member>[] = [
    {
      id: "userFullName",
      accessorFn: (row: any) => {
        const user = row.user
        const fullname = user
          ? [user.first_name, user.middle_name, user.last_name]
              .filter((part: any) => part && part.trim() !== "")
              .join(" ") ||
            user.display_name ||
            user.email ||
            "No User"
          : "No User"
        return fullname
      },
      header: "Members",
      cell: ({ row }) => {
        const user = (row.original as any).user
        const fullname = user
          ? [user.first_name, user.middle_name, user.last_name]
              .filter((part: any) => part && part.trim() !== "")
              .join(" ") ||
            user.display_name ||
            user.email ||
            "No User"
          : "No User"
        return (
          <div className="flex gap-2 items-center">
            <User className="w-4 h-4" /> {fullname}
          </div>
        )
      },
    },
    {
      accessorFn: (row: any) => row.user?.phone || "",
      header: "Phone Number",
      cell: ({ row }) => (row.original as any).user?.phone ?? "No Phone",
    },
    {
      accessorFn: (row: any) => row.groupName || "",
      header: "Group",
      cell: ({ row }) => (row.original as any).groupName || "-",
    },
    {
      header: "Role",
      cell: ({ row }) => {
        const role = (row.original as any).role
        if (!role) return <Badge variant="outline">No Role</Badge>
        
        const isAdmin = role.code === "A001"
        return (
          <Badge variant={isAdmin ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
            <Shield className="w-3 h-3" />
            {role.name}
          </Badge>
        )
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("is_active") as boolean
        return active ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
            <Check className="w-3 h-3 mr-1" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-black">
            <X className="w-3 h-3 mr-1" /> Inactive
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const member = row.original
        
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-0 cursor-pointer"
              onClick={() => router.push(`/members/edit/${member.id}`)}
            >
              <Pencil />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-0 cursor-pointer"
              onClick={() => router.push(`/members/${member.id}`)}
            >
              <Eye />
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
                  <AlertDialogTitle>Delete Member</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this member? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(member.id)}
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
          <Dialog open={inviteDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild className="float-end ml-5">
              <Button>
                Invite Member <Plus className="ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]" aria-describedby="invite-description">
              <DialogHeader>
                <DialogTitle>Invite New Member</DialogTitle>
                <DialogDescription id="invite-description">
                  Send an email invitation to add a new member to your organization
                </DialogDescription>
              </DialogHeader>

              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(onSubmitInvite)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="john.doe@example.com"
                              className="pl-10"
                              {...field}
                              disabled={submittingInvite}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={inviteForm.control}
                    name="role_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={submittingInvite || isLoadingInviteData}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role: any) => (
                              <SelectItem key={role.id} value={String(role.id)}>
                                <div className="flex items-center gap-2">
                                  {role.code === "A001" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                  {role.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={inviteForm.control}
                    name="department_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={submittingInvite || isLoadingInviteData}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept: any) => (
                              <SelectItem key={dept.id} value={String(dept.id)}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={inviteForm.control}
                    name="position_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={submittingInvite || isLoadingInviteData}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {positions.map((pos: any) => (
                              <SelectItem key={pos.id} value={String(pos.id)}>
                                {pos.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={inviteForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Welcome Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Welcome to the team!"
                            className="resize-none"
                            rows={3}
                            {...field}
                            disabled={submittingInvite}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={submittingInvite || isLoadingInviteData}
                    className="w-full"
                  >
                    {submittingInvite ? "Sending..." : "Send Invitation"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : members.length === 0 ? (
          <div className="mt-20">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <User className="h-14 w-14 text-muted-foreground mx-auto" />
                </EmptyMedia>
                <EmptyTitle>No members yet</EmptyTitle>
                <EmptyDescription>
                  There are no members for this organization. Use the "Invite Member" button to add one.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setInviteDialogOpen(true)}>Invite Member</Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={members}
            isLoading={loading}
          />
        )}
      </div>
    </div>
  )
}
