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
    const mode = (formData.get("mode") as string) || "import" // 'test' atau 'import'
    const organizationIdParam = formData.get("organization_id") as string | null
    const groupIdParam = formData.get("groupId") as string | null
    const headerRowInput = formData.get("headerRow")
    const headerRowCountInput = formData.get("headerRowCount")
    const requestedSheet = (formData.get("sheetName") || "") as string
    const trackHistory = formData.get("trackHistory") === "true"
    const allowMatchingWithSubfields = formData.get("allowMatchingWithSubfields") === "true"

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

    // Minimal required field untuk biodata: nik & nama
    if (!mapping.nik) {
      return NextResponse.json(
        { success: false, message: "NIK mapping is required" },
        { status: 400 }
      )
    }

    if (!mapping.nama) {
      return NextResponse.json(
        { success: false, message: "Nama Lengkap mapping is required" },
        { status: 400 }
      )
    }

    const headerRow = Math.max(1, Number(headerRowInput) || 1)
    const headerRowCount = Math.max(1, Number(headerRowCountInput) || 1)

    // Read workbook
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetNames = workbook.SheetNames || []
    const sheetName = requestedSheet && sheetNames.includes(requestedSheet) ? requestedSheet : sheetNames[0]
    if (!sheetName) {
      return NextResponse.json({ success: false, message: "No sheet found in Excel file" }, { status: 400 })
    }
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      return NextResponse.json({ success: false, message: "Worksheet not found in Excel file" }, { status: 400 })
    }

    // Use array-of-arrays to respect custom header rows
    const rowsArray = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    })
    if (!rowsArray.length) {
      return NextResponse.json(
        { success: false, message: "Excel file is empty or has no data" },
        { status: 400 }
      )
    }

    if (headerRow > rowsArray.length) {
      return NextResponse.json(
        { success: false, message: `Header row ${headerRow} is outside the data range (total rows: ${rowsArray.length})` },
        { status: 400 }
      )
    }

    const headerRows = rowsArray.slice(headerRow - 1, headerRow - 1 + headerRowCount)
    const maxCols = headerRows.reduce((max, row) => Math.max(max, row.length), 0)

    const headers: string[] = []
    let carryParent = ""
    for (let col = 0; col < maxCols; col++) {
      const topCellRaw = String((headerRows[0]?.[col] ?? "")).trim()
      if (topCellRaw) {
        carryParent = topCellRaw
      }
      const parent = carryParent
      const childRaw = String((headerRows[headerRows.length - 1]?.[col] ?? "")).trim()
      const child = childRaw

      let header = ""
      if (child && parent && child.toLowerCase() === parent.toLowerCase()) {
        header = child
      } else if (child && parent) {
        header = `${parent} - ${child}`
      } else if (child) {
        header = child
      } else if (parent) {
        header = parent
      }

      headers.push(header || `__EMPTY_${col}`)
    }

    const dataRowsRaw = rowsArray.slice(headerRow - 1 + headerRowCount)
    if (!dataRowsRaw.length) {
      return NextResponse.json(
        { success: false, message: "Excel file has no data rows after header" },
        { status: 400 }
      )
    }

    // Convert data rows into array of objects keyed by headers
    const rows = dataRowsRaw.map((rowArr) => {
      const obj: Record<string, any> = {}
      headers.forEach((header, idx) => {
        obj[header] = String((rowArr as any)?.[idx] ?? "").trim()
      })
      return obj
    })

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

    let orgId: number | null = null

    if (organizationIdParam) {
      orgId = parseInt(organizationIdParam, 10)
      if (isNaN(orgId)) {
      return NextResponse.json(
          { success: false, message: "Invalid organization_id" },
          { status: 400 }
      )
    }

    const { data: member } = await adminClient
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("organization_id", orgId)
      .maybeSingle()

    if (!member) {
      return NextResponse.json(
          { success: false, message: "User is not a member of the specified organization" },
        { status: 403 }
      )
    }
    } else {
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

      orgId =
        typeof member.organization_id === "string"
      ? parseInt(member.organization_id, 10) 
      : member.organization_id
    }

    // Fetch departments untuk lookup
    const deptFields = allowMatchingWithSubfields 
      ? "id, name, code, is_active, organization_id, description"
      : "id, name, code, is_active, organization_id"
    
    const { data: departments } = await adminClient
      .from("departments")
      .select(deptFields)
      .eq("organization_id", orgId)
      .eq("is_active", true)

    // Helper normalize string
    const normalizeForMatching = (str: string): string => {
      if (!str) return ""
      return str
        .trim()
        .toLowerCase()
        .replace(/[\s\-_\.]/g, "")
        .replace(/[^\w]/g, "")
    }

    const findDepartmentId = (
      value: string,
      departments: any[]
    ): { id?: number; notFound: boolean } => {
      if (!value || !departments || departments.length === 0) {
        return { id: undefined, notFound: false }
      }

      const searchValue = value.trim()
      const normalizedSearch = normalizeForMatching(searchValue)
      
      if (!normalizedSearch) {
        return { id: undefined, notFound: false }
      }
      
      let match = departments.find((item: any) => {
        const nameMatch = String(item?.name ?? "").trim().toLowerCase() === searchValue.toLowerCase()
        const codeMatch = String(item?.code ?? "").trim().toLowerCase() === searchValue.toLowerCase()
      return nameMatch || codeMatch
    })
    
      if (!match) {
        match = departments.find((item: any) => {
          const nameNormalized = normalizeForMatching(String(item?.name ?? ""))
          const codeNormalized = normalizeForMatching(String(item?.code ?? ""))
          return (
            (nameNormalized === normalizedSearch && nameNormalized.length > 0) ||
            (codeNormalized === normalizedSearch && codeNormalized.length > 0)
          )
        })
      }

      if (!match && allowMatchingWithSubfields) {
        match = departments.find((item: any) => {
          const descValue = String(item?.description ?? "").trim()
          if (!descValue) return false
          return (
            descValue.toLowerCase().includes(searchValue.toLowerCase()) ||
            normalizeForMatching(descValue).includes(normalizedSearch)
          )
        })
      }

      if (!match && normalizedSearch.length >= 3) {
        match = departments.find((item: any) => {
          const nameNormalized = normalizeForMatching(String(item?.name ?? ""))
          const codeNormalized = normalizeForMatching(String(item?.code ?? ""))
          return (
            nameNormalized.includes(normalizedSearch) ||
            normalizedSearch.includes(nameNormalized) ||
            codeNormalized.includes(normalizedSearch) ||
            normalizedSearch.includes(codeNormalized)
          )
        })
      }
      
      if (!match) {
        return { id: undefined, notFound: true }
      }
      
      return { id: Number(match.id), notFound: false }
    }

    const getMappedValue = (row: Record<string, any>, dbField: string): string => {
      const excelColumn = mapping[dbField]
      if (!excelColumn) return ""
      
      const rawValue = row[excelColumn]
      if (rawValue === null || rawValue === undefined) return ""

      return String(rawValue).trim()
    }

    let success = 0
    let failed = 0
    const errors: Array<{ row: number; message: string }> = []
    // Untuk mode test: kumpulkan data row yang akan muncul di halaman finger
    const fingerPagePreview: Array<{
      row: number
      nik: string
      nama: string
      email: string
      department?: string
    }> = []
    let withoutEmailCount = 0 // Hitung yang tidak punya email

    // OPTIMASI: Cache listUsers() di awal sekali saja (jangan dipanggil per row)
    console.log("[MEMBERS IMPORT] Fetching existing users...")
    const { data: existingUsersData, error: listUsersError } = await adminClient.auth.admin.listUsers()
    if (listUsersError) {
      console.error("[MEMBERS IMPORT] Failed to fetch users:", listUsersError)
      return NextResponse.json(
        { success: false, message: `Gagal memeriksa user yang sudah ada: ${listUsersError.message}` },
        { status: 500 }
      )
    }
    
    // Buat Map untuk lookup cepat berdasarkan email (case-insensitive)
    const usersByEmail = new Map<string, { id: string; email: string }>()
    existingUsersData?.users?.forEach((user) => {
      if (user.email) {
        usersByEmail.set(user.email.toLowerCase(), { id: user.id, email: user.email })
      }
    })
    console.log(`[MEMBERS IMPORT] Cached ${usersByEmail.size} existing users`)

    // OPTIMASI: Cache existing organization_members untuk batch lookup
    console.log("[MEMBERS IMPORT] Fetching existing organization members...")
    const { data: existingMembersData } = await adminClient
      .from("organization_members")
      .select("id, user_id, organization_id, biodata_nik")
      .eq("organization_id", orgId)
    
    const membersByUserId = new Map<string, { id: number; biodata_nik: string | null }>()
    existingMembersData?.forEach((member) => {
      if (member.user_id) {
        membersByUserId.set(member.user_id, { id: member.id, biodata_nik: member.biodata_nik })
      }
    })
    console.log(`[MEMBERS IMPORT] Cached ${membersByUserId.size} existing organization members`)

    // OPTIMASI BATCH: Untuk mode import, kumpulkan semua data valid terlebih dahulu
    if (mode === "import") {
      console.log("[MEMBERS IMPORT] Starting batch processing mode...")
      
      // Kumpulkan semua data yang valid
      interface ValidRowData {
        rowNumber: number
        row: Record<string, any>
        nik: string
        nama: string
        nickname: string
        nisn: string
        jenisKelamin: string
        tempatLahir: string
        tanggalLahir: string | null
        agama: string
        jalan: string
        rt: string
        rw: string
        dusun: string
        kelurahan: string
        kecamatan: string
        noTelepon: string
        email: string | null
        departmentId: number | null
        departmentName?: string
      }

      const validRows: ValidRowData[] = []
      
      // Validasi dan kumpulkan semua rows yang valid
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNumber = headerRow + headerRowCount + i

        if (!row) {
          failed++
          errors.push({ row: rowNumber, message: "Empty row" })
          continue
        }

        const nik = getMappedValue(row, "nik")
        const nama = getMappedValue(row, "nama")
        const nickname = getMappedValue(row, "nickname")
        const nisn = getMappedValue(row, "nisn")
        const jenisKelamin = getMappedValue(row, "jenis_kelamin").toUpperCase()
        const tempatLahir = getMappedValue(row, "tempat_lahir")
        const tanggalLahirRaw = getMappedValue(row, "tanggal_lahir")
        const agama = getMappedValue(row, "agama")
        const jalan = getMappedValue(row, "jalan")
        const rt = getMappedValue(row, "rt")
        const rw = getMappedValue(row, "rw")
        const dusun = getMappedValue(row, "dusun")
        const kelurahan = getMappedValue(row, "kelurahan")
        const kecamatan = getMappedValue(row, "kecamatan")
        const noTelepon = getMappedValue(row, "no_telepon")
        const email = getMappedValue(row, "email")
        const departmentValue = getMappedValue(row, "department_id")

        // Validasi dasar
        if (!nik || !nama) {
          failed++
          errors.push({ row: rowNumber, message: !nik ? "NIK is required" : "Nama Lengkap is required" })
          continue
        }

        // Email opsional, tapi jika diisi harus valid
        const hasEmail = email && email.trim() !== ""
        if (hasEmail) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(email)) {
            failed++
            errors.push({ row: rowNumber, message: `Email format invalid: "${email}"` })
            continue
          }
        }

        if (nik.length < 10) {
          failed++
          errors.push({ row: rowNumber, message: `NIK terlalu pendek (minimal 10 karakter): "${nik}"` })
          continue
        }

        if (mapping.jenis_kelamin && jenisKelamin !== "L" && jenisKelamin !== "P") {
          failed++
          errors.push({ row: rowNumber, message: "Jenis Kelamin must be 'L' or 'P'" })
          continue
        }

        let tanggalLahir: string | null = null
        if (tanggalLahirRaw) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahirRaw)) {
            tanggalLahir = tanggalLahirRaw
          } else {
            const parsed = new Date(tanggalLahirRaw)
            if (!isNaN(parsed.getTime())) {
              tanggalLahir = parsed.toISOString().split("T")[0] || null
            } else {
              failed++
              errors.push({ row: rowNumber, message: `Tanggal Lahir invalid: "${tanggalLahirRaw}"` })
              continue
            }
          }
        }

        let departmentId: number | null = null
        let departmentName: string | undefined = undefined
        if (departmentValue && departments && departments.length > 0) {
          const deptResult = findDepartmentId(departmentValue, departments)
          if (deptResult.id) {
            departmentId = deptResult.id
            const dept = departments.find((d: any) => Number(d.id) === Number(departmentId)) as any
            if (dept && typeof dept === 'object' && 'name' in dept) {
              departmentName = (dept as { name?: string }).name || undefined
            }
          }
        }

        validRows.push({
          rowNumber,
          row,
          nik,
          nama,
          nickname,
          nisn,
          jenisKelamin,
          tempatLahir,
          tanggalLahir,
          agama,
          jalan,
          rt,
          rw,
          dusun,
          kelurahan,
          kecamatan,
          noTelepon,
          email,
          departmentId,
          departmentName,
        })
      }

      console.log(`[MEMBERS IMPORT] Validated ${validRows.length} rows, ${failed} failed validation`)

      // Track row yang gagal setelah validasi untuk menghitung success dengan benar
      const failedAfterValidation = new Set<number>()

      // TIDAK LAGI CREATE USER - Langsung insert ke organization_members dengan email
      console.log(`[MEMBERS IMPORT] Skipping user creation - all members will be imported without user accounts`)

      // Batch insert biodata terlebih dahulu
      console.log(`[MEMBERS IMPORT] Batch inserting biodata...`)
      const biodataToUpsert = validRows.map((vr) => ({
        nik: vr.nik,
        nama: vr.nama,
        nickname: vr.nickname || null,
        nisn: vr.nisn || null,
        jenis_kelamin: vr.jenisKelamin || null,
        tempat_lahir: vr.tempatLahir || null,
        tanggal_lahir: vr.tanggalLahir || null,
        agama: vr.agama || null,
        jalan: vr.jalan || null,
        rt: vr.rt || null,
        rw: vr.rw || null,
        dusun: vr.dusun || null,
        kelurahan: vr.kelurahan || null,
        kecamatan: vr.kecamatan || null,
        no_telepon: vr.noTelepon || null,
        email: vr.email || null,
      }))

      const { error: biodataError } = await adminClient
        .from("biodata")
        .upsert(biodataToUpsert, { onConflict: "nik" })

      if (biodataError) {
        console.error("[MEMBERS IMPORT] Batch biodata upsert error:", biodataError)
        // Continue anyway, biodata mungkin sudah ada
      }

      // Batch insert/update organization_members
      console.log(`[MEMBERS IMPORT] Batch processing organization members...`)
      const today = new Date().toISOString().split("T")[0]
      const membersToInsert: Array<{ rowNumber: number; payload: any }> = []
      const membersToUpdate: Array<{ id: number; data: any; rowNumber: number }> = []

      for (const vr of validRows) {
        if (failedAfterValidation.has(vr.rowNumber)) continue

        if (!orgId) {
          if (!failedAfterValidation.has(vr.rowNumber)) {
            failed++
            failedAfterValidation.add(vr.rowNumber)
            errors.push({
              row: vr.rowNumber,
              message: `Baris ${vr.rowNumber}: Gagal memproses - organization tidak ditemukan`,
            })
          }
          continue
        }

        // Check existing member by NIK (biodata_nik)
        const { data: existingMember } = await adminClient
          .from("organization_members")
          .select("id")
          .eq("organization_id", orgId)
          .eq("biodata_nik", vr.nik)
          .maybeSingle()

        if (existingMember) {
          const updateData: any = { is_active: true }
          // Prioritaskan groupId dari dropdown, fallback ke departmentId dari Excel
          if (groupIdParam) {
            updateData.department_id = parseInt(groupIdParam, 10)
          } else if (vr.departmentId) {
            updateData.department_id = vr.departmentId
          }
          if (vr.email) updateData.email = vr.email
          membersToUpdate.push({ id: existingMember.id, data: updateData, rowNumber: vr.rowNumber })
        } else {
          membersToInsert.push({
            rowNumber: vr.rowNumber,
            payload: {
              user_id: null, // Tidak ada user account
              organization_id: orgId,
              // Prioritaskan groupId dari dropdown, fallback ke departmentId dari Excel
              department_id: groupIdParam ? parseInt(groupIdParam, 10) : (vr.departmentId || null),
              biodata_nik: vr.nik,
              email: vr.email || null, // Email langsung di organization_members
              hire_date: today,
              is_active: true,
            }
          })
        }
      }

      // Batch insert new members
      if (membersToInsert.length > 0) {
        const insertPayloads = membersToInsert.map(item => item.payload)

        const { data: newMembers, error: insertError } = await adminClient
          .from("organization_members")
          .insert(insertPayloads)
          .select("id, user_id, biodata_nik")

        if (insertError) {
          console.error("[MEMBERS IMPORT] Batch member insert error:", insertError)
          // Jika batch insert gagal, tandai semua row sebagai failed
          membersToInsert.forEach(item => {
            if (!failedAfterValidation.has(item.rowNumber)) {
              failed++
              failedAfterValidation.add(item.rowNumber)
              errors.push({
                row: item.rowNumber,
                message: `Baris ${item.rowNumber}: Gagal membuat member organisasi - ${insertError.message}`,
              })
            }
          })
        } else if (newMembers) {
          newMembers.forEach((member: any) => {
            if (member.user_id) {
              membersByUserId.set(member.user_id, { id: member.id, biodata_nik: member.biodata_nik })
            }
          })
        }
      }

      // Batch update existing members (dalam batch kecil untuk menghindari query terlalu besar)
      const UPDATE_BATCH_SIZE = 50
      for (let i = 0; i < membersToUpdate.length; i += UPDATE_BATCH_SIZE) {
        const batch = membersToUpdate.slice(i, i + UPDATE_BATCH_SIZE)
        await Promise.all(
          batch.map(async ({ id, data, rowNumber }) => {
            const { error: updateError } = await adminClient
              .from("organization_members")
              .update(data)
              .eq("id", id)
            
            if (updateError && !failedAfterValidation.has(rowNumber)) {
              failed++
              failedAfterValidation.add(rowNumber)
              errors.push({
                row: rowNumber,
                message: `Baris ${rowNumber}: Gagal memperbarui member organisasi - ${updateError.message}`,
              })
            }
          })
        )
      }

      // Batch upsert biodata
      console.log(`[MEMBERS IMPORT] Batch upserting biodata records...`)
      const biodataPayloads = validRows
        .filter(vr => !failedAfterValidation.has(vr.rowNumber))
        .map((vr) => ({
          rowNumber: vr.rowNumber,
          payload: {
            nik: vr.nik,
            nama: vr.nama,
            nickname: vr.nickname || null,
            nisn: vr.nisn || null,
            jenis_kelamin: vr.jenisKelamin || null,
            tempat_lahir: vr.tempatLahir || null,
            tanggal_lahir: vr.tanggalLahir,
            agama: vr.agama || null,
            jalan: vr.jalan || null,
            rt: vr.rt || null,
            rw: vr.rw || null,
            dusun: vr.dusun || null,
            kelurahan: vr.kelurahan || null,
            kecamatan: vr.kecamatan || null,
            no_telepon: vr.noTelepon || null,
            email: vr.email || null,
            department_id: vr.departmentId,
          }
        }))

      // Upsert dalam batch (Supabase mendukung batch upsert)
      const BIODATA_BATCH_SIZE = 100
      for (let i = 0; i < biodataPayloads.length; i += BIODATA_BATCH_SIZE) {
        const batch = biodataPayloads.slice(i, i + BIODATA_BATCH_SIZE)
        const batchPayloads = batch.map(item => item.payload)
        const { error: biodataError } = await adminClient
          .from("biodata")
          .upsert(batchPayloads, { onConflict: "nik" })

        if (biodataError) {
          console.error(`[MEMBERS IMPORT] Batch biodata upsert error (batch ${i / BIODATA_BATCH_SIZE + 1}):`, biodataError)
          // Fallback: upsert satu per satu untuk batch yang error
          for (const item of batch) {
            const { error: singleBiodataError } = await adminClient
              .from("biodata")
              .upsert(item.payload, { onConflict: "nik" })
            
            if (singleBiodataError && !failedAfterValidation.has(item.rowNumber)) {
              failed++
              failedAfterValidation.add(item.rowNumber)
              errors.push({
                row: item.rowNumber,
                message: `Baris ${item.rowNumber}: Gagal menyimpan biodata - ${singleBiodataError.message}`,
              })
            }
          }
        }
      }

      // Audit logs (optional, bisa di-skip jika terlalu lambat)
      if (trackHistory) {
        const auditLogs = validRows
          .filter(vr => !failedAfterValidation.has(vr.rowNumber))
          .map((vr) => ({
          organization_id: orgId,
          user_id: user.id,
          action: "member_import",
          entity_type: "biodata",
          entity_id: null,
          old_values: null,
          new_values: {
            nik: vr.nik,
            nama: vr.nama,
            email: vr.email,
            department_id: vr.departmentId,
            row_number: vr.rowNumber,
            file_name: file.name,
          },
          ip_address: null,
          user_agent: null,
          session_id: null,
        }))

        // Batch insert audit logs dalam batch kecil
        const AUDIT_BATCH_SIZE = 50
        for (let i = 0; i < auditLogs.length; i += AUDIT_BATCH_SIZE) {
          const batch = auditLogs.slice(i, i + AUDIT_BATCH_SIZE)
          try {
            await adminClient.from("audit_logs").insert(batch)
          } catch (err: any) {
            console.error("[MEMBERS IMPORT] Failed to write audit log batch:", err)
          }
        }
      }

      // Hitung success berdasarkan row yang benar-benar berhasil (bukan hanya validRows.length)
      // Row yang gagal setelah validasi sudah ditrack di failedAfterValidation
      success = validRows.length - failedAfterValidation.size
      console.log(`[MEMBERS IMPORT] Batch processing complete: ${success} success, ${failed} failed (${validRows.length} validated, ${failedAfterValidation.size} failed after validation)`)

      // Kumpulkan data untuk preview halaman finger (hanya yang berhasil diproses)
      validRows
        .filter(vr => !failedAfterValidation.has(vr.rowNumber))
        .forEach((vr) => {
          fingerPagePreview.push({
            row: vr.rowNumber,
            nik: vr.nik,
            nama: vr.nama,
            email: vr.email || "",
            department: vr.departmentName,
          })
        })

      // Skip loop normal untuk mode import
      // Continue to response section
    } else {
      // Mode test: tetap gunakan loop normal (karena perlu cleanup)
      for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = headerRow + headerRowCount + i

      if (!row) {
        failed++
        errors.push({ row: rowNumber, message: "Empty row" })
          continue
        }

      const nik = getMappedValue(row, "nik")
      const nama = getMappedValue(row, "nama")
      // These fields are mapped but only used in import mode, not in test mode
      const _nickname = getMappedValue(row, "nickname")
      const _nisn = getMappedValue(row, "nisn")
      const jenisKelamin = getMappedValue(row, "jenis_kelamin").toUpperCase()
      const _tempatLahir = getMappedValue(row, "tempat_lahir")
      const tanggalLahirRaw = getMappedValue(row, "tanggal_lahir")
      const _agama = getMappedValue(row, "agama")
      const _jalan = getMappedValue(row, "jalan")
      const _rt = getMappedValue(row, "rt")
      const _rw = getMappedValue(row, "rw")
      const _dusun = getMappedValue(row, "dusun")
      const _kelurahan = getMappedValue(row, "kelurahan")
      const _kecamatan = getMappedValue(row, "kecamatan")
      const _noTelepon = getMappedValue(row, "no_telepon")
      const email = getMappedValue(row, "email")
      const departmentValue = getMappedValue(row, "department_id")
      // Suppress unused variable warnings for test mode
      void _nickname; void _nisn; void _tempatLahir; void _agama
      void _jalan; void _rt; void _rw; void _dusun; void _kelurahan; void _kecamatan; void _noTelepon

      if (!nik) {
        failed++
        errors.push({ row: rowNumber, message: "NIK is required" })
          continue
        }

      if (!nama) {
        failed++
        errors.push({ row: rowNumber, message: "Nama Lengkap is required" })
        continue
      }

      // Email opsional - member bisa dibuat dengan atau tanpa email
      // Jika ada email, validasi formatnya
      const hasEmail = email && email.trim() !== ""
      if (hasEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          failed++
          errors.push({
            row: rowNumber,
            message: `Email format invalid: "${email}"`,
          })
          continue
        }
      } else {
        // Track yang tidak punya email untuk info
        if (mode === "test") {
          withoutEmailCount++
        }
      }
              
      if (mapping.jenis_kelamin) {
        if (!jenisKelamin) {
          failed++
          errors.push({
            row: rowNumber,
            message: "Jenis Kelamin is required (must be 'L' or 'P')",
          })
          continue
        }
        if (jenisKelamin !== "L" && jenisKelamin !== "P") {
          failed++
          errors.push({
            row: rowNumber,
            message: "Jenis Kelamin must be 'L' or 'P'",
          })
          continue
        }
      }

      // Date parsing - only used in import mode, not in test mode
      let _tanggalLahir: string | null = null
      if (tanggalLahirRaw) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahirRaw)) {
          _tanggalLahir = tanggalLahirRaw
        } else {
          const parsed = new Date(tanggalLahirRaw)
          if (!isNaN(parsed.getTime())) {
            _tanggalLahir = parsed.toISOString().split("T")[0] || null
            } else {
            failed++
            errors.push({
              row: rowNumber,
              message: `Tanggal Lahir invalid: "${tanggalLahirRaw}"`,
            })
              continue
          }
        }
      }
      void _tanggalLahir // Suppress unused warning for test mode

      // Validasi NIK harus dilakukan sebelum mode test/import
      if (nik && nik.length < 10) {
        failed++
        errors.push({
          row: rowNumber,
          message: `NIK terlalu pendek (minimal 10 karakter): "${nik}"`,
        })
        continue
      }

      let departmentId: number | null = null
      if (departmentValue && departments && departments.length > 0) {
        const deptResult = findDepartmentId(departmentValue, departments)
        if (deptResult.id) {
          departmentId = deptResult.id
        } else if (deptResult.notFound) {
          errors.push({
            row: rowNumber,
            message: `Department "${departmentValue}" not found (skipped)`,
          })
        }
      }

      if (mode === "test") {
        // Di mode test, hanya validasi data tanpa create user atau insert
        // Member tanpa email juga valid untuk di-test
        
        try {
          const hasEmail = email && email.trim() !== ""
          
          // Dapatkan nama department jika ada
          let departmentName: string | undefined = undefined
          if (departmentId && departments && departments.length > 0) {
            const dept = departments.find((d: any) => Number(d.id) === Number(departmentId)) as any
            if (dept && typeof dept === 'object' && 'name' in dept) {
              departmentName = (dept as { name?: string }).name || undefined
            }
          }
          
          // Track untuk preview halaman finger
          if (hasEmail || nik) {
            fingerPagePreview.push({
              row: rowNumber,
              nik: nik || "-",
              nama: nama,
              email: hasEmail ? email : "-",
              department: departmentName,
            })
          }

          // Validasi sudah dilakukan di atas, di sini hanya count success
          success++
        } catch (error: any) {
          failed++
          errors.push({
            row: rowNumber,
            message: error.message || "Unexpected error",
          })
        }
      } else {
        // Mode import - skip, sudah di-handle di batch mode di atas
      }
    }
    } // End of else block (mode test)

    const response: any = {
      success: true,
      summary: {
        success,
        failed,
        errors,
      },
    }

    // Untuk mode test, tambahkan informasi preview halaman finger
    if (mode === "test") {
      const withEmailCount = fingerPagePreview.filter(fp => fp.email !== "-").length
      const totalWillAppear = fingerPagePreview.length
      
      let message = ""
      if (totalWillAppear > 0) {
        message = `${totalWillAppear} data siap untuk di-import`
        if (withoutEmailCount > 0) {
          message += ` (${withEmailCount} dengan email, ${withoutEmailCount} tanpa email)`
        }
      } else {
        message = "Tidak ada data yang siap untuk di-import"
      }
      
      response.fingerPagePreview = {
        totalRows: totalWillAppear,
        withEmailCount,
        withoutEmailCount,
        sampleData: fingerPagePreview.slice(0, 10), // Ambil 10 sample pertama
        message,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[MEMBERS IMPORT] Unexpected error:", error)
    return NextResponse.json(
      { success: false, message: "Unexpected error processing import" },
      { status: 500 }
    )
  }
}
