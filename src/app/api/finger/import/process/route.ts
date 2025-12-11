import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

interface ColumnMapping {
  [databaseField: string]: string | null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const mappingJson = formData.get("mapping") as string
    const mode = (formData.get("mode") as string) || "import" // 'test' or 'import'
    const trackHistory = formData.get("trackHistory") === "true" // kept for parity, unused
    const allowMatchingWithSubfields = formData.get("allowMatchingWithSubfields") === "true" // kept for parity, unused

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    if (!mappingJson) {
      return NextResponse.json({ success: false, message: "No mapping provided" }, { status: 400 })
    }

    let mapping: ColumnMapping
    try {
      mapping = JSON.parse(mappingJson)
    } catch {
      return NextResponse.json({ success: false, message: "Invalid mapping JSON" }, { status: 400 })
    }

    // Minimal required field: first_name
    if (!mapping.first_name) {
      return NextResponse.json(
        { success: false, message: "Nama Depan mapping is required" },
        { status: 400 }
      )
    }

    // Read workbook
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames?.[0]
    if (!sheetName) {
      return NextResponse.json({ success: false, message: "No sheet found in Excel file" }, { status: 400 })
    }
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      return NextResponse.json({ success: false, message: "Worksheet not found in Excel file" }, { status: 400 })
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
      raw: false,
    })
    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: "Excel file is empty or has no data" },
        { status: 400 }
      )
    }

    // Auth & org
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, message: "User not authenticated" }, { status: 401 })
    }

    const { data: member } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!member || !member.organization_id) {
      return NextResponse.json(
        { success: false, message: "User not member of any organization" },
        { status: 403 }
      )
    }

    const orgId =
      typeof member.organization_id === "string"
        ? parseInt(member.organization_id, 10)
        : member.organization_id

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // considering header row

      const firstName = mapping.first_name ? String(row[mapping.first_name]).trim() : ""
      if (!firstName) {
        failed++
        errors.push(`Row ${rowNumber}: Nama Depan is required`)
        continue
      }

      const lastName = mapping.last_name ? String(row[mapping.last_name]).trim() : ""
      const phone = mapping.phone ? String(row[mapping.phone]).trim() : ""
      const departmentRaw = mapping.department_id ? String(row[mapping.department_id]).trim() : ""
      const isActiveRaw = mapping.is_active ? String(row[mapping.is_active]).trim().toLowerCase() : ""

      const departmentId = departmentRaw ? Number(departmentRaw) : null
      const isActive =
        isActiveRaw === "false" || isActiveRaw === "0" || isActiveRaw === "no" ? false : true

      // Since employee_id is required by schema but user asked not to map it, generate unique id
      const employeeId = `FPR-${orgId}-${Date.now()}-${i + 1}-${Math.floor(Math.random() * 1000)}`

      if (mode === "test") {
        success++
        continue
      }

      const { error: insertError } = await adminClient.from("fingerprint_members").insert([
        {
          organization_id: orgId,
          employee_id: employeeId,
          first_name: firstName,
          last_name: lastName || null,
          phone: phone || null,
          department_id: Number.isNaN(departmentId) ? null : departmentId,
          is_active: isActive,
        },
      ])

      if (insertError) {
        failed++
        errors.push(`Row ${rowNumber}: ${insertError.message}`)
      } else {
        success++
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        success,
        failed,
        errors,
      },
    })
  } catch (error) {
    console.error("[FINGER IMPORT] Unexpected error:", error)
    return NextResponse.json(
      { success: false, message: "Unexpected error processing import" },
      { status: 500 }
    )
  }
}

