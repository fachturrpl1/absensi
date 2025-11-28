"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash, Pencil, Eye, User, Shield, Check, X, Mail, Plus, FileDown, FileUp } from "lucide-react"
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
//tes
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

  const [members, setMembers] = React.useState<
    (IOrganization_member & { groupName?: string })[]
  >([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [submittingInvite, setSubmittingInvite] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [importSummary, setImportSummary] = React.useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)

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

  const handleImportDialogOpenChange = (open: boolean) => {
    setImportDialogOpen(open)
    if (!open) {
      setIsDragActive(false)
    }
  }

  const handleFileSelection = async (file: File) => {
    await processImportFile(file)
    handleImportDialogOpenChange(false)
  }

  const handleImportMembers = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    handleFileSelection(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragActive(false)
    const file = event.dataTransfer?.files?.[0]
    if (!file) return
    await handleFileSelection(file)
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

  const getMemberFullName = (member: any) => {
    const user = member?.user
    return user
      ? [user.first_name, user.middle_name, user.last_name]
          .filter((part: string) => part && part.trim() !== "")
          .join(" ") ||
        user.display_name ||
        user.email ||
        "No User"
      : "No User"
  }

  const handleExportMembers = async () => {
    if (!members.length) {
      toast.info("Tidak ada data member untuk diexport")
      return
    }

    try {
      const XLSX = await import("xlsx")

      const exportRows = members.map((member) => ({
        Name: getMemberFullName(member),
        Email: member.user?.email || "",
        Phone: member.user?.phone || "",
        Group: member.groupName || "",
        Role: member.role?.name || "",
        Status: member.is_active ? "Active" : "Inactive",
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Members")
      const filename = `members-${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(workbook, filename)
      toast.success("Berhasil mengekspor data members")
    } catch (error) {
      console.error("Export members error:", error)
      toast.error("Gagal mengekspor data members")
    }
  }

  const processImportFile = async (file: File) => {
    setImportSummary(null)
    setImporting(true)

    try {
      // Ensure departments are loaded before import
      if (deptLoading) {
        toast.error("Sedang memuat data department, silakan tunggu sebentar...")
        return
      }

      // Fetch fresh departments data to ensure we have the latest
      const departmentsResponse = await getAllGroups()
      const availableDepartments = departmentsResponse.success ? departmentsResponse.data : []
      
      if (!availableDepartments || availableDepartments.length === 0) {
        toast.error("Tidak ada department yang tersedia. Silakan buat department terlebih dahulu.")
        return
      }

      // Debug: Log available departments
      console.log("Available departments:", availableDepartments.map((d: any) => ({ id: d.id, name: d.name, code: d.code })))

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

      const summary = { success: 0, failed: 0, errors: [] as string[] }

      const findId = (
        collection: any[],
        value: string,
        keys: string[]
      ): { id?: string; notFound: boolean } => {
        // Normalize input: trim, lowercase, and remove extra spaces
        const normalized = value.trim().toLowerCase().replace(/\s+/g, " ")
        if (!normalized) return { id: undefined, notFound: false }
        
        const match = collection.find((item: any) =>
          keys.some((key) => {
            const itemValue = String(item?.[key] ?? "").trim().toLowerCase().replace(/\s+/g, " ")
            // Exact match
            if (itemValue === normalized) return true
            // Also try matching without special characters (for codes like "x_tkj" vs "X TKJ")
            const normalizedNoSpecial = normalized.replace(/[^a-z0-9]/g, "")
            const itemValueNoSpecial = itemValue.replace(/[^a-z0-9]/g, "")
            if (normalizedNoSpecial && itemValueNoSpecial === normalizedNoSpecial) return true
            return false
          })
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

        departmentResult = findId(availableDepartments ?? [], departmentValue, ["name", "code", "id"])
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
      cell: ({ row }) => (
        <div className="text-center flex items-center justify-center min-h-[32px]">
          {(row.original as any).user?.phone ?? "No Phone"}
        </div>
      ),
    },
    {
      accessorFn: (row: any) => row.groupName || "",
      header: "Group",
      cell: ({ row }) => (
        <div className="text-center flex items-center justify-center min-h-[32px]">
          {(row.original as any).groupName || "-"}
        </div>
      ),
    },
    {
      header: "Role",
      cell: ({ row }) => {
        const role = (row.original as any).role
        return (
          <div className="text-center flex items-center justify-center min-h-[32px]">
            {role ? (
              <Badge variant={role.code === "A001" ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                <Shield className="w-3 h-3" />
                {role.name}
              </Badge>
            ) : (
              <Badge variant="outline">No Role</Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("is_active") as boolean
        return (
          <div className="text-center flex items-center justify-center min-h-[32px]">
            {active ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                <Check className="w-3 h-3 mr-1" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-black">
                <X className="w-3 h-3 mr-1" /> Inactive
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const member = row.original
        
        return (
          <div className="flex gap-2 justify-center items-center min-h-[32px]">
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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full">
      <div className="w-full space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto gap-2"
                onClick={handleExportMembers}
                disabled={loading || members.length === 0}
              >
                <FileDown className="h-4 w-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto gap-2"
                onClick={() => handleImportDialogOpenChange(true)}
                disabled={importing}
              >
                <FileUp className="h-4 w-4" />
                {importing ? "Importing..." : "Import Excel"}
              </Button>
              <input
                id="members-import-input"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportMembers}
                disabled={importing}
              />
            </div>
            <Dialog open={importDialogOpen} onOpenChange={handleImportDialogOpenChange}>
              <DialogContent className="w-full max-w-[560px]" aria-describedby="import-description">
                <DialogHeader>
                  <DialogTitle>Import Members</DialogTitle>
                  <DialogDescription id="import-description">
                    Unggah file Excel untuk mengimport data members
                  </DialogDescription>
                </DialogHeader>
                <div
                  className={`
                    mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition
                    ${isDragActive ? "border-blue-500 bg-blue-50/60 text-blue-800 dark:text-blue-200" : "border-muted-foreground/40 bg-muted/10 text-muted-foreground"}
                    ${importing ? "opacity-60 pointer-events-none" : "cursor-pointer hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-blue-400/10"}
                  `}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onClick={() => !importing && fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if ((event.key === "Enter" || event.key === " ") && !importing) {
                      event.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <div className="rounded-full bg-background p-3 shadow-sm">
                    <FileUp className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Tarik & letakkan file kamu di sini</p>
                    <p className="text-xs">atau klik untuk memilih file dari komputer</p>
                  </div>
                </div>
                <div className="mt-1 w-full text-left">
                  <a
                    href="/templates/members-import-template.xlsx"
                    download
                    className="text-xs font-semibold text-blue-600 hover:text-blue-500"
                  >
                    Download template di sini
                  </a>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={inviteDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
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
        </div>

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
          <DataTable 
            columns={columns} 
            data={members}
            isLoading={loading}
          />
        )}

        {importSummary && (
          <div className="rounded-lg border border-muted-foreground/20 bg-muted/30 p-4 text-sm space-y-2">
            <div className="font-semibold">Import summary</div>
            <div className="flex flex-wrap gap-3">
              <span className="text-green-600 dark:text-green-400">Berhasil: {importSummary.success}</span>
              <span className="text-red-600 dark:text-red-400">Gagal: {importSummary.failed}</span>
            </div>
            {importSummary.errors.length > 0 && (
              <ul className="list-disc pl-4 text-muted-foreground space-y-1 max-h-40 overflow-auto text-xs">
                {importSummary.errors.slice(0, 10).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {importSummary.errors.length > 10 && (
                  <li>...dan {importSummary.errors.length - 10} error lainnya</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
