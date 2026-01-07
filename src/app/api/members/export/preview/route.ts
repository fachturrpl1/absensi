import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const organizationId = searchParams.get("organizationId")
    const search = searchParams.get("search") || ""
    const active = searchParams.get("active") || "all"
    const groupsParam = searchParams.get("groups") || ""
    const gendersParam = searchParams.get("genders") || ""
    const agamasParam = searchParams.get("agamas") || ""
    const fieldsParam = searchParams.get("fields") || ""
    const selectedFields = fieldsParam ? fieldsParam.split(",") : []
    const selectedGroups = groupsParam ? groupsParam.split(",").filter(Boolean) : []
    const selectedGenders = gendersParam ? gendersParam.split(",").filter(Boolean) : []
    const selectedAgamas = agamasParam ? agamasParam.split(",").filter(Boolean) : []

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: "Organization ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      )
    }

    // Verify user is member of organization
    const { data: member } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (!member) {
      return NextResponse.json(
        { success: false, message: "User is not a member of the specified organization" },
        { status: 403 }
      )
    }

    // Build query
    let query = adminClient
      .from("organization_members")
      .select(`
        id,
        biodata_nik,
        employee_id,
        is_active,
        hire_date,
        biodata:biodata_nik (
          nik,
          nama,
          nickname,
          email,
          no_telepon,
          jenis_kelamin,
          tanggal_lahir,
          tempat_lahir,
          agama,
          jalan,
          rt,
          rw,
          dusun,
          kelurahan,
          kecamatan
        ),
        departments:department_id (
          id,
          name
        ),
        positions:position_id (
          id,
          title
        )
      `)
      .eq("organization_id", organizationId)
      .limit(limit)

    // Apply filters
    if (active === "active") {
      query = query.eq("is_active", true)
    } else if (active === "inactive") {
      query = query.eq("is_active", false)
    }

    // Apply group filter (multiple)
    if (selectedGroups.length > 0) {
      query = query.in("department_id", selectedGroups.map(id => parseInt(id, 10)))
    }

    const { data: members, error } = await query

    if (error) {
      console.error("Error fetching members:", error)
      return NextResponse.json(
        { success: false, message: "Failed to fetch members" },
        { status: 500 }
      )
    }

    // Filter by search, gender, and agama in memory (since they require biodata join)
    // Helper function to extract biodata from Supabase relation
    const getBiodata = (member: any) => {
      if (Array.isArray(member.biodata)) {
        return member.biodata[0] || {}
      } else if (member.biodata && typeof member.biodata === 'object') {
        return member.biodata
      }
      return {}
    }

    // Filter out members without biodata (admin yang dibuat langsung tanpa biodata)
    let filteredMembers = (members || []).filter((member: any) => {
      const biodata = getBiodata(member)
      // Exclude members yang tidak punya biodata_nik dan tidak punya biodata data
      return member.biodata_nik || (biodata && Object.keys(biodata).length > 0)
    })

    if (search) {
      const searchLower = search.toLowerCase()
      filteredMembers = filteredMembers.filter((member: any) => {
        const biodata = getBiodata(member)
        return (
          member.biodata_nik?.toLowerCase().includes(searchLower) ||
          member.employee_id?.toLowerCase().includes(searchLower) ||
          biodata.nama?.toLowerCase().includes(searchLower) ||
          biodata.email?.toLowerCase().includes(searchLower)
        )
      })
    }

    if (selectedGenders.length > 0) {
      filteredMembers = filteredMembers.filter((member: any) => {
        const biodata = getBiodata(member)
        return selectedGenders.includes(biodata.jenis_kelamin)
      })
    }

    if (selectedAgamas.length > 0) {
      filteredMembers = filteredMembers.filter((member: any) => {
        const biodata = getBiodata(member)
        return selectedAgamas.includes(biodata.agama)
      })
    }

    // Limit results
    filteredMembers = filteredMembers.slice(0, limit)

    // Transform data based on selected fields - ONLY biodata columns
    const transformedData = filteredMembers.map((member: any) => {
      const biodata = getBiodata(member)

      const row: Record<string, any> = {}

      // Only include fields from biodata table
      if (selectedFields.includes("nik")) {
        row.nik = member.biodata_nik || biodata.nik || "-"
      }
      if (selectedFields.includes("nama")) {
        row.nama = biodata.nama || "-"
      }
      if (selectedFields.includes("nickname")) {
        row.nickname = biodata.nickname || "-"
      }
      if (selectedFields.includes("nisn")) {
        row.nisn = biodata.nisn || "-"
      }
      if (selectedFields.includes("jenis_kelamin")) {
        row.jenis_kelamin = biodata.jenis_kelamin || "-"
      }
      if (selectedFields.includes("tempat_lahir")) {
        row.tempat_lahir = biodata.tempat_lahir || "-"
      }
      if (selectedFields.includes("tanggal_lahir")) {
        row.tanggal_lahir = biodata.tanggal_lahir || "-"
      }
      if (selectedFields.includes("agama")) {
        row.agama = biodata.agama || "-"
      }
      if (selectedFields.includes("jalan")) {
        row.jalan = biodata.jalan || "-"
      }
      if (selectedFields.includes("rt")) {
        row.rt = biodata.rt || "-"
      }
      if (selectedFields.includes("rw")) {
        row.rw = biodata.rw || "-"
      }
      if (selectedFields.includes("dusun")) {
        row.dusun = biodata.dusun || "-"
      }
      if (selectedFields.includes("kelurahan")) {
        row.kelurahan = biodata.kelurahan || "-"
      }
      if (selectedFields.includes("kecamatan")) {
        row.kecamatan = biodata.kecamatan || "-"
      }
      if (selectedFields.includes("no_telepon")) {
        row.no_telepon = biodata.no_telepon || "-"
      }
      if (selectedFields.includes("email")) {
        row.email = biodata.email || "-"
      }
      if (selectedFields.includes("department_id")) {
        row.department_id = biodata.department_id || "-"
      }

      return row
    })

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
    })
  } catch (error: any) {
    console.error("Error in export preview:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

