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
    const dateFormat = searchParams.get("dateFormat") || "YYYY-MM-DD"
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
          kecamatan,
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

    // Filter by search, gender, and agama in memory (since they require biodata join)
    // Jika ada selectedNiks, skip filter ini karena sudah difilter di query
    let filteredMembers = members || []

    if (selectedNiks.length === 0) {
      // Hanya apply filter ini jika tidak ada selectedNiks
      if (search) {
        const searchLower = search.toLowerCase()
        filteredMembers = filteredMembers.filter((member: any) => {
          const biodata = member.biodata || {}
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
          const biodata = member.biodata || {}
          return selectedGenders.includes(biodata.jenis_kelamin)
        })
      }

      if (selectedAgamas.length > 0) {
        filteredMembers = filteredMembers.filter((member: any) => {
          const biodata = member.biodata || {}
          return selectedAgamas.includes(biodata.agama)
        })
      }
    }

    // Transform data - ONLY biodata columns
    const exportData = filteredMembers.map((member: any) => {
      const biodata = member.biodata || {}

      const row: Record<string, any> = {}

      // Only include fields from biodata table
      if (selectedFields.includes("nik")) {
        row[fieldLabels.nik] = member.biodata_nik || biodata.nik || ""
      }
      if (selectedFields.includes("nama")) {
        row[fieldLabels.nama] = biodata.nama || ""
      }
      if (selectedFields.includes("nickname")) {
        row[fieldLabels.nickname] = biodata.nickname || ""
      }
      if (selectedFields.includes("nisn")) {
        row[fieldLabels.nisn] = biodata.nisn || ""
      }
      if (selectedFields.includes("jenis_kelamin")) {
        row[fieldLabels.jenis_kelamin] = biodata.jenis_kelamin || ""
      }
      if (selectedFields.includes("tempat_lahir")) {
        row[fieldLabels.tempat_lahir] = biodata.tempat_lahir || ""
      }
      if (selectedFields.includes("tanggal_lahir")) {
        row[fieldLabels.tanggal_lahir] = biodata.tanggal_lahir || ""
      }
      if (selectedFields.includes("agama")) {
        row[fieldLabels.agama] = biodata.agama || ""
      }
      if (selectedFields.includes("jalan")) {
        row[fieldLabels.jalan] = biodata.jalan || ""
      }
      if (selectedFields.includes("rt")) {
        row[fieldLabels.rt] = biodata.rt || ""
      }
      if (selectedFields.includes("rw")) {
        row[fieldLabels.rw] = biodata.rw || ""
      }
      if (selectedFields.includes("dusun")) {
        row[fieldLabels.dusun] = biodata.dusun || ""
      }
      if (selectedFields.includes("kelurahan")) {
        row[fieldLabels.kelurahan] = biodata.kelurahan || ""
      }
      if (selectedFields.includes("kecamatan")) {
        row[fieldLabels.kecamatan] = biodata.kecamatan || ""
      }
      if (selectedFields.includes("no_telepon")) {
        row[fieldLabels.no_telepon] = biodata.no_telepon || ""
      }
      if (selectedFields.includes("email")) {
        row[fieldLabels.email] = biodata.email || ""
      }
      if (selectedFields.includes("department_id")) {
        row[fieldLabels.department_id] = biodata.department_id || ""
      }

      return row
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      header: includeHeader ? selectedFields.map(f => fieldLabels[f] || f) : undefined,
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

    // Return file as response
    const fileName = `members-export-${new Date().toISOString().split("T")[0]}.${fileExtension}`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length.toString(),
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

