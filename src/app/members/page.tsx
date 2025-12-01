"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash, Pencil, Eye, User, Shield, Check, X, Mail, Plus, FileDown, FileUp, UploadCloud, Loader2, Search } from "lucide-react"
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
  const [exporting, setExporting] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
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

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

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
          failedCount++
          errors.push(`Baris ${index + 2}: kolom email wajib diisi`)
          continue
        }

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
            failedCount++
            errors.push(`Baris ${index + 2}: role "${roleValue}" tidak ditemukan`)
            continue
          }
        }

        let departmentResult: ReturnType<typeof findId> = { id: undefined, notFound: false }
        if (!departmentValue) {
          failedCount++
          errors.push(`Baris ${index + 2}: kolom department wajib diisi`)
          continue
        }

        departmentResult = findId(departments ?? [], departmentValue, ["name", "code", "id"])
        if (departmentResult.notFound) {
          failedCount++
          errors.push(`Baris ${index + 2}: department "${departmentValue}" tidak ditemukan`)
          continue
        }

        let positionResult: ReturnType<typeof findId> = { id: undefined, notFound: false }
        if (positionValue) {
          positionResult = findId(positions ?? [], positionValue, ["title", "name", "id"])
          if (positionResult.notFound) {
            failedCount++
            errors.push(`Baris ${index + 2}: position "${positionValue}" tidak ditemukan`)
            continue
          }
        }

        const invitationPayload: Parameters<typeof createInvitation>[0] = { email }
        if (roleResult.id) invitationPayload.role_id = roleResult.id
        if (departmentResult.id) invitationPayload.department_id = departmentResult.id
        if (positionResult.id) invitationPayload.position_id = positionResult.id
        if (messageValue) invitationPayload.message = messageValue

        try {
          const result = await createInvitation(invitationPayload)
          if (result.success) {
            successCount++
          } else {
            failedCount++
            errors.push(`Baris ${index + 2}: ${result.message || "Gagal mengirim undangan"}`)
          }
        } catch (error) {
          failedCount++
          errors.push(`Baris ${index + 2}: ${(error as Error)?.message || "Gagal mengirim undangan"}`)
        }
      }

      toast.success(`Import selesai. Berhasil: ${successCount}, gagal: ${failedCount}`)
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
          <div className="flex gap-2 items-center min-w-0">
            <User className="w-4 h-4 flex-shrink-0" /> 
            <span className="truncate" title={fullname}>{fullname}</span>
          </div>
        )
      },
    },
    {
      accessorFn: (row: any) => row.user?.phone || "",
      header: "Phone Number",
      cell: ({ row }) => {
        const phone = (row.original as any).user?.phone ?? "No Phone"
        return (
          <span className="truncate block" title={phone}>
            {phone}
          </span>
        )
      },
    },
    {
      accessorFn: (row: any) => row.groupName || "",
      header: "Group",
      cell: ({ row }) => {
        const group = (row.original as any).groupName || "-"
        return (
          <span className="truncate block" title={group}>
            {group}
          </span>
        )
      },
    },
    {
      header: "Role",
      cell: ({ row }) => {
        const role = (row.original as any).role
        if (!role) return <Badge variant="outline" className="truncate">No Role</Badge>
        
        const isAdmin = role.code === "A001"
        return (
          <Badge variant={isAdmin ? "default" : "secondary"} className="flex items-center gap-1 w-fit max-w-full" title={role.name}>
            <Shield className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{role.name}</span>
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
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white whitespace-nowrap">
            <Check className="w-3 h-3 mr-1 flex-shrink-0" /> 
            <span className="truncate">Active</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-black whitespace-nowrap">
            <X className="w-3 h-3 mr-1 flex-shrink-0" /> 
            <span className="truncate">Inactive</span>
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
          <div className="flex gap-1 justify-end">
            <Button
              variant="outline"
              size="icon"
              className="border-0 cursor-pointer h-8 w-8"
              onClick={() => router.push(`/members/edit/${member.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-0 cursor-pointer h-8 w-8"
              onClick={() => router.push(`/members/${member.id}`)}
            >
              <Eye className="h-4 w-4" />
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

                <Dialog open={importDialogOpen} onOpenChange={handleImportDialogChange}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={importing || isLoadingInviteData}
                      className="whitespace-nowrap"
                    >
                      {importing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileUp className="mr-2 h-4 w-4" />
                      )}
                      Import
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
                  </DialogContent>
                </Dialog>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button size="sm" className="whitespace-nowrap">
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
              <EmptyContent>
                <Button onClick={() => setInviteDialogOpen(true)}>Invite Member</Button>
              </EmptyContent>
            </Empty>
          </div>
              ) : (
                <div className="min-w-full overflow-x-auto">
                  <DataTable 
                    columns={columns} 
                    data={members}
                    isLoading={loading}
                    searchPlaceholder="Search by name, phone, group, role, or status..."
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
