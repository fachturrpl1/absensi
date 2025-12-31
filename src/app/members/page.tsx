"use client"

import React from "react"
import { MembersTable } from "@/components/members-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { User, Shield, Mail, Plus, FileDown, Loader2, Search, FileSpreadsheet, Minus, RefreshCw } from "lucide-react"
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
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
// ContentLayout removed - using new layout system
import { createInvitation } from "@/action/invitations"
import { getOrgRoles } from "@/lib/rbac"
import { useGroups } from "@/hooks/use-groups"
import { usePositions } from "@/hooks/use-positions"
import { useHydration } from "@/hooks/useHydration"
//tes

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role_id: z.string().optional(),
  department_id: z.string().optional(),
  position_id: z.string().optional(),
  message: z.string().max(500, "Message too long (max 500 characters)").optional(),
})

type InviteFormValues = z.infer<typeof inviteSchema>

type ExportFieldConfig = {
  key: string
  label: string
  getValue: (member: any) => string | number | boolean | null
}

const EXPORT_FIELDS: ExportFieldConfig[] = [
  {
    key: "nik",
    label: "NIK",
    getValue: (member: any) => member.biodata?.nik || member.biodata_nik || "-",
  },
  {
    key: "full_name",
    label: "Full Name",
    getValue: (member: any) => {
      // Priority: biodata.nama > user full name > email
      if (member.biodata?.nama) return member.biodata.nama
      
      const user = member.user
      if (user) {
        const fullname =
          [user.first_name, user.middle_name, user.last_name]
            .filter((part: string | undefined) => part && part.trim() !== "")
            .join(" ") ||
          user.display_name ||
          user.email
        if (fullname) return fullname
      }
      
      return "-"
    },
  },
  {
    key: "nickname",
    label: "Nickname",
    getValue: (member: any) => member.biodata?.nickname || "-",
  },
  {
    key: "nisn",
    label: "NISN",
    getValue: (member: any) => member.biodata?.nisn || "-",
  },
  {
    key: "gender",
    label: "Gender",
    getValue: (member: any) => member.biodata?.jenis_kelamin || "-",
  },
  {
    key: "email",
    label: "Email",
    getValue: (member: any) => member.email || member.user?.email || "-",
  },
  {
    key: "phone",
    label: "Phone Number",
    getValue: (member: any) => member.biodata?.no_telepon || member.user?.phone || "-",
  },
  {
    key: "group",
    label: "Department / Group",
    getValue: (member: any) => {
      // Debug: log first few calls to see what's happening
      if (member.id === 3328 || member.id === 3321) {
        console.log(`[MEMBERS UI getValue] Called for member ${member.id}:`, {
          hasGroupName: !!member.groupName,
          hasDepartments: !!member.departments,
          departmentsType: typeof member.departments,
          isArray: Array.isArray(member.departments),
          departments: member.departments,
          department_id: member.department_id
        });
      }
      
      // Handle groupName (legacy)
      if (member.groupName) {
        return member.groupName;
      }
      
      // Handle departments - could be object or array
      if (member.departments) {
        if (Array.isArray(member.departments) && member.departments.length > 0) {
          const deptName = member.departments[0]?.name;
          if (deptName) {
            if (member.id === 3328 || member.id === 3321) {
              console.log(`[MEMBERS UI getValue] Returning name from array:`, deptName);
            }
            return deptName;
          } else {
            console.warn(`[MEMBERS UI getValue] Member ${member.id} has departments array but no name:`, member.departments[0]);
          }
        } else if (typeof member.departments === 'object' && !Array.isArray(member.departments)) {
          const deptName = member.departments.name;
          if (deptName) {
            if (member.id === 3328 || member.id === 3321) {
              console.log(`[MEMBERS UI getValue] Returning name from object:`, deptName);
            }
            return deptName;
          } else {
            console.warn(`[MEMBERS UI getValue] Member ${member.id} has departments object but no name:`, member.departments);
            console.warn(`[MEMBERS UI getValue] Departments keys:`, Object.keys(member.departments || {}));
            console.warn(`[MEMBERS UI getValue] Departments full object:`, JSON.stringify(member.departments, null, 2));
          }
        } else {
          console.warn(`[MEMBERS UI getValue] Member ${member.id} has departments but unexpected type:`, typeof member.departments, member.departments);
        }
      }
      
      // Fallback: check department_id and log for debugging
      if (member.department_id) {
        console.warn(`[MEMBERS UI getValue] Member ${member.id} has department_id ${member.department_id} but no valid departments object`);
      }
      
      return "-";
    },
  },
  {
    key: "position",
    label: "Position",
    getValue: (member: any) => member.position?.title || member.positions?.title || "-",
  },
  {
    key: "role",
    label: "Role",
    getValue: (member: any) => member.role?.name || "-",
  },
  {
    key: "status",
    label: "Status",
    getValue: (member: any) => (member.is_active ? "Active" : "Inactive"),
  },
  {
    key: "hire_date",
    label: "Hire Date",
    getValue: (member: any) => member.hire_date || "-",
  },
]

