"use server"

import { createAdminClient } from "@/utils/supabase/admin"
import { IOrganization_member } from "@/interface"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GetGroupMembersParams {
  /** departments.id — integer string, atau "no-group" untuk null department */
  departmentId: string
  organizationId: string | number
  page?: number
  pageSize?: number
  search?: string
}

export interface GetGroupMembersResult {
  success: boolean
  message?: string
  data: IOrganization_member[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function getGroupMembers({
  departmentId,
  organizationId,
  page = 1,
  pageSize = 10,
  search = "",
}: GetGroupMembersParams): Promise<GetGroupMembersResult> {
  const admin = createAdminClient()

  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  const empty = {
    success: true,
    data: [],
    pagination: { total: 0, page, pageSize, totalPages: 0 },
  }

  try {
    // ── Build base select ────────────────────────────────────────────────────
    // Pola ini diambil dari getOrganizationMembersPaginated yang sudah terbukti
    // bekerja — pakai foreignTable: "user" untuk search via joined table

    const selectFields = `
      *,
      user:user_id${search ? "!inner" : ""} (
        id,
        email,
        first_name,
        last_name,
        display_name,
        profile_photo_url,
        jenis_kelamin,
        nik,
        agama,
        search_name,
        is_active
      ),
      departments:department_id (
        id,
        name,
        code,
        organization_id
      ),
      positions:position_id (
        id,
        title,
        code
      ),
      organization_member_roles (
        id,
        role:system_roles (
          id,
          code,
          name,
          description
        )
      )
    `

    // ── Count query ──────────────────────────────────────────────────────────
    let countQuery = admin
      .from("organization_members")
      .select(
        `id, user:user_id${search ? "!inner" : ""} (id)`,
        { count: "planned", head: true }
      )
      .eq("organization_id", organizationId)

    if (departmentId === "no-group") {
      countQuery = countQuery.is("department_id", null)
    } else {
      countQuery = countQuery.eq("department_id", departmentId)
    }

    if (search) {
      const q = search.trim()
      countQuery = countQuery.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,display_name.ilike.%${q}%,search_name.ilike.%${q}%`,
        { foreignTable: "user" }
      )
    }

    const { count } = await countQuery
    const total     = count ?? 0
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    if (total === 0) return empty

    // ── Data query ───────────────────────────────────────────────────────────
    let dataQuery = admin
      .from("organization_members")
      .select(selectFields, { count: "planned" })
      .eq("organization_id", organizationId)

    if (departmentId === "no-group") {
      dataQuery = dataQuery.is("department_id", null)
    } else {
      dataQuery = dataQuery.eq("department_id", departmentId)
    }

    if (search) {
      const q = search.trim()
      // Pola persis sama dengan getOrganizationMembersPaginated yang sudah bekerja
      dataQuery = dataQuery.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,display_name.ilike.%${q}%,search_name.ilike.%${q}%`,
        { foreignTable: "user" }
      )
    }

    const { data, error } = await dataQuery
      .order("id", { ascending: true })
      .range(from, to)

    if (error) {
      console.error("[getGroupMembers] error:", error.message)
      return { success: false, message: error.message, data: [], pagination: { total: 0, page, pageSize, totalPages: 0 } }
    }

    // ── Normalize ────────────────────────────────────────────────────────────
    const items = (data ?? []).map((m: any) => {
      // Normalize roles from join table
      if (m.organization_member_roles) {
        const roles = m.organization_member_roles;
        if (Array.isArray(roles) && roles.length > 0) {
          const roleData = roles[0].role;
          const normalizedRole = Array.isArray(roleData) ? roleData[0] : roleData;
          m.role = normalizedRole;
          m.role_id = normalizedRole?.id;
        }
      }

      // Normalize departments array → object
      if (Array.isArray(m.departments)) {
        m.departments = m.departments.length > 0 ? m.departments[0] : null
      }
      // Computed fields untuk kompatibilitas dengan MembersTable
      const u = m.user
      const firstName   = (u?.first_name ?? "").trim()
      const lastName    = (u?.last_name ?? "").trim()
      const displayName = (u?.display_name ?? "").trim()
      const fullName    = [firstName, lastName].filter(Boolean).join(" ")
      m.computed_name = displayName || fullName || u?.email || null
      m.groupName     = m.departments?.name ?? null
      m.biodata_nik   = m.biodata_nik ?? null
      return m as IOrganization_member
    })

    return {
      success: true,
      data: items,
      pagination: { total, page, pageSize, totalPages },
    }
  } catch (err) {
    console.error("[getGroupMembers] unexpected error:", err)
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
      data: [],
      pagination: { total: 0, page, pageSize, totalPages: 0 },
    }
  }
}