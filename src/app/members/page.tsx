"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { MembersTable } from "@/components/members-table"
import { Button } from "@/components/ui/button"
import {
  User,
  Shield,
  Mail,
  Plus,
  FileDown,
  FileUp,
  UploadCloud,
  Loader2,
} from "lucide-react"
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
//tes
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

  const [members, setMembers] = React.useState<IOrganization_member[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [submittingInvite, setSubmittingInvite] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [importSummary, setImportSummary] = React.useState<ImportSummary | null>(null)
  const [isDragActive, setIsDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const templateDownloadUrl = "/templates/members-import-template.xlsx"

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
        const { data } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .maybeSingle()

        if (data) {
          orgId = String(data.organization_id)
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

  const processImportFile = async (file: File) => {
    setImportSummary(null)
    setImporting(true)

    try {
      const XLSX = await import("xlsx")
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames?.[0]
      if (!sheetName) {
        throw new Error("Tidak ada sheet di dalam file Excel")
      }

      const sheet = workbook.Sheets[sheetName]
      if (!sheet) {
        throw new Error("Tidak dapat menemukan sheet yang valid di file Excel")
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" }) as Record<
        string,
        string
      >[]

      if (!rows.length) {
        toast.error("File Excel kosong atau tidak memiliki data")
        return
      }

      if (rows.length > 200) {
        toast.warning("Import maksimal 200 baris per file untuk menjaga performa")
      }

      const summary: ImportSummary = { success: 0, failed: 0, errors: [] }

      const findId = (
        collection: any[],
        value: string,
        keys: string[]
      ): { id?: string; notFound: boolean } => {
        const normalized = value.trim().toLowerCase()
        if (!normalized) return { id: undefined, notFound: false }
        const match = collection.find((item: any) =>
          keys.some((key) => String(item?.[key] ?? "").trim().toLowerCase() === normalized)
        )
        if (!match) return { id: undefined, notFound: true }
        return { id: String(match.id), notFound: false }
      }

      for (let index = 0; index < rows.length; index++) {
        const rawRow = rows[index]
        if (!rawRow) {
          continue
        }

        const normalizedRow = Object.entries(rawRow).reduce<Record<string, string>>(
          (acc, [key, value]) => {
            acc[key.toLowerCase()] = String(value ?? "")
            return acc
          },
          {}
        )

        const email = String(normalizedRow["email"] || normalizedRow["email address"] || "").trim()
        if (!email) {
          summary.failed++
          summary.errors.push(`Baris ${index + 2}: kolom email wajib diisi`)
          continue
        }

        const phoneValue = String(
          normalizedRow["phone"] ||
            normalizedRow["phone number"] ||
            normalizedRow["telepon"] ||
            normalizedRow["no hp"] ||
            normalizedRow["nomor hp"] ||
            ""
        ).trim()

        const roleValue = String(normalizedRow["role"] || "").trim()
        const departmentValue = String(normalizedRow["department"] || "").trim()
        const positionValue = String(
          normalizedRow["position"] ||
            normalizedRow["job title"] ||
            normalizedRow["jabatan"] ||
            ""
        ).trim()
        const messageValue = String(
          normalizedRow["message"] ||
            normalizedRow["notes"] ||
            normalizedRow["catatan"] ||
            ""
        ).trim()

        const skipRole =
          !roleValue || roleValue.toLowerCase().replace(/[^a-z0-9]/g, "") === "norole"

        let roleResult: ReturnType<typeof findId> = { id: undefined, notFound: false }
        if (!skipRole) {
          roleResult = findId(roles ?? [], roleValue, ["name", "code", "id"])
          if (roleResult.notFound) {
            summary.failed++
            summary.errors.push(`Baris ${index + 2}: role "${roleValue}" tidak ditemukan`)
            continue
          }
        }

        let departmentResult: ReturnType<typeof findId> = { id: undefined, notFound: false }
        if (!departmentValue) {
          summary.failed++
          summary.errors.push(`Baris ${index + 2}: kolom department wajib diisi`)
          continue
        }

        departmentResult = findId(departments ?? [], departmentValue, ["name", "code", "id"])
        if (departmentResult.notFound) {
          summary.failed++
          summary.errors.push(`Baris ${index + 2}: department "${departmentValue}" tidak ditemukan`)
          continue
        }

        let positionResult: ReturnType<typeof findId> = { id: undefined, notFound: false }
        if (positionValue) {
          positionResult = findId(positions ?? [], positionValue, ["title", "name", "id"])
          if (positionResult.notFound) {
            summary.failed++
            summary.errors.push(`Baris ${index + 2}: position "${positionValue}" tidak ditemukan`)
            continue
          }
        }

        const invitationPayload: Parameters<typeof createInvitation>[0] = { email }
        if (roleResult.id) invitationPayload.role_id = roleResult.id
        if (departmentResult.id) invitationPayload.department_id = departmentResult.id
        if (positionResult.id) invitationPayload.position_id = positionResult.id
        if (messageValue) invitationPayload.message = messageValue
        if (phoneValue) invitationPayload.phone = phoneValue

        try {
          const result = await createInvitation(invitationPayload)
          if (result.success) {
            summary.success++
          } else {
            summary.failed++
            summary.errors.push(`Baris ${index + 2}: ${result.message || "Gagal mengirim undangan"}`)
          }
        } catch (error) {
          summary.failed++
          summary.errors.push(`Baris ${index + 2}: ${(error as Error)?.message || "Gagal mengirim undangan"}`)
        }
      }

      setImportSummary(summary)
      toast.success(`Import selesai. Berhasil: ${summary.success}, gagal: ${summary.failed}`)
      fetchMembers()
    } catch (error) {
      console.error("Import members error:", error)
      toast.error("Gagal mengimport file Excel")
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processImportFile(file)
    }
  }

  const handleImportDialogChange = (open: boolean) => {
    setImportDialogOpen(open)
    if (!open) {
      setIsDragActive(false)
    }
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      await processImportFile(file)
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setInviteDialogOpen(open)
    if (!open) {
      inviteForm.reset()
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full">
      <div className="w-full space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleExportMembers}
              disabled={loading || exporting}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Export Excel
            </Button>

            <Dialog open={importDialogOpen} onOpenChange={handleImportDialogChange}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={importing || isLoadingInviteData}
                >
                  {importing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileUp className="mr-2 h-4 w-4" />
                  )}
                  Import Excel
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-[560px] w-full">
                <DialogHeader>
                  <DialogTitle>Import Members</DialogTitle>
                  <DialogDescription>
                    Unggah file Excel .
                  </DialogDescription>
                </DialogHeader>

                <div
                  className={`mx-auto w-full max-w-md flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center ${
                    isDragActive ? "border-blue-500 bg-blue-50/60 dark:bg-blue-400/10" : "border-muted"
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (!importing) {
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-base font-semibold">Tarik & letakkan file kamu di sini</p>
                    <p className="text-sm text-muted-foreground">
                      atau klik untuk memilih file dari komputer
                    </p>
                  </div>
                </div>
                <div className="w-full text-left">
                  <a
                    href={templateDownloadUrl}
                    download
                    className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Download template di sini
                  </a>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                </p>
              </DialogContent>
            </Dialog>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <Dialog open={inviteDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  Invite Member <Plus className="ml-2 h-4 w-4" />
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

        {/* Table Content */}
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
          <MembersTable 
            members={members}
            isLoading={loading}
            onDelete={fetchMembers}
          />
        )}
      </div>
    </div>
  )
}
