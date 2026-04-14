"use client"

import React, { useState, useEffect } from "react"
import { useOrgStore } from "@/store/org-store"
import { getOrgSettings, upsertOrgSetting, getAllMemberSettings, upsertMemberSetting } from "@/action/organization-settings"
import { toast } from "sonner"
import { Info, Building2, Search } from "lucide-react"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/customs/pagination-footer"

type ProjectRoleOption = "none" | "viewer" | "user" | "manager"

export default function ProjectAndTaskPage() {
    const { organizationId } = useOrgStore()
    const [loading, setLoading] = useState(true)
    const [defaultRole, setDefaultRole] = useState<ProjectRoleOption>("none")

    // Individual settings state
    const [members, setMembers] = useState<any[]>([])
    const [memberSettingsMap, setMemberSettingsMap] = useState<Record<number, any>>({})
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    
    // Pagination states
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalMembers, setTotalMembers] = useState(0)

    const totalPages = Math.ceil(totalMembers / pageSize) || 1
    const from = totalMembers === 0 ? 0 : (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, totalMembers)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Reset pagination to 1 when search changes
    useEffect(() => {
        setPage(1)
    }, [debouncedQuery])

    // Load org settings & all individual member overrides
    useEffect(() => {
        async function loadData() {
            if (!organizationId) {
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                const orgIdStr = String(organizationId)
                
                const res = await getOrgSettings(orgIdStr)
                if (res.success && res.data && res.data.default_project_role) {
                    setDefaultRole(res.data.default_project_role as ProjectRoleOption)
                }

                const memberSettingsRes = await getAllMemberSettings(orgIdStr)
                if (memberSettingsRes.success && memberSettingsRes.data) {
                    setMemberSettingsMap(memberSettingsRes.data)
                }
            } catch (err) {
                console.error("Failed to load project & task settings", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [organizationId])

    // Load paginated members when query or page changes
    useEffect(() => {
        async function fetchMembers() {
            if (!organizationId) return
            try {
                const url = new URL('/api/members', window.location.origin)
                url.searchParams.set('limit', String(pageSize))
                url.searchParams.set('page', String(page))
                url.searchParams.set('organizationId', String(organizationId))
                if (debouncedQuery) url.searchParams.set('search', debouncedQuery)

                const res = await fetch(url.toString(), { credentials: 'same-origin' })
                const json = await res.json()

                if (json.success) {
                    setMembers(json.data || [])
                    setTotalMembers(json.pagination?.total || 0)
                }
            } catch (error) {
                console.error("Failed to fetch members:", error)
            }
        }
        fetchMembers()
    }, [organizationId, debouncedQuery, page, pageSize])

    const handleGlobalRoleChange = async (role: ProjectRoleOption) => {
        setDefaultRole(role)
        if (!organizationId) return
        try {
            await upsertOrgSetting(String(organizationId), {
                default_project_role: role
            })
            toast.success("Default project role updated")
        } catch (err) {
            toast.error("Failed to update settings")
        }
    }

    const handleIndividualRoleChange = async (memberId: string | number, currentRole: ProjectRoleOption, newRole: ProjectRoleOption) => {
        if (!organizationId) return
        
        // Optimistic update
        setMemberSettingsMap(prev => ({
             ...prev,
             [Number(memberId)]: {
                 ...(prev[Number(memberId)] || {}),
                 default_project_role: newRole
             }
        }))

        try {
            await upsertMemberSetting(String(memberId), {
                default_project_role: newRole
            })
            toast.success("Individual project role updated")
        } catch (err) {
            toast.error("Failed to update individual setting")
            // Revert on failure
             setMemberSettingsMap(prev => ({
                 ...prev,
                 [Number(memberId)]: {
                     ...(prev[Number(memberId)] || {}),
                     default_project_role: currentRole
                 }
            }))
        }
    }

    const tabs: SettingTab[] = [
        { label: "PROJECTS & TO-DOS", href: "/features/settings/project&task", active: true },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "default-roles", label: "Default project role", href: "/features/settings/project&task" },
        { id: "complete-todos", label: "Complete to-dos", href: "/features/settings/project&task/complete-todos" },
        { id: "manage-todos", label: "Manage to-dos", href: "/features/settings/project&task/manage-todos" },
        { id: "allow-project-tracking", label: "Allow project tracking", href: "/features/settings/project&task/allow-project-tracking" },
        { id: "global-todos", label: "Global to-dos", href: "/features/settings/project&task/global-todos" },
    ]

    const ROLE_OPTIONS: { label: string, value: ProjectRoleOption }[] = [
        { label: "None", value: "none" },
        { label: "Viewer", value: "viewer" },
        { label: "User", value: "user" },
        { label: "Manager", value: "manager" }
    ]

    const getInitials = (first: string, last: string) => {
        return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase()
    }

    if (loading && !organizationId) {
        return null
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Organization"
                Icon={Building2}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="default-roles"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="default-roles">
                <div className="flex flex-1 w-full overflow-hidden">
                    <div className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
                        
                        {/* GLOBAL DEFAULT SECTION */}
                        <div className="mb-12">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
                                    DEFAULT PROJECT ROLE
                                </span>
                                <Info className="w-3.5 h-3.5 text-slate-800" />
                            </div>
                            <p className="text-[13px] text-slate-500 mb-6">
                                When creating a new project, members will be assigned by default to the selected role.
                            </p>

                            <div className="flex items-center gap-1.5 mb-2.5">
                                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
                                    GLOBAL:
                                </span>
                                <Info className="w-3.5 h-3.5 text-slate-800" />
                            </div>

                            <div className="flex bg-slate-100 rounded-full p-1 w-fit">
                                {ROLE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleGlobalRoleChange(opt.value)}
                                        className={`px-8 py-2 text-[13px] font-medium rounded-full transition-all ${
                                            defaultRole === opt.value
                                                ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-black/5"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* INDIVIDUAL SETTINGS SECTION */}
                        <div className="border-t border-slate-100 pt-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-800 mb-1">Individual settings</h2>
                                    <p className="text-[13px] text-slate-500">
                                        Override the organization default for specific members
                                    </p>
                                </div>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search members" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-10 w-full rounded-2xl border-slate-200 bg-white shadow-sm focus-visible:ring-slate-300"
                                    />
                                </div>
                            </div>

                            {/* Table Header */}
                            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                                <div className="flex-1 text-[13px] font-semibold text-slate-800 tracking-wide">Name</div>
                            </div>

                            {/* Member Rows */}
                            <div className="divide-y divide-slate-100">
                                {members.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-slate-500">No members found</div>
                                ) : (
                                    members.map((member) => {
                                        const individualRole = (memberSettingsMap[member.id]?.default_project_role as ProjectRoleOption) || "none";
                                        
                                        return (
                                            <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-200 items-center justify-center">
                                                        {member.user?.avatar_url ? (
                                                            <img src={member.user.avatar_url} alt="Avatar" className="aspect-square h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs text-slate-700 font-medium">
                                                                {getInitials(member.user?.first_name, member.user?.last_name)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[13px] font-medium text-slate-700">
                                                        {member.user?.first_name} {member.user?.last_name}
                                                    </span>
                                                </div>

                                                <div className="flex bg-slate-100/80 rounded-full p-1 scale-90 sm:scale-100 origin-right">
                                                    {ROLE_OPTIONS.map((opt) => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => handleIndividualRoleChange(member.id, individualRole, opt.value)}
                                                            className={`px-6 py-1.5 text-[12px] font-medium rounded-full transition-all ${
                                                                individualRole === opt.value
                                                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                                                                    : "text-slate-500 hover:text-slate-700 hover:bg-black/5"
                                                            }`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            {/* Pagination/Status Footer */}
                            <div className="mt-8 pt-4 border-t border-slate-100">
                                <PaginationFooter
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={(pageNumber) => setPage(pageNumber)}
                                    from={from}
                                    to={to}
                                    total={totalMembers}
                                    pageSize={pageSize}
                                    onPageSizeChange={(size) => {
                                        setPageSize(size)
                                        setPage(1)
                                    }}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </SettingsContentLayout>
        </div>
    )
}
