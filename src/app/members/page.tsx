"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash, Pencil, Eye, User, Shield, Check, X, Mail, Plus, Search, Filter, ChevronDown } from "lucide-react"
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

// Components
import { DataTable } from "@/components/data-table"
import { TableSkeleton } from "@/components/ui/loading-skeleton"

// Types
import { IOrganization_member } from "@/interface"

// Actions
import { deleteOrganization_member, getAllOrganization_member } from "@/action/members"
import { getAllUsers } from "@/action/users"
import { getAllGroups } from "@/action/group"
import { createClient } from "@/utils/supabase/client"
import { createInvitation } from "@/action/invitations"
import { getOrgRoles } from "@/lib/rbac"
import { useGroups } from "@/hooks/use-groups"
import { usePositions } from "@/hooks/use-positions"

// UI Components
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

// Schema untuk form invite
const inviteSchema = z.object({
  email: z.string().email("Email tidak valid"),
  role_id: z.string().optional(),
  department_id: z.string().optional(),
  position_id: z.string().optional(),
  message: z.string().max(500, "Pesan terlalu panjang (maksimal 500 karakter)").optional(),
})

type InviteFormValues = z.infer<typeof inviteSchema>

export default function MembersPageResponsive() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [members, setMembers] = useState<IOrganization_member[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [submittingInvite, setSubmittingInvite] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Cek ukuran layar
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-open invite dialog jika ada parameter action=invite di URL
  useEffect(() => {
    if (searchParams.get('action') === 'invite') {
      setInviteDialogOpen(true)
    }
  }, [searchParams])

  // Ambil data untuk form invite
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
      
      // Ambil organization ID
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

      // Ambil semua data
      const [memberRes, userRes, groupsRes] = await Promise.all([
        getAllOrganization_member(),
        getAllUsers(),
        getAllGroups(),
      ])

      if (!memberRes.success) throw new Error(memberRes.message)

      const membersData = memberRes.data
      const usersData = userRes.success ? userRes.data : []
      const groupsData = groupsRes?.data || []

      // Buat peta group
      const groupMap = new Map<string, string>()
      groupsData.forEach((g: any) => {
        if (g && g.id) groupMap.set(String(g.id), g.name)
      })
      
      // Gabungkan data
      const mergedMembers = membersData.map((m: any) => {
        const u = usersData.find((usr: any) => usr.id === m.user_id)
        const groupName =
          groupMap.get(String(m.department_id)) ||
          (m.groups && (m.groups as any).name) ||
          (m.departments && (m.departments as any).name) ||
          ""
        return { ...m, user: u, groupName }
      })

      // Filter berdasarkan organisasi
      const filteredMembers = orgId
        ? mergedMembers.filter((m: any) => String(m.organization_id) === orgId)
        : mergedMembers
      
      setMembers(filteredMembers)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  async function handleDelete(id: string) {
    try {
      setLoading(true)
      const res = await deleteOrganization_member(id)
      if (!res.success) throw new Error(res.message)
      toast.success("Anggota berhasil dihapus")
      fetchMembers()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan")
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
        toast.success("Undangan berhasil dikirim via email!")
        setInviteDialogOpen(false)
        inviteForm.reset()
        fetchMembers()
      } else {
        toast.error(result.message || "Gagal mengirim undangan")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan")
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

  // Kolom untuk tampilan mobile
  const mobileColumns: ColumnDef<IOrganization_member>[] = [
    {
      id: "userFullName",
      header: "Anggota",
      cell: ({ row }) => {
        const user = (row.original as any).user
        const fullname = user
          ? [user.first_name, user.middle_name, user.last_name]
              .filter((part: any) => part && part.trim() !== "")
              .join(" ") ||
            user.display_name ||
            user.email ||
            "Tidak Ada Pengguna"
          : "Tidak Ada Pengguna"
          
        const role = (row.original as any).role?.name || ""
        const groupName = (row.original as any).groupName || ""
        const isActive = row.getValue("is_active") as boolean
        
        return (
          <div className="space-y-2 py-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium truncate" title={fullname}>{fullname}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{role}</span>
              </div>
              <div className="truncate">{groupName}</div>
              <div className="inline-flex items-center">
                {isActive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    <span>Aktif</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
                    <span>Tidak Aktif</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => router.push(`/members/edit/${row.original.id}`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => router.push(`/members/${row.original.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Anggota</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus anggota ini? Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(row.original.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )
      },
    },
  ]

  // Kolom untuk tampilan desktop
  const desktopColumns: ColumnDef<IOrganization_member>[] = [
    {
      id: "userFullName",
      accessorFn: (row: any) => {
        const user = row.user
        return user
          ? [user.first_name, user.middle_name, user.last_name]
              .filter((part: any) => part && part.trim() !== "")
              .join(" ") ||
            user.display_name ||
            user.email ||
            "Tidak Ada Pengguna"
          : "Tidak Ada Pengguna"
      },
      header: "Anggota",
      cell: ({ row }) => {
        const user = (row.original as any).user
        const fullname = user
          ? [user.first_name, user.middle_name, user.last_name]
              .filter((part: any) => part && part.trim() !== "")
              .join(" ") ||
            user.display_name ||
            user.email ||
            "Tidak Ada Pengguna"
          : "Tidak Ada Pengguna"
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
      header: "Nomor Telepon",
      cell: ({ row }) => {
        const phone = (row.original as any).user?.phone ?? "-"
        return (
          <span className="truncate block text-center" title={phone}>
            {phone}
          </span>
        )
      },
    },
    {
      accessorFn: (row: any) => row.groupName || "",
      header: "Grup",
      cell: ({ row }) => {
        const group = (row.original as any).groupName || "-"
        return (
          <span className="truncate block text-center" title={group}>
            {group}
          </span>
        )
      },
    },
    {
      header: "Peran",
      cell: ({ row }) => {
        const role = (row.original as any).role
        if (!role) return <Badge variant="outline" className="truncate">Tidak Ada Peran</Badge>
        
        const isAdmin = role.code === "A001"
        return (
          <Badge variant={isAdmin ? "default" : "secondary"} className="flex items-center gap-1 w-fit max-w-full mx-auto" title={role.name}>
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
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white whitespace-nowrap mx-auto">
            <Check className="w-3 h-3 mr-1 flex-shrink-0" /> 
            <span className="truncate">Aktif</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-300 text-black whitespace-nowrap mx-auto">
            <X className="w-3 h-3 mr-1 flex-shrink-0" /> 
            <span className="truncate">Tidak Aktif</span>
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const member = row.original
        
        return (
          <div className="flex gap-1 justify-center">
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
                  className="text-destructive border-0 cursor-pointer h-8 w-8"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Anggota</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus anggota ini? Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(member.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  // Pilih kolom berdasarkan ukuran layar
  const columns = isMobile ? mobileColumns : desktopColumns

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Daftar Anggota</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Tombol Undang Anggota */}
          <Dialog open={inviteDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Undang Anggota
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Undang Anggota Baru</DialogTitle>
                <DialogDescription>
                  Kirim undangan email untuk menambahkan anggota baru ke organisasi Anda
                </DialogDescription>
              </DialogHeader>

              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(onSubmitInvite)} className="space-y-4">
                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat Email *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="contoh@email.com"
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
                        <FormLabel>Peran (Opsional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={submittingInvite || isLoadingInviteData}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih peran..." />
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
                        <FormLabel>Departemen (Opsional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={submittingInvite || isLoadingInviteData}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih departemen..." />
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
                        <FormLabel>Posisi (Opsional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={submittingInvite || isLoadingInviteData}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih posisi..." />
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
                        <FormLabel>Pesan Selamat Datang (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Selamat bergabung di tim kami!"
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
                    {submittingInvite ? "Mengirim..." : "Kirim Undangan"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={isMobile ? 1 : 6} />
      ) : members.length === 0 ? (
        <div className="mt-10">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <User className="h-14 w-14 text-muted-foreground mx-auto" />
              </EmptyMedia>
              <EmptyTitle>Belum ada anggota</EmptyTitle>
              <EmptyDescription>
                Belum ada anggota untuk organisasi ini. Gunakan tombol "Undang Anggota" untuk menambahkan.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setInviteDialogOpen(true)}>Undang Anggota</Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <DataTable 
            columns={columns} 
            data={members}
            isLoading={loading}
            searchPlaceholder="Cari berdasarkan nama, email, atau nomor telepon..."
          />
        </div>
      )}
    </div>
  )
}
