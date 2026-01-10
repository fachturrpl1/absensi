import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get("format") || "xlsx"
    const organizationId = searchParams.get("organizationId")
    const search = searchParams.get("search") || ""
    const active = searchParams.get("active") || "all"
    const groupsParam = searchParams.get("groups") || ""
    const gendersParam = searchParams.get("genders") || ""
    const agamasParam = searchParams.get("agamas") || ""
    const fieldsParam = searchParams.get("fields") || ""
    const selectedNiksParam = searchParams.get("selectedNiks") || ""
    const includeHeader = searchParams.get("includeHeader") === "true"
    const selectedFields = fieldsParam ? fieldsParam.split(",") : []
    const selectedGroups = groupsParam ? groupsParam.split(",").filter(Boolean) : []
    const selectedGenders = gendersParam ? gendersParam.split(",").filter(Boolean) : []
    const selectedAgamas = agamasParam ? agamasParam.split(",").filter(Boolean) : []
    const selectedNiks = selectedNiksParam ? selectedNiksParam.split(",").filter(Boolean) : []

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: "Organization ID is required" },
        { status: 400 }
      )
    }

    if (selectedFields.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one field must be selected" },
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

    // Fetch all members (no limit for export)
    let query = adminClient
      .from("organization_members")
      .select(`
        id,
        biodata_nik,
        employee_id,
        is_active,
        hire_date,
        department_id,
        user:user_id (
          id,
          email,
          first_name,
          middle_name,
          last_name,
          display_name,
          phone,
          mobile,
          date_of_birth,
          jenis_kelamin,
          nik,
          nisn,
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

    // Jika ada selectedNiks, hanya filter berdasarkan NIK tersebut (abaikan filter lain)
    if (selectedNiks.length > 0) {
      query = query.in("biodata_nik", selectedNiks)
    } else {
      // Apply filters hanya jika tidak ada selectedNiks
      if (active === "active") {
        query = query.eq("is_active", true)
      } else if (active === "inactive") {
        query = query.eq("is_active", false)
      }

      // Apply group filter (multiple)
      if (selectedGroups.length > 0) {
        query = query.in("department_id", selectedGroups.map(id => parseInt(id, 10)))
      }
    }

    const { data: members, error } = await query

    if (error) {
      console.error("Error fetching members:", error)
      return NextResponse.json(
        { success: false, message: "Failed to fetch members" },
        { status: 500 }
      )
    }

    // Field labels mapping
    const fieldLabels: Record<string, string> = {
      nik: "NIK",
      nama: "Nama Lengkap",
      nickname: "Nickname",
      nisn: "NISN",
      jenis_kelamin: "Jenis Kelamin",
      tempat_lahir: "Tempat Lahir",
      tanggal_lahir: "Tanggal Lahir",
      agama: "Agama",
      jalan: "Jalan",
      rt: "RT",
      rw: "RW",
      dusun: "Dusun",
      kelurahan: "Kelurahan",
      kecamatan: "Kecamatan",
      no_telepon: "No. Telepon",
      email: "Email",
      department_id: "Group",
    }

    // Helper function to extract user profile from Supabase relation
    const getUserProfile = (member: any) => {
      if (Array.isArray(member.user)) {
        return member.user[0] || {}
      } else if (member.user && typeof member.user === 'object') {
        return member.user
      }
      return {}
    }

    // Filter out members without user profile
    // Jika ada selectedNiks, skip filter ini karena sudah difilter di query
    let filteredMembers = (members || []).filter((member: any) => {
      const userProfile = getUserProfile(member)
      // Exclude members yang tidak punya user_id dan tidak punya user profile data
      return member.user_id || (userProfile && Object.keys(userProfile).length > 0)
    })

    if (selectedNiks.length === 0) {
      // Hanya apply filter ini jika tidak ada selectedNiks
      if (search) {
        const searchLower = search.toLowerCase()
        filteredMembers = filteredMembers.filter((member: any) => {
          const userProfile = getUserProfile(member)
          const displayName = userProfile.display_name || `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
          return (
            member.biodata_nik?.toLowerCase().includes(searchLower) ||
            member.employee_id?.toLowerCase().includes(searchLower) ||
            displayName.toLowerCase().includes(searchLower) ||
            userProfile.email?.toLowerCase().includes(searchLower)
          )
        })
      }

      if (selectedGenders.length > 0) {
        filteredMembers = filteredMembers.filter((member: any) => {
          const userProfile = getUserProfile(member)
          // Convert user_profiles jenis_kelamin (male/female) to biodata format (L/P) for comparison
          const genderMap: Record<string, string> = { 'male': 'L', 'female': 'P' }
          const gender = genderMap[userProfile.jenis_kelamin || ''] || userProfile.jenis_kelamin
          return selectedGenders.includes(gender)
        })
      }

      if (selectedAgamas.length > 0) {
        filteredMembers = filteredMembers.filter((member: any) => {
          const userProfile = getUserProfile(member)
          return selectedAgamas.includes(userProfile.agama)
        })
      }
    }

    // Transform data - from user_profiles
    const exportData = filteredMembers.map((member: any) => {
      const userProfile = getUserProfile(member)
      const displayName = userProfile.display_name || `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
      
      // Convert user_profiles jenis_kelamin (male/female) to biodata format (L/P)
      const genderMap: Record<string, string> = { 'male': 'L', 'female': 'P' }
      const jenisKelamin = genderMap[userProfile.jenis_kelamin || ''] || userProfile.jenis_kelamin || ""

      // Gunakan any di sini untuk menyederhanakan pemetaan dinamis
      const row: any = {}

      // Include fields from user_profiles (mapped to biodata format for compatibility)
      if (selectedFields.includes("nik")) {
        row["NIK"] = member.biodata_nik || userProfile.nik || ""
      }
      if (selectedFields.includes("nama")) {
        row["Nama Lengkap"] = displayName || ""
      }
      if (selectedFields.includes("nickname")) {
        row["Nickname"] = "" // nickname tidak ada di user_profiles
      }
      if (selectedFields.includes("nisn")) {
        row["NISN"] = userProfile.nisn || ""
      }
      if (selectedFields.includes("jenis_kelamin")) {
        row["Jenis Kelamin"] = jenisKelamin || ""
      }
      if (selectedFields.includes("tempat_lahir")) {
        row["Tempat Lahir"] = userProfile.tempat_lahir || ""
      }
      if (selectedFields.includes("tanggal_lahir")) {
        row["Tanggal Lahir"] = userProfile.date_of_birth || ""
      }
      if (selectedFields.includes("agama")) {
        row["Agama"] = userProfile.agama || ""
      }
      if (selectedFields.includes("jalan")) {
        row["Jalan"] = userProfile.jalan || ""
      }
      if (selectedFields.includes("rt")) {
        row["RT"] = userProfile.rt || ""
      }
      if (selectedFields.includes("rw")) {
        row["RW"] = userProfile.rw || ""
      }
      if (selectedFields.includes("dusun")) {
        row["Dusun"] = userProfile.dusun || ""
      }
      if (selectedFields.includes("kelurahan")) {
        row["Kelurahan"] = userProfile.kelurahan || ""
      }
      if (selectedFields.includes("kecamatan")) {
        row["Kecamatan"] = userProfile.kecamatan || ""
      }
      if (selectedFields.includes("no_telepon")) {
        row["No. Telepon"] = userProfile.phone || userProfile.mobile || ""
      }
      if (selectedFields.includes("email")) {
        row["Email"] = userProfile.email || ""
      }
      if (selectedFields.includes("department_id")) {
        row["Group"] = member.department_id || ""
      }

      return row
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      header: includeHeader ? selectedFields.map((f: string) => fieldLabels[f] ?? f) : undefined,
    })

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members")

    // Generate file buffer
    let buffer: Buffer
    let mimeType: string
    let fileExtension: string

    if (format === "csv") {
      // For CSV, convert to CSV string
      const csv = XLSX.utils.sheet_to_csv(worksheet)
      buffer = Buffer.from(csv, "utf-8")
      mimeType = "text/csv"
      fileExtension = "csv"
    } else {
      // For XLSX
      buffer = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }))
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      fileExtension = "xlsx"
    }

    // Konversi ke Uint8Array agar kompatibel dengan NextResponse typings
    const uint8Buffer = new Uint8Array(buffer)

    // Return file as response
    const fileName = `members-export-${new Date().toISOString().split("T")[0]}.${fileExtension}`

    return new NextResponse(uint8Buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": uint8Buffer.byteLength.toString(),
      },
    })
  } catch (error: any) {
    console.error("Error in export:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

