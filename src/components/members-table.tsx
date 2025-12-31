"use client"

import React from "react"
import { IOrganization_member } from "@/interface"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Eye, Check, X, Columns3Cog, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { deleteOrganization_member } from "@/action/members"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface MembersTableProps {
  members: IOrganization_member[]
  isLoading?: boolean
  onDelete?: () => void
  showPagination?: boolean
}

export function MembersTable({ members, isLoading = false, onDelete, showPagination = true }: MembersTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [sortOrder] = React.useState("newest")
  const [pageSize, setPageSize] = React.useState("10")
  const [pageIndex, setPageIndex] = React.useState(0)
  const [globalFilter] = React.useState("")
  const [statusFilter] = React.useState("all")
  const [visibleColumns, setVisibleColumns] = React.useState({
    members: true,
    // phone: true,
    nik: true,
    group: true,
    gender: true,
    religion: true,
    status: true,
    actions: true,
  })

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteOrganization_member(id)
      if (result.success) {
        toast.success("Member deleted successfully")
        await queryClient.invalidateQueries({ queryKey: ["members"] })
        onDelete?.()
      } else {
        toast.error(result.message || "Failed to delete member")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const getFullName = (member: IOrganization_member) => {
    const user = (member as any).user
    const biodata = (member as any).biodata
    
    // Try to get name from user first
    if (user) {
      const fullName = [user.first_name, user.middle_name, user.last_name]
        .filter((part: any) => part && part.trim() !== "")
        .join(" ")
      if (fullName) return fullName
      if (user.display_name) return user.display_name
      if (user.email) return user.email
    }
    
    // Fallback to biodata if user is null or has no name
    if (biodata) {
      if (biodata.nama) return biodata.nama
      if (biodata.nickname) return biodata.nickname
    }
    
    return "No Name"
  }

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let filtered = [...members]

    // Apply global search filter
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase()
      filtered = filtered.filter((member) => {
        const fullName = getFullName(member).toLowerCase()
        const phone = ((member as any).user?.phone || "").toLowerCase()
        const group = (
          (member as any).groupName || 
          (member as any).departments?.name || 
          (Array.isArray((member as any).departments) && (member as any).departments[0]?.name) || 
          ""
        ).toLowerCase()
        const nik = (((member as any).biodata?.nik || (member as any).biodata_nik || "") as string).toLowerCase()
        return (
          fullName.includes(searchTerm) ||
          phone.includes(searchTerm) ||
          group.includes(searchTerm) ||
          nik.includes(searchTerm)
        )
      })
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((member) => {
        if (statusFilter === "active") return member.is_active
        if (statusFilter === "inactive") return !member.is_active
        return true
      })
    }

    // Apply sorting
    if (sortOrder === "newest") {
      filtered.sort((a, b) => {
        const dateA = new Date((a as any).created_at || 0).getTime()
        const dateB = new Date((b as any).created_at || 0).getTime()
        return dateB - dateA
      })
    } else if (sortOrder === "oldest") {
      filtered.sort((a, b) => {
        const dateA = new Date((a as any).created_at || 0).getTime()
        const dateB = new Date((b as any).created_at || 0).getTime()
        return dateA - dateB
      })
    } else if (sortOrder === "a-z") {
      filtered.sort((a, b) => {
        const nameA = getFullName(a).toLowerCase()
        const nameB = getFullName(b).toLowerCase()
        return nameA.localeCompare(nameB)
      })
    } else if (sortOrder === "z-a") {
      filtered.sort((a, b) => {
        const nameA = getFullName(a).toLowerCase()
        const nameB = getFullName(b).toLowerCase()
        return nameB.localeCompare(nameA)
      })
    }

    return filtered
  }, [globalFilter, statusFilter, sortOrder, members])

  // Pagination
  const pageSizeNum = parseInt(pageSize)
  const totalPages = Math.ceil(filteredData.length / pageSizeNum)
  const paginatedData = showPagination
    ? filteredData.slice(
        pageIndex * pageSizeNum,
        (pageIndex + 1) * pageSizeNum
      )
    : filteredData

  // Reset page index when filters change
  React.useEffect(() => {
    setPageIndex(0)
  }, [globalFilter, statusFilter, sortOrder])

  // Clamp page index if it exceeds total pages
  React.useEffect(() => {
    if (pageIndex >= totalPages && totalPages > 0) {
      setPageIndex(totalPages - 1)
    }
  }, [totalPages, pageIndex])

  return (
    <div className="w-full space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">

        {/* Toggle Columns */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="hidden">
              <Columns3Cog className="h-4 w-4" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={visibleColumns.members}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, members: checked }))
              }
            >
              Members
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.nik}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, nik: checked }))
              }
            >
              NIK
            </DropdownMenuCheckboxItem>
            {/* <DropdownMenuCheckboxItem
              checked={visibleColumns.phone}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, phone: checked }))
              }
            >
              Phone Number
            </DropdownMenuCheckboxItem> */}
            <DropdownMenuCheckboxItem
              checked={visibleColumns.group}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, group: checked }))
              }
            >
              Group
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.gender}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, gender: checked }))
              }
            >
              Gender
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.religion}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, religion: checked }))
              }
            >
              Religion
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.status}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, status: checked }))
              }
            >
              Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.actions}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, actions: checked }))
              }
            >
              Actions
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
        {/* Header */}
        <thead className="bg-muted/50 border-b">
          <tr>
            {visibleColumns.members && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Members</th>
            )}
            {visibleColumns.nik && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">NIK</th>
            )}
            {/* {visibleColumns.phone && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Phone Number</th>
            )} */}
            {visibleColumns.group && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Group</th>
            )}
            {visibleColumns.gender && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Gender</th>
            )}
            {visibleColumns.religion && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Religion</th>
            )}
            {visibleColumns.status && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
            )}
            {visibleColumns.actions && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-8 text-center text-muted-foreground">
                Loading...
              </td>
            </tr>
          ) : paginatedData.length === 0 ? (
            <tr>
              <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-8 text-center text-muted-foreground">
                No members found
              </td>
            </tr>
          ) : (
            paginatedData.map((member) => {
              return (
                <tr key={member.id} className="border-b hover:bg-muted/30 transition-colors">
                  {visibleColumns.members && (
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => router.push(`/members/${member.id}`)}
                        className="truncate text-primary hover:underline cursor-pointer"
                        title="View profile"
                      >
                        {getFullName(member)}
                      </button>
                    </td>
                  )}
                  {visibleColumns.nik && (
                    <td className="px-4 py-3 text-sm">
                      {(member as any).biodata?.nik || "-"}
                    </td>
                  )}
                  {/* {visibleColumns.phone && (
                    <td className="px-4 py-3 text-sm">
                      {user?.phone || "No Phone"}
                    </td>
                  )} */}

                  {visibleColumns.group && (
                    <td className="px-4 py-3 text-sm">
                      {(member as any).groupName || 
                       ((member as any).departments?.name) || 
                       (Array.isArray((member as any).departments) && (member as any).departments[0]?.name) || 
                       "-"}
                    </td>
                  )}

                  {visibleColumns.gender && (
                    <td className="px-4 py-3 text-sm">
                      {(member as any).biodata?.jenis_kelamin || "-"}
                    </td>
                  )}

                  {visibleColumns.religion && (
                    <td className="px-4 py-3 text-sm">
                      {(member as any).biodata?.agama || "-"}
                    </td>
                  )}


                  {visibleColumns.status && (
                    <td className="px-4 py-3 text-sm">
                      {member.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-primary-foreground">
                          <Check className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          <X className="w-3 h-3 mr-1" /> Inactive
                        </span>
                      )}
                    </td>
                  )}

                  {visibleColumns.actions && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/members/edit/${member.id}`)}
                          title="Edit member"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/members/${member.id}`)}
                          title="View member"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Delete member"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {getFullName(member)}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(member.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
      </div>

      {/* Pagination Footer */}
      {showPagination && (
      <div className="flex items-center justify-between py-4 px-4 bg-muted/50 rounded-md border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPageIndex(0)}
            disabled={pageIndex === 0 || isLoading}
            className="h-8 w-8 p-0"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0 || isLoading}
            className="h-8 w-8 p-0"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground">Page</span>
          
          <input
            type="number"
            min="1"
            max={totalPages}
            value={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              setPageIndex(Math.max(0, Math.min(page, totalPages - 1)))
            }}
            className="w-12 h-8 px-2 border rounded text-sm text-center bg-background"
            disabled={isLoading}
          />
          
          <span className="text-sm text-muted-foreground">/ {totalPages || 1}</span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPageIndex(Math.min(totalPages - 1, pageIndex + 1))}
            disabled={pageIndex >= totalPages - 1 || isLoading}
            className="h-8 w-8 p-0"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPageIndex(totalPages - 1)}
            disabled={pageIndex >= totalPages - 1 || isLoading}
            className="h-8 w-8 p-0"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredData.length > 0 ? pageIndex * parseInt(pageSize) + 1 : 0} to {Math.min((pageIndex + 1) * parseInt(pageSize), filteredData.length)} of {filteredData.length} total records
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value)
                setPageIndex(0)
              }}
              className="px-2 py-1 border rounded text-sm bg-background"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
