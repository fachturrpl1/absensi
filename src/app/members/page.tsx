"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { MembersTable } from "@/components/members-table"
import { Button } from "@/components/ui/button"
import { User, Shield, Mail, Plus, FileDown, FileUp, Loader2, Search } from "lucide-react"
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
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery } from "@tanstack/react-query"

import { IOrganization_member } from "@/interface"
import { getAllOrganization_member } from "@/action/members"
import { getAllUsers } from "@/action/users"
import { getAllGroups } from "@/action/group"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
// ContentLayout removed - using new layout system
import { createClient } from "@/utils/supabase/client"
import { createInvitation } from "@/action/invitations"
import { getOrgRoles } from "@/lib/rbac"
import { useGroups } from "@/hooks/use-groups"
import { usePositions } from "@/hooks/use-positions"
import { FlexibleImportDialog } from "@/components/members/flexible-import-dialog"
import { useOrgStore } from "@/store/org-store"
import { useOrgGuard } from "@/hooks/use-org-guard"
const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role_id: z.string().optional(),
  department_id: z.string().optional(),
  position_id: z.string().optional(),
  message: z.string().max(500, "Message too long (max 500 characters)").optional(),
})

type InviteFormValues = z.infer<typeof inviteSchema>
type ImportSummary = { success: number; failed: number; errors: string[] }

export default function MembersPage() {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const orgStore = useOrgStore()
  useOrgGuard()

  const [members, setMembers] = React.useState<IOrganization_member[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [submittingInvite, setSubmittingInvite] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [importSummary, setImportSummary] = React.useState<ImportSummary | null>(null)
  const [searchQuery, setSearchQuery] = React.useState<string>("")

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
      
      if (!orgStore.organizationId) {
        toast.error('Please select an organization')
        setLoading(false)
        return
      }

      // Fetch all data with organizationId
      const [memberRes, userRes, groupsRes] = await Promise.all([
        getAllOrganization_member(orgStore.organizationId),
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

      // Members sudah di-filter di server, tidak perlu filter lagi
      setMembers(mergedMembers)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchMembers()
  }, [orgStore.organizationId])
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

  const handleExportMembers = async () => {
    try {
      if (!members.length) {
        toast.warning("Tidak ada data member untuk diekspor")
        return
      }

      setExporting(true)
      const XLSX = await import("xlsx")

      const rows = members.map((member: any) => {
        const user = member.user
        const fullname = user
          ? [user.first_name, user.middle_name, user.last_name]
              .filter((part: string | undefined) => part && part.trim() !== "")
              .join(" ") ||
            user.display_name ||
            user.email ||
            "No User"
          : "No User"

        return {
          "Full Name": fullname,
          Email: user?.email || "-",
          "Phone Number": user?.phone || "-",
          Department: member.groupName || member.departments?.name || "-",
          Role: member.role?.name || "No Role",
          Status: member.is_active ? "Active" : "Inactive",
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Members")

      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `members-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success("Export members berhasil")
    } catch (error) {
      console.error("Export members error:", error)
      toast.error("Gagal mengekspor data members")
    } finally {
      setExporting(false)
    }
  }


  const handleImportDialogChange = (open: boolean) => {
    setImportDialogOpen(open)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setInviteDialogOpen(open)
    if (!open) {
      inviteForm.reset()
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <div className="w-full">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-white text-black px-4 md:px-6 py-4 rounded-t-lg border-b-2 border-black-200">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Members</h1>
          </div>
          
          <div className="p-4 md:p-6 space-y-4 overflow-x-auto">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-between" suppressHydrationWarning>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3 sm:gap-2 flex-wrap items-center" suppressHydrationWarning>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportMembers}
                  disabled={loading || exporting}
                  className="whitespace-nowrap"
                >
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Export
                </Button>
                <FlexibleImportDialog
                  open={importDialogOpen}
                  onOpenChange={handleImportDialogChange}
                  onImportComplete={(summary) => {
                    setImportSummary(summary)
                    fetchMembers()
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImportDialogOpen(true)}
                  disabled={isLoadingInviteData}
                  className="whitespace-nowrap"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <Dialog open={inviteDialogOpen} onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="whitespace-nowrap">
                      Invite <Plus className="ml-2 h-4 w-4" />
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
                                        {role.code === "A001" ? (
                                          <Shield className="w-3 h-3" />
                                        ) : (
                                          <User className="w-3 h-3" />
                                        )}
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
            </div>

            {importSummary && (
              <div className="rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
                <p className="text-sm font-semibold">Import summary</p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span className="text-green-600">Berhasil: {importSummary.success}</span>
                  <span className="text-red-500">Gagal: {importSummary.failed}</span>
                </div>
                {importSummary.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-500">Detail error:</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-red-500">
                      {importSummary.errors.slice(0, 5).map((error, index) => (
                        <li key={`${error}-${index}`}>{error}</li>
                      ))}
                    </ul>
                    {importSummary.errors.length > 5 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        +{importSummary.errors.length - 5} error lainnya
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
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
                  </Empty>
                </div>
              ) : (
                <div className="min-w-full overflow-x-auto">
                  <MembersTable 
                    members={members}
                    isLoading={loading}
                    onDelete={fetchMembers}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