const MembersPageSkeleton = () => (
  <div className="p-4 md:p-6 space-y-4">
    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
      <Skeleton className="h-10 w-full sm:w-64" />
      <div className="flex gap-2 w-full sm:w-auto">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    <TableSkeleton rows={8} columns={6} />
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  </div>
)

export default function MembersPage() {
  const { isHydrated, organizationId } = useHydration()
  
  // Use queryClient - it should be available after QueryProvider mounts
  // If there's an error, it means QueryProvider is not set up correctly
  const queryClient = useQueryClient()

  const [exporting, setExporting] = React.useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [submittingInvite, setSubmittingInvite] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [selectedMemberIds] = React.useState<string[]>([])
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false)
  const [selectedExportFields, setSelectedExportFields] = React.useState<string[]>(
    EXPORT_FIELDS.map((f) => f.key),
  )

  const [page, setPage] = React.useState<number>(1)
  const [pageSize, setPageSize] = React.useState<number>(10)

  interface MembersApiPage {
    success: boolean
    data: IOrganization_member[]
    pagination: { cursor: string | null; limit: number; hasMore: boolean; total: number }
  }

  const { data: pageData, isLoading: loading, isFetching, refetch } = useQuery<MembersApiPage>({
    queryKey: ["members", "paged", organizationId, searchQuery, page, pageSize],
    queryFn: async () => {
      const url = new URL('/api/members', window.location.origin)
      url.searchParams.set('limit', String(pageSize))
      url.searchParams.set('active', 'all')
      url.searchParams.set('countMode', 'planned')
      url.searchParams.set('page', String(page))
      if (organizationId) url.searchParams.set('organizationId', String(organizationId))
      if (searchQuery) url.searchParams.set('search', searchQuery)
      const res = await fetch(url.toString(), { credentials: 'same-origin' })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Failed to fetch members')
      return json as MembersApiPage
    },
    enabled: isHydrated && !!organizationId,
    staleTime: 60_000,
    gcTime: 300_000,
  })

  const members: IOrganization_member[] = pageData?.data ?? []
  const total: number = pageData?.pagination?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)))

  // Debug: Log members data to check departments
  React.useEffect(() => {
    if (members && members.length > 0) {
      console.log('[MEMBERS UI] Total members:', members.length)
      
      // Check all members for department_id
      const membersWithDeptId = members.filter((m: any) => m.department_id != null && m.department_id !== undefined)
      console.log('[MEMBERS UI] Members with department_id:', membersWithDeptId.length)
      
      if (membersWithDeptId.length > 0 && membersWithDeptId[0]) {
        const sample = membersWithDeptId[0] as any;
        console.log('[MEMBERS UI] Sample member with department_id:', {
          id: sample.id,
          department_id: sample.department_id,
          department_id_type: typeof sample.department_id,
          departments: sample.departments,
          departments_type: typeof sample.departments,
          is_departments_array: Array.isArray(sample.departments),
          biodata_nik: sample.biodata_nik
        })
      }
      
      const membersWithDept = members.filter((m: any) => {
        if (!m.departments) return false
        if (Array.isArray(m.departments) && m.departments.length > 0 && m.departments[0]?.name) return true
        if (typeof m.departments === 'object' && m.departments.name) return true
        return false
      })
      const membersWithoutDept = members.filter((m: any) => {
        if (!m.department_id) return false
        const hasValidDept = m.departments && 
          ((typeof m.departments === 'object' && !Array.isArray(m.departments) && m.departments.name) ||
           (Array.isArray(m.departments) && m.departments.length > 0 && m.departments[0]?.name))
        return !hasValidDept
      })
      
      console.log('[MEMBERS UI] Members with departments:', membersWithDept.length)
      console.log('[MEMBERS UI] Members without departments (but have department_id):', membersWithoutDept.length)
      
      if (membersWithoutDept.length > 0 && membersWithoutDept[0]) {
        const sample = membersWithoutDept[0] as any;
        console.log('[MEMBERS UI] Sample member without departments:', {
          id: sample.id,
          department_id: sample.department_id,
          department_id_type: typeof sample.department_id,
          departments: sample.departments,
          departments_type: typeof sample.departments,
          is_departments_array: Array.isArray(sample.departments),
          biodata_nik: sample.biodata_nik
        })
      }
      if (membersWithDept.length > 0 && membersWithDept[0]) {
        const sampleMember = membersWithDept[0];
        console.log('[MEMBERS UI] Sample member with departments:', {
          id: sampleMember?.id,
          department_id: sampleMember?.department_id,
          departments: sampleMember?.departments,
          departments_name: sampleMember?.departments?.name || (Array.isArray(sampleMember?.departments) ? sampleMember?.departments[0]?.name : null),
          departments_keys: sampleMember?.departments ? Object.keys(sampleMember.departments) : null
        })
      }
      
      // Log first member structure for debugging
      if (members.length > 0) {
        console.log('[MEMBERS UI] First member full structure:', members[0])
      }
    }
  }, [members])

  React.useEffect(() => {
    setPage(1)
  }, [searchQuery])

  //komentar
  // Fetch data for invite form
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["org-roles"],
    queryFn: getOrgRoles,
    enabled: inviteDialogOpen,
  })
  
  const { data: departments = [], isLoading: deptLoading } = useGroups({ enabled: inviteDialogOpen })
  const { data: positions = [], isLoading: posLoading } = usePositions({ enabled: inviteDialogOpen })

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


  // Monitor organization changes
  React.useEffect(() => {
    if (organizationId) {
      console.log('[MEMBERS] Organization changed to:', organizationId)
    }
  }, [organizationId])

  // Initial fetch handled by useInfiniteQuery
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
        await queryClient.invalidateQueries({ queryKey: ['members', 'paged', organizationId, searchQuery, page, pageSize]})
        setInviteDialogOpen(false)
        inviteForm.reset()
        await refetch()
      } else {
        toast.error(result.message || "Failed to send invitation")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setSubmittingInvite(false)
    }
  }

  const handleRefresh = async () => {
    try {
      // Clear all members cache
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('members:')) {
            localStorage.removeItem(key)
          }
        })
      }
      // Force refresh data
      await refetch()
      toast.success("Data has been refreshed!")
      await queryClient.invalidateQueries({ queryKey: ['members', 'paged', organizationId, searchQuery, page, pageSize]})
    } catch (error) {
      toast.error("Failed to refresh data")
    }
  }

  const handleExportMembers = async () => {
    try {
      const hasSelection = selectedMemberIds.length > 0
      const exportSource = hasSelection
        ? members.filter((m) => selectedMemberIds.includes(String(m.id)))
        : members

      if (!exportSource.length) {
        toast.warning("Tidak ada data member untuk diekspor")
        return
      }

      if (!selectedExportFields.length) {
        toast.error("Pilih minimal satu kolom untuk diekspor")
        return
      }

      setExporting(true)
      const XLSX = await import("xlsx")

      const rows = exportSource.map((member: any) => {
        const row: Record<string, any> = {}
        // Selalu buat semua kolom, tapi isi hanya yang dipilih.
        EXPORT_FIELDS.forEach((field) => {
          if (selectedExportFields.includes(field.key)) {
            row[field.label] = field.getValue(member)
          } else {
            row[field.label] = "" // kolom tetap ada tapi datanya kosong
          }
        })
        return row
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
      toast.success("Succesfully exported members")
      await queryClient.invalidateQueries({ queryKey: ['members']})
    } catch (error) {
      console.error("Export members error:", error)
      toast.error("Gagal mengekspor data members")
    } finally {
      setExporting(false)
    }
  }


  const handleDialogOpenChange = (open: boolean) => {
    setInviteDialogOpen(open)
    if (!open) {
      inviteForm.reset()
    }
  }

  return (
    (!isHydrated || (loading && members.length === 0)) ? (
      <MembersPageSkeleton />
    ) : (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <div className="w-full">
        <div className="w-full bg-card rounded-lg shadow-sm border">
          
          <div className="p-4 md:p-6 space-y-4 overflow-x-auto">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-between" suppressHydrationWarning>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3 sm:gap-2 flex-wrap items-center" suppressHydrationWarning>
                {/* Export dialog untuk memilih kolom yang akan diekspor */}
                <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Export Members</DialogTitle>
                      <DialogDescription>
                        Pilih kolom apa saja yang akan disertakan dalam file Excel. Jika tidak ada member yang
                        dipilih di tabel, maka semua member akan diekspor.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="border rounded-lg">
                        <div className="px-3 py-2 border-b bg-muted/50 text-sm font-semibold">
                          Field-field tersedia
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          <ul className="divide-y">
                            {EXPORT_FIELDS.filter((f) => !selectedExportFields.includes(f.key)).map(
                              (field) => (
                                <li
                                  key={field.key}
                                  className="flex items-center justify-between px-3 py-2 text-sm"
                                >
                                  <span>{field.label}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      setSelectedExportFields((prev) => [...prev, field.key])
                                    }
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                      <div className="border rounded-lg">
                        <div className="px-3 py-2 border-b bg-muted/50 text-sm font-semibold">
                          Kolom untuk diekspor
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {selectedExportFields.length === 0 ? (
                            <p className="px-3 py-4 text-sm text-muted-foreground">
                              Belum ada kolom yang dipilih. Tambahkan dari daftar di sebelah kiri.
                            </p>
                          ) : (
                            <ul className="divide-y">
                              {selectedExportFields.map((key) => {
                                const field = EXPORT_FIELDS.find((f) => f.key === key)
                                if (!field) return null
                                return (
                                  <li
                                    key={field.key}
                                    className="flex items-center justify-between px-3 py-2 text-sm"
                                  >
                                    <span>{field.label}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        setSelectedExportFields((prev) =>
                                          prev.filter((k) => k !== field.key),
                                        )
                                      }
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {selectedMemberIds.length > 0
                          ? `${selectedMemberIds.length} member terpilih akan diekspor.`
                          : `Tidak ada member yang dipilih di tabel, semua ${members.length} member akan diekspor.`}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setExportDialogOpen(false)}
                          disabled={exporting}
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={async () => {
                            await handleExportMembers()
                            setExportDialogOpen(false)
                          }}
                          disabled={exporting}
                        >
                          {exporting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Mengekspor...
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="mr-2 h-4 w-4" />
                              Ekspor
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExportDialogOpen(true)}
                  disabled={loading || exporting}
                  className="whitespace-nowrap"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="whitespace-nowrap"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoadingInviteData}
                  className="whitespace-nowrap"
                >
                  <Link href="/members/import-simple">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Import
                  </Link>
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

            <div className="mt-6">
              {loading && members.length === 0 ? (
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
                    onDelete={() => { refetch() }}
                    showPagination={false}
                  />

                  {/* Footer Pagination (page-based) */}
                  <div className="flex items-center justify-between py-4 px-4 bg-muted/50 rounded-md border mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={() => setPage(1)}
                        disabled={page <= 1 || loading || isFetching}
                        title="First page"
                      >
                        «
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1 || loading || isFetching}
                        title="Previous page"
                      >
                        ‹
                      </Button>

                      <span className="text-sm text-muted-foreground">Page</span>

                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={page}
                        onChange={(e) => {
                          const p = e.target.value ? Number(e.target.value) : 1
                          setPage(Math.max(1, Math.min(p, totalPages)))
                        }}
                        className="w-14 h-8 px-2 border rounded text-sm text-center bg-background"
                        disabled={loading || isFetching}
                      />

                      <span className="text-sm text-muted-foreground">/ {totalPages}</span>

                      <Button
                        variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages || loading || isFetching}
                        title="Next page"
                      >
                        ›
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={() => setPage(totalPages)}
                        disabled={page >= totalPages || loading || isFetching}
                        title="Last page"
                      >
                        »
                      </Button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        {total > 0
                          ? <>Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} total records</>
                          : <>Showing 0 to 0 of 0 total records</>
                        }
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            const next = Number(e.target.value)
                            setPageSize(next)
                            setPage(1) // reset ke halaman 1
                          }}
                          className="px-2 py-1 border rounded text-sm bg-background"
                          disabled={loading || isFetching}
                        >
                          <option value={10}>10</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ))
}
