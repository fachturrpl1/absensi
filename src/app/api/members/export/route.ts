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
      is_active,
      hire_date,
      user:user_id (
        nik,
        display_name,
        first_name,
        middle_name,
        last_name,
        email,
        jenis_kelamin,
        agama,
        profile_photo_url
      ),
      departments:department_id ( id, name ),
      positions:position_id ( id, title )
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
    // Jika ada selectedNiks, skip filter ini karena sudah difilter di query
    let filteredMembers = (members || []).filter((member: any) => {
      const biodata = getBiodata(member)
      // Exclude members yang tidak punya biodata_nik dan tidak punya biodata data
      return member.biodata_nik || (biodata && Object.keys(biodata).length > 0)
    })

    if (selectedNiks.length === 0) {
      // Hanya apply filter ini jika tidak ada selectedNiks
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
    }

    // Transform data - ONLY biodata columns
   type ExportRow = Record<string, string>

  const exportData = filteredMembers.map((m: unknown) => {
    const u = (m as { user?: any, departments?: any }).user
    const dep = (m as { departments?: any }).departments
    const fullName = [u?.first_name, u?.middle_name, u?.last_name].filter(Boolean).join(" ").trim()

    const row: ExportRow = {}
    if (selectedFields.includes("nik")) row["NIK"] = String(u?.nik || "")
    if (selectedFields.includes("nama")) row["Nama Lengkap"] = String(u?.display_name || fullName || "")
    if (selectedFields.includes("jenis_kelamin")) row["Jenis Kelamin"] = String(u?.jenis_kelamin || "")
    if (selectedFields.includes("agama")) row["Agama"] = String(u?.agama || "")
    if (selectedFields.includes("email")) row["Email"] = String(u?.email || "")
    if (selectedFields.includes("department_id")) {
      const depName = Array.isArray(dep) ? (dep[0]?.name ?? "") : (dep?.name ?? "")
      row["Group"] = String(depName)
    }

    // Kolom yang tidak tersedia di user_profiles → kosongkan
    for (const [key, label] of Object.entries({
      nickname: "Nickname",
      nisn: "NISN",
      tempat_lahir: "Tempat Lahir",
      tanggal_lahir: "Tanggal Lahir",
      jalan: "Jalan",
      rt: "RT",
      rw: "RW",
      dusun: "Dusun",
      kelurahan: "Kelurahan",
      kecamatan: "Kecamatan",
      no_telepon: "No. Telepon"
    })) {
      if (selectedFields.includes(key)) row[label] = ""
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

