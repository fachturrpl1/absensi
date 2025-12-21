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
    
    const { data: departments, error: deptError } = await adminClient
      .from("departments")
      .select(deptFields)
      .eq("organization_id", orgId)
      .eq("is_active", true)

    if (deptError) {
      return NextResponse.json(
        { success: false, message: `Failed to fetch departments: ${deptError.message}` },
        { status: 500 }
      )
    }

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
        email: string
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

        const hasEmail = email && email.trim() !== ""
        if (!hasEmail) {
          failed++
          errors.push({ 
            row: rowNumber, 
            message: `Baris ${rowNumber}: Data tidak dapat di-import karena tidak memiliki email. Silakan lengkapi kolom email terlebih dahulu.`
          })
          continue
        }

        if (email && email !== "") {
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
            const dept = (departments as unknown as { id: number; name: string }[]).find(
              (d) => Number(d.id) === Number(departmentId)
            )
            departmentName = (dept && dept.name) ? dept.name : undefined
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

      // Batch process: Buat user untuk yang belum ada (parallel dengan concurrency limit)
      const CONCURRENCY_LIMIT = 10 // Process 10 users at a time
      const usersToCreate = validRows.filter(vr => !usersByEmail.has(vr.email.toLowerCase()))
      
      console.log(`[MEMBERS IMPORT] Creating ${usersToCreate.length} new users...`)
      
      for (let i = 0; i < usersToCreate.length; i += CONCURRENCY_LIMIT) {
        const batch = usersToCreate.slice(i, i + CONCURRENCY_LIMIT)
        await Promise.all(
          batch.map(async (vr) => {
            try {
              const nameParts = vr.nama.trim().split(" ")
              const firstName = nameParts[0] || vr.nama
              const lastName = nameParts.slice(1).join(" ") || null
              const randomPassword = `MB${orgId}${Date.now()}${Math.random().toString(36).substring(2, 15)}`

              const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
                email: vr.email,
                password: randomPassword,
                email_confirm: true,
                user_metadata: {
                  first_name: firstName,
                  last_name: lastName,
                },
              })

              if (createUserError || !newUser?.user) {
                failed++
                errors.push({
                  row: vr.rowNumber,
                  message: `Baris ${vr.rowNumber}: Gagal membuat user - ${createUserError?.message || "Tidak ada user yang dikembalikan"}`,
                })
                return null
              }

              usersByEmail.set(vr.email.toLowerCase(), { id: newUser.user.id, email: vr.email })
              return { email: vr.email.toLowerCase(), userId: newUser.user.id, rowData: vr }
            } catch (error: any) {
              failed++
              errors.push({
                row: vr.rowNumber,
                message: `Baris ${vr.rowNumber}: Gagal membuat user - ${error.message}`,
              })
              return null
            }
          })
        )
      }

      // Batch upsert user_profiles
      console.log(`[MEMBERS IMPORT] Batch upserting ${validRows.length} user profiles...`)
      const profilePayloads = validRows.map((vr) => {
        const userId = usersByEmail.get(vr.email.toLowerCase())?.id
        if (!userId) return null

        const nameParts = vr.nama.trim().split(" ")
        return {
          id: userId,
          email: vr.email,
          first_name: nameParts[0] || vr.nama,
          last_name: nameParts.slice(1).join(" ") || null,
          phone: vr.noTelepon || null,
          display_name: vr.nickname || vr.nama,
          is_active: true,
        }
      }).filter(Boolean) as any[]

      if (profilePayloads.length > 0) {
        const { error: profileError } = await adminClient
          .from("user_profiles")
          .upsert(profilePayloads, { onConflict: "id" })

        if (profileError) {
          console.error("[MEMBERS IMPORT] Batch profile upsert error:", profileError)
          // Fallback: upsert satu per satu untuk yang error
          for (const vr of validRows) {
            const userId = usersByEmail.get(vr.email.toLowerCase())?.id
            if (!userId) continue
            const nameParts = vr.nama.trim().split(" ")
            await adminClient
              .from("user_profiles")
              .upsert({
                id: userId,
                email: vr.email,
                first_name: nameParts[0] || vr.nama,
                last_name: nameParts.slice(1).join(" ") || null,
                phone: vr.noTelepon || null,
                display_name: vr.nickname || vr.nama,
                is_active: true,
              }, { onConflict: "id" })
          }
        }
      }

      // Batch insert/update organization_members
      console.log(`[MEMBERS IMPORT] Batch processing organization members...`)
      const today = new Date().toISOString().split("T")[0]
      const membersToInsert: any[] = []
      const membersToUpdate: Array<{ id: number; data: any }> = []

      for (const vr of validRows) {
        const userId = usersByEmail.get(vr.email.toLowerCase())?.id
        if (!userId || !orgId) continue

        const existingMember = membersByUserId.get(userId)
        if (existingMember) {
          const updateData: any = { is_active: true }
          if (vr.departmentId) updateData.department_id = vr.departmentId
          if (vr.nik) updateData.biodata_nik = vr.nik
          membersToUpdate.push({ id: existingMember.id, data: updateData })
        } else {
          membersToInsert.push({
            user_id: userId,
            organization_id: orgId,
            department_id: vr.departmentId,
            biodata_nik: vr.nik,
            hire_date: today,
            is_active: true,
          })
        }
      }

      // Batch insert new members
      if (membersToInsert.length > 0) {
        const { data: newMembers, error: insertError } = await adminClient
          .from("organization_members")
          .insert(membersToInsert)
          .select("id, user_id, biodata_nik")

        if (insertError) {
          console.error("[MEMBERS IMPORT] Batch member insert error:", insertError)
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
          batch.map(({ id, data }) =>
            adminClient
              .from("organization_members")
              .update(data)
              .eq("id", id)
          )
        )
      }

      // Batch upsert biodata
      console.log(`[MEMBERS IMPORT] Batch upserting ${validRows.length} biodata records...`)
      const biodataPayloads = validRows.map((vr) => ({
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
      }))

      // Upsert dalam batch (Supabase mendukung batch upsert)
      const BIODATA_BATCH_SIZE = 100
      for (let i = 0; i < biodataPayloads.length; i += BIODATA_BATCH_SIZE) {
        const batch = biodataPayloads.slice(i, i + BIODATA_BATCH_SIZE)
        const { error: biodataError } = await adminClient
          .from("biodata")
          .upsert(batch, { onConflict: "nik" })

        if (biodataError) {
          console.error(`[MEMBERS IMPORT] Batch biodata upsert error (batch ${i / BIODATA_BATCH_SIZE + 1}):`, biodataError)
          // Fallback: upsert satu per satu untuk batch yang error
          for (const payload of batch) {
            await adminClient
              .from("biodata")
              .upsert(payload, { onConflict: "nik" })
          }
        }
      }

      // Audit logs (optional, bisa di-skip jika terlalu lambat)
      if (trackHistory) {
        const auditLogs = validRows.map((vr) => ({
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
          const { error: auditError } = await adminClient.from("audit_logs").insert(batch)
          if (auditError) {
            console.error("[MEMBERS IMPORT] Failed to write audit log batch:", auditError)
          }
        }
      }

      success = validRows.length
      console.log(`[MEMBERS IMPORT] Batch processing complete: ${success} success, ${failed} failed`)

      // Kumpulkan data untuk preview halaman finger (hanya yang punya email - semua validRows sudah punya email)
      validRows.forEach((vr) => {
        fingerPagePreview.push({
          row: vr.rowNumber,
          nik: vr.nik,
          nama: vr.nama,
          email: vr.email,
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

      // Email wajib untuk bisa di-import (karena perlu user account untuk organization_members)
      // Validasi email dilakukan di sini untuk semua mode (test dan import)
      const hasEmail = email && email.trim() !== ""
      if (!hasEmail) {
        failed++
        const errorMessage = `Baris ${rowNumber}: Data tidak dapat di-import karena tidak memiliki email. Silakan lengkapi kolom email terlebih dahulu.`
        errors.push({ 
          row: rowNumber, 
          message: errorMessage
        })
        // Di mode test, hitung yang tidak punya email
        if (mode === "test") {
          withoutEmailCount++
        }
        continue
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
            errors.push({
              row: rowNumber,
              message: `Tanggal Lahir invalid: "${tanggalLahirRaw}"`,
            })
              continue
            }
          }
        }

      // Validasi NIK harus dilakukan sebelum mode test/import
      if (nik && nik.length < 10) {
        failed++
        errors.push({
          row: rowNumber,
          message: `NIK terlalu pendek (minimal 10 karakter): "${nik}"`,
        })
        continue
      }

      if (email && email !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          failed++
          errors.push({
            row: rowNumber,
            message: `Email format invalid: "${email}"`,
          })
          continue
        }
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
        // Di mode test, lakukan SEMUA operasi yang sama dengan import (termasuk create user, update profile, dll)
        // Tapi kita akan cleanup setelah test selesai
        // Row tanpa email sudah di-handle di validasi email di atas
        
        try {
          // Lakukan semua operasi yang sama dengan import mode
          let userId: string | null = null
          let createdUserInTest = false

          // OPTIMASI: Gunakan cached usersByEmail map
          const existingUserData = usersByEmail.get(email.toLowerCase())

          if (existingUserData) {
            userId = existingUserData.id

            // Test: Cek apakah bisa update user profile
            const { error: profileError } = await adminClient
              .from("user_profiles")
              .upsert(
                {
                  id: userId,
                  email: email,
                  first_name: nama.split(" ")[0] || nama,
                  last_name: nama.split(" ").slice(1).join(" ") || null,
                  phone: noTelepon || null,
                  display_name: nickname || nama,
                  is_active: true,
                },
                {
                  onConflict: "id",
                }
              )

            if (profileError) {
              failed++
              errors.push({
                row: rowNumber,
                message: `Baris ${rowNumber}: Gagal memperbarui profil user - ${profileError.message}`,
              })
          continue
        }
          } else {
            // Test: Cek apakah bisa create user baru
            const randomPassword = `TEST${orgId}${Date.now()}${Math.random().toString(36).substring(2, 15)}`
            const nameParts = nama.trim().split(" ")
            const firstName = nameParts[0] || nama
            const lastName = nameParts.slice(1).join(" ") || null

            const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
              email: email,
              password: randomPassword,
              email_confirm: true,
              user_metadata: {
                first_name: firstName,
                last_name: lastName,
              },
            })

            if (createUserError) {
              failed++
              errors.push({
                row: rowNumber,
                message: `Baris ${rowNumber}: Gagal membuat user - ${createUserError.message}`,
              })
          continue
        }

            if (!newUser?.user) {
              failed++
              errors.push({
                row: rowNumber,
                message: `Baris ${rowNumber}: Gagal membuat user - Tidak ada user yang dikembalikan`,
              })
              continue
            }
              
            userId = newUser.user.id
            createdUserInTest = true

            // OPTIMASI: Hapus delay yang tidak perlu
            // await new Promise((resolve) => setTimeout(resolve, 100))

            // Test: Cek apakah bisa create user profile
            const { error: profileError } = await adminClient
              .from("user_profiles")
              .upsert(
                {
                  id: userId,
                  email: email,
                  first_name: firstName,
                  last_name: lastName,
                  phone: noTelepon || null,
                  display_name: nickname || nama,
                  is_active: true,
                },
                {
                  onConflict: "id",
                }
              )

            if (profileError) {
              failed++
              errors.push({
                row: rowNumber,
                message: `Baris ${rowNumber}: Gagal membuat profil user - ${profileError.message}`,
              })
              // Cleanup: hapus user yang baru dibuat
              try {
                await adminClient.auth.admin.deleteUser(userId)
              } catch (deleteError) {
                console.error(`[MEMBERS IMPORT TEST] Failed to cleanup user ${userId}:`, deleteError)
              }
              continue
            }
          }

          // Test: Cek apakah bisa membuat organization_member
          if (orgId && userId) {
            const today = new Date().toISOString().split("T")[0]

            // OPTIMASI: Gunakan cached membersByUserId map
            const existingMember = membersByUserId.get(userId)

            if (existingMember) {
              // Test: update department dan biodata_nik jika diperlukan
              const updateData: any = {
                is_active: true,
              }
              // Cek department_id dari database (kita perlu query sekali untuk existing member)
              const { data: memberData } = await adminClient
                .from("organization_members")
                .select("department_id")
                .eq("id", existingMember.id)
                .single()
              
              if (!memberData?.department_id && departmentId) {
                updateData.department_id = departmentId
              }
              // Update biodata_nik dengan NIK jika belum ada atau berbeda
              if (nik && existingMember.biodata_nik !== nik) {
                updateData.biodata_nik = nik
              }

              if (Object.keys(updateData).length > 1) { // Lebih dari is_active saja
                const { error: updateMemberError } = await adminClient
                  .from("organization_members")
                  .update(updateData)
                  .eq("id", existingMember.id)

                if (updateMemberError) {
                  failed++
                  errors.push({
                    row: rowNumber,
                    message: `Baris ${rowNumber}: Gagal memperbarui member organisasi - ${updateMemberError.message}`,
                  })
                  // Cleanup jika user baru dibuat
                  if (createdUserInTest) {
                    try {
                      await adminClient.auth.admin.deleteUser(userId)
                    } catch (deleteError) {
                      console.error(`[MEMBERS IMPORT TEST] Failed to cleanup user ${userId}:`, deleteError)
                    }
                  }
                  continue
                }
              } else {
                // Jika hanya is_active, skip update (tidak perlu query)
              }
            } else {
              // Test: Cek apakah bisa insert organization_member
              const { error: memberInsertError } = await adminClient
                .from("organization_members")
                .insert({
                  user_id: userId,
                  organization_id: orgId,
                  department_id: departmentId,
                  biodata_nik: nik, // Isi biodata_nik dengan NIK
                  hire_date: today,
                  is_active: true,
                })

              if (memberInsertError) {
                failed++
                errors.push({
                  row: rowNumber,
                  message: `Baris ${rowNumber}: Gagal membuat member organisasi - ${memberInsertError.message}`,
                })
                // Cleanup jika user baru dibuat
                if (createdUserInTest) {
                  try {
                    await adminClient.auth.admin.deleteUser(userId)
                  } catch (deleteError) {
                    console.error(`[MEMBERS IMPORT TEST] Failed to cleanup user ${userId}:`, deleteError)
                  }
                }
                continue
              }
            }
          }

          // Test: Cek apakah bisa upsert biodata
          const biodataPayload: any = {
            nik,
            nama,
            nickname: nickname || null,
            nisn: nisn || null,
            jenis_kelamin: jenisKelamin || null,
            tempat_lahir: tempatLahir || null,
            tanggal_lahir: tanggalLahir,
            agama: agama || null,
            jalan: jalan || null,
            rt: rt || null,
            rw: rw || null,
            dusun: dusun || null,
            kelurahan: kelurahan || null,
            kecamatan: kecamatan || null,
            no_telepon: noTelepon || null,
            email: email || null,
            department_id: departmentId,
          }

          const { error: upsertError } = await adminClient
            .from("biodata")
            .upsert(biodataPayload, {
              onConflict: "nik",
            })

          if (upsertError) {
            failed++
            errors.push({
              row: rowNumber,
              message: `Baris ${rowNumber}: Gagal menyimpan biodata - ${upsertError.message}`,
            })
            // Cleanup jika user baru dibuat
            if (createdUserInTest) {
              try {
                await adminClient.auth.admin.deleteUser(userId)
              } catch (deleteError) {
                console.error(`[MEMBERS IMPORT TEST] Failed to cleanup user ${userId}:`, deleteError)
              }
            }
              continue
            }

          // OPTIMASI: biodata_nik sudah diisi saat insert/update organization_members di atas
          // Tidak perlu update lagi di sini

          // Jika semua test passed, hitung sebagai success
          success++
          
          // Kumpulkan data untuk preview halaman finger (hanya yang punya email)
          let departmentName: string | undefined = undefined
          if (departmentId && departments && departments.length > 0) {
            const dept = (departments as unknown as { id: number; name: string }[]).find(
              (d) => Number(d.id) === Number(departmentId)
            )
            departmentName = (dept && dept.name) ? dept.name : undefined
          }
          
          fingerPagePreview.push({
            row: rowNumber,
            nik,
            nama,
            email: email,
            department: departmentName,
          })

          // Cleanup: Hapus data yang dibuat di test mode
          if (createdUserInTest && userId) {
            // Hapus organization_member yang baru dibuat
            try {
              await adminClient
                .from("organization_members")
                .delete()
                .eq("user_id", userId)
                .eq("organization_id", orgId)
            } catch (deleteError) {
              console.error(`[MEMBERS IMPORT TEST] Failed to cleanup organization_member:`, deleteError)
            }

            // Hapus user profile
            try {
              await adminClient
                .from("user_profiles")
                .delete()
                .eq("id", userId)
            } catch (deleteError) {
              console.error(`[MEMBERS IMPORT TEST] Failed to cleanup user profile:`, deleteError)
            }

            // Hapus user dari auth
            try {
              await adminClient.auth.admin.deleteUser(userId)
            } catch (deleteError) {
              console.error(`[MEMBERS IMPORT TEST] Failed to cleanup user ${userId}:`, deleteError)
            }
          }
        } catch (error: any) {
          failed++
          errors.push({
            row: rowNumber,
            message: `Validation error: ${error.message || "Unexpected error"}`,
          })
        }
        continue
      }

      try {
        // Email sudah divalidasi di atas, jadi pasti ada
        let userId: string | null = null

        // OPTIMASI: Gunakan cached usersByEmail map
        const existingUserData = usersByEmail.get(email.toLowerCase())

        if (existingUserData) {
          userId = existingUserData.id

          const { error: profileError } = await adminClient
            .from("user_profiles")
            .upsert(
              {
                id: userId,
                email: email,
                first_name: nama.split(" ")[0] || nama,
                last_name: nama.split(" ").slice(1).join(" ") || null,
                phone: noTelepon || null,
                display_name: nickname || nama,
                is_active: true,
              },
              {
                onConflict: "id",
              }
            )

          if (profileError) {
            failed++
            errors.push({
              row: rowNumber,
              message: `Baris ${rowNumber}: Gagal memperbarui profil user - ${profileError.message}`,
            })
            continue
          }
        } else {
          const randomPassword = `MB${orgId}${Date.now()}${Math.random().toString(36).substring(2, 15)}`

          const nameParts = nama.trim().split(" ")
          const firstName = nameParts[0] || nama
          const lastName = nameParts.slice(1).join(" ") || null

          const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
            email: email,
            password: randomPassword,
            email_confirm: true,
            user_metadata: {
              first_name: firstName,
              last_name: lastName,
            },
          })

          if (createUserError) {
            failed++
            errors.push({
              row: rowNumber,
              message: `Baris ${rowNumber}: Gagal membuat user - ${createUserError.message}`,
            })
            continue
          }

          if (!newUser?.user) {
            failed++
            errors.push({
              row: rowNumber,
              message: `Baris ${rowNumber}: Gagal membuat user - Tidak ada user yang dikembalikan`,
            })
            continue
          }
            
          userId = newUser.user.id

          // OPTIMASI: Hapus delay yang tidak perlu
          // await new Promise((resolve) => setTimeout(resolve, 100))

          // Update cache untuk user baru
          usersByEmail.set(email.toLowerCase(), { id: userId, email: email })

          const { error: profileError } = await adminClient
            .from("user_profiles")
            .upsert(
              {
                id: userId,
                email: email,
                first_name: firstName,
                last_name: lastName,
                phone: noTelepon || null,
                display_name: nickname || nama,
                is_active: true,
              },
              {
                onConflict: "id",
              }
            )

          if (profileError) {
            failed++
            errors.push({
              row: rowNumber,
              message: `Baris ${rowNumber}: Gagal membuat profil user - ${profileError.message}`,
            })
            try {
              await adminClient.auth.admin.deleteUser(userId)
            } catch (deleteError) {
              console.error(`[MEMBERS IMPORT] Failed to cleanup user ${userId}:`, deleteError)
            }
            continue
          }
        }

        // Buat/update organization_members (email sudah wajib, jadi userId pasti ada)
        if (orgId && userId) {
          const today = new Date().toISOString().split("T")[0]

          // OPTIMASI: Gunakan cached membersByUserId map
          const existingMember = membersByUserId.get(userId)

          if (existingMember) {
            // Update department dan biodata_nik jika diperlukan
            const updateData: any = {
              is_active: true,
            }
            // Cek department_id dari database (kita perlu query sekali untuk existing member)
            const { data: memberData } = await adminClient
              .from("organization_members")
              .select("department_id")
              .eq("id", existingMember.id)
              .single()
            
            if (!memberData?.department_id && departmentId) {
              updateData.department_id = departmentId
            }
            // Update biodata_nik dengan NIK jika belum ada atau berbeda
            if (nik && existingMember.biodata_nik !== nik) {
              updateData.biodata_nik = nik
            }

            if (Object.keys(updateData).length > 1) { // Lebih dari is_active saja
              const { error: updateMemberError } = await adminClient
                .from("organization_members")
                .update(updateData)
                .eq("id", existingMember.id)

              if (updateMemberError) {
                failed++
                errors.push({
                  row: rowNumber,
                  message: `Baris ${rowNumber}: Gagal memperbarui member organisasi - ${updateMemberError.message}`,
                })
                continue
              }
            }
          } else {
            const { data: newMember, error: memberInsertError } = await adminClient
              .from("organization_members")
              .insert({
                user_id: userId,
                organization_id: orgId,
                department_id: departmentId,
                biodata_nik: nik, // Isi biodata_nik dengan NIK
                hire_date: today,
                is_active: true,
              })
              .select("id")
              .single()

            if (memberInsertError) {
              failed++
              errors.push({
                row: rowNumber,
                message: `Baris ${rowNumber}: Gagal membuat member organisasi - ${memberInsertError.message}`,
              })
              continue
            }
            
            // Update cache untuk member baru
            if (newMember) {
              membersByUserId.set(userId, { id: newMember.id, biodata_nik: nik })
            }
          }
        }

        const biodataPayload: any = {
          nik,
          nama,
          nickname: nickname || null,
          nisn: nisn || null,
          jenis_kelamin: jenisKelamin || null,
          tempat_lahir: tempatLahir || null,
          tanggal_lahir: tanggalLahir,
          agama: agama || null,
          jalan: jalan || null,
          rt: rt || null,
          rw: rw || null,
          dusun: dusun || null,
          kelurahan: kelurahan || null,
          kecamatan: kecamatan || null,
          no_telepon: noTelepon || null,
          email: email || null,
          department_id: departmentId,
        }

        const { error: upsertError } = await adminClient
          .from("biodata")
          .upsert(biodataPayload, {
            onConflict: "nik",
          })

        if (upsertError) {
          failed++
          errors.push({
            row: rowNumber,
            message: `Baris ${rowNumber}: Gagal menyimpan biodata - ${upsertError.message}`,
          })
          continue
        }

        // OPTIMASI: biodata_nik sudah diisi saat insert/update organization_members di atas
        // Tidak perlu update lagi di sini

        if (trackHistory && mode === "import") {
              try {
                await adminClient
              .from("audit_logs")
                  .insert({
                    organization_id: orgId,
                    user_id: user.id,
                action: "member_import",
                entity_type: "biodata",
                entity_id: null,
                    old_values: null,
                    new_values: {
                  nik,
                  nama,
                  email,
                  department_id: departmentId,
                  row_number: rowNumber,
                      file_name: file.name,
                    },
                    ip_address: null,
                    user_agent: null,
                    session_id: null,
                  })
              } catch (auditError) {
            console.error("[MEMBERS IMPORT] Failed to write audit log:", auditError)
          }
        }

        success++
      } catch (error: any) {
        failed++
        errors.push({
          row: rowNumber,
          message: error.message || "Unexpected error",
        })
        console.error(`[MEMBERS IMPORT] Error processing row ${rowNumber}:`, error)
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
      const withEmailCount = fingerPagePreview.length
      const totalWillAppear = withEmailCount
      
      let message = ""
      if (totalWillAppear > 0) {
        message = `${totalWillAppear} data akan muncul di halaman Fingerprint setelah import`
      } else {
        message = "Tidak ada data yang akan muncul di halaman Fingerprint"
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

