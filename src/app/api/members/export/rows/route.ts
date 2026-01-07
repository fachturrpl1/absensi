import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId")
    const search = searchParams.get("search") || ""
    const active = searchParams.get("active") || "all"
    const groupsParam = searchParams.get("groups") || ""
    const gendersParam = searchParams.get("genders") || ""
    const agamasParam = searchParams.get("agamas") || ""
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "1000", 10)
    
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

    // Build query - fetch ALL biodata columns
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
          nisn,
          jenis_kelamin,
          tempat_lahir,
          tanggal_lahir,
          agama,
          jalan,
          rt,
          rw,
          dusun,
          kelurahan,
          kecamatan,
          no_telepon,
          email,
          department_id
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
          biodata.email?.toLowerCase().includes(searchLower) ||
          biodata.nik?.toLowerCase().includes(searchLower)
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

    // Apply pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedMembers = filteredMembers.slice(startIndex, endIndex)

    // Transform to flat structure with ONLY biodata columns
    const transformedData = paginatedMembers.map((member: any) => {
      const biodata = getBiodata(member)

      // Return ONLY biodata columns (all columns from biodata table)
      return {
        nik: member.biodata_nik || biodata.nik || "",
        nama: biodata.nama || "",
        nickname: biodata.nickname || "",
        nisn: biodata.nisn || "",
        jenis_kelamin: biodata.jenis_kelamin || "",
        tempat_lahir: biodata.tempat_lahir || "",
        tanggal_lahir: biodata.tanggal_lahir || "",
        agama: biodata.agama || "",
        jalan: biodata.jalan || "",
        rt: biodata.rt || "",
        rw: biodata.rw || "",
        dusun: biodata.dusun || "",
        kelurahan: biodata.kelurahan || "",
        kecamatan: biodata.kecamatan || "",
        no_telepon: biodata.no_telepon || "",
        email: biodata.email || "",
        department_id: biodata.department_id || "",
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      total: filteredMembers.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredMembers.length / pageSize),
    })
  } catch (error: any) {
    console.error("Error in export rows:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

