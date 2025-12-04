import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { createInvitation } from '@/action/invitations'

/**
 * Mapping structure from frontend
 * Example:
 * {
 *   "email": "Email Address",
 *   "first_name": "First Name",
 *   "last_name": "Last Name",
 *   "phone": "Phone Number",
 *   "department": "Group",
 *   "role": null  // null means skip this field
 * }
 */
interface ColumnMapping {
  [databaseField: string]: string | null
}

interface EnabledFields {
  [databaseField: string]: boolean
}

/**
 * API Route: POST /api/members/import/process
 * 
 * Purpose: Process Excel import with user-defined column mapping
 * 
 * Request Body: FormData with:
 *   - file: Excel file
 *   - mapping: JSON string of ColumnMapping
 * 
 * Response: { success: boolean, summary: { success: number, failed: number, errors: string[] } }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappingJson = formData.get('mapping') as string
    const mode = (formData.get('mode') as string) || 'import' // 'test' or 'import'
    const enabledJson = formData.get('enabledFields') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    if (!mappingJson) {
      return NextResponse.json(
        { success: false, message: 'No mapping provided' },
        { status: 400 }
      )
    }

    // Parse mapping
    let mapping: ColumnMapping
    let enabledFields: EnabledFields = {}
    try {
      mapping = JSON.parse(mappingJson)
      if (enabledJson) {
        enabledFields = JSON.parse(enabledJson)
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid mapping JSON' },
        { status: 400 }
      )
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    
    const sheetName = workbook.SheetNames?.[0]
    if (!sheetName) {
      return NextResponse.json(
        { success: false, message: 'No sheet found in Excel file' },
        { status: 400 }
      )
    }

    const sheet = workbook.Sheets[sheetName]

    // Safety check untuk menghindari error jika sheet tidak ditemukan / undefined
    if (!sheet) {
      return NextResponse.json(
        { success: false, message: 'Worksheet not found in Excel file' },
        { status: 400 }
      )
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { 
      defval: '',
      raw: false
    })

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Excel file is empty or has no data' },
        { status: 400 }
      )
    }

    // Validate: email is required for invitations
    if (!mapping.email) {
      return NextResponse.json(
        { success: false, message: 'Email mapping is required' },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Use admin client to avoid RLS hiding membership rows
    const { data: member } = await adminClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!member) {
      return NextResponse.json(
        { success: false, message: 'User not member of any organization' },
        { status: 403 }
      )
    }

    // Get reference data for lookups
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name, code')
      .eq('organization_id', member.organization_id)
      .eq('is_active', true)

    const { data: positions } = await supabase
      .from('positions')
      .select('id, title, name, code')
      .eq('organization_id', member.organization_id)
      .eq('is_active', true)

    const { data: roles } = await supabase
      .from('system_roles')
      .select('id, name, code')

    // Process each row
    const summary = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Helper function to find ID by name/code
    const findId = (
      collection: any[],
      value: string,
      keys: string[]
    ): { id?: string; notFound: boolean } => {
      const normalized = value.trim().toLowerCase()
      if (!normalized) return { id: undefined, notFound: false }
      
      const match = collection?.find((item: any) =>
        keys.some((key) => String(item?.[key] ?? '').trim().toLowerCase() === normalized)
      )
      
      if (!match) return { id: undefined, notFound: true }
      return { id: String(match.id), notFound: false }
    }

    // Helper function to get value from Excel row based on mapping
    const getMappedValue = (row: Record<string, any>, dbField: string): string => {
      // Jika field dimatikan dari UI, selalu kembalikan string kosong
      if (enabledFields && enabledFields[dbField] === false) {
        return ''
      }
      const excelColumn = mapping[dbField]
      if (!excelColumn) return ''
      return String(row[excelColumn] || '').trim()
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      if (!row) continue

      try {
        // Extract values based on mapping
        const email = getMappedValue(row, 'email')
        if (!email) {
          summary.failed++
          summary.errors.push(`Row ${index + 2}: Email is required`)
          continue
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          summary.failed++
          summary.errors.push(`Row ${index + 2}: Invalid email format: ${email}`)
          continue
        }

        // Build invitation payload
        const invitationPayload: Parameters<typeof createInvitation>[0] = {
          email,
        }

        // Map optional fields
        const phone = getMappedValue(row, 'phone')
        if (phone) invitationPayload.phone = phone

        // Map department/group
        const departmentValue = getMappedValue(row, 'department')
        if (departmentValue && departments) {
          const deptResult = findId(departments, departmentValue, ['name', 'code'])
          if (deptResult.id) {
            invitationPayload.department_id = deptResult.id
          } else if (deptResult.notFound) {
            summary.failed++
            summary.errors.push(`Row ${index + 2}: Department/Group "${departmentValue}" not found`)
            continue
          }
        }

        // Map position
        const positionValue = getMappedValue(row, 'position')
        if (positionValue && positions) {
          const posResult = findId(positions, positionValue, ['title', 'name', 'code'])
          if (posResult.id) {
            invitationPayload.position_id = posResult.id
          } else if (posResult.notFound) {
            // Position is optional, just log warning but don't fail
            summary.errors.push(`Row ${index + 2}: Position "${positionValue}" not found (skipped)`)
          }
        }

        // Map role
        const roleValue = getMappedValue(row, 'role')
        if (roleValue && roles) {
          const roleResult = findId(roles, roleValue, ['name', 'code'])
          if (roleResult.id) {
            invitationPayload.role_id = roleResult.id
          } else if (roleResult.notFound) {
            // Role is optional, just log warning but don't fail
            summary.errors.push(`Row ${index + 2}: Role "${roleValue}" not found (skipped)`)
          }
        }

        // Map message/notes
        const message = getMappedValue(row, 'message')
        if (message) invitationPayload.message = message

        if (mode === 'test') {
          // Dry-run: only validate, don't create invitations
          summary.success++
        } else {
          // Create invitation (real import)
          const result = await createInvitation(invitationPayload)
          
          if (result.success) {
            summary.success++
          } else {
            summary.failed++
            summary.errors.push(`Row ${index + 2}: ${result.message || 'Failed to send invitation'}`)
          }
        }
      } catch (error) {
        summary.failed++
        summary.errors.push(
          `Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error) {
    console.error('Error processing import:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process import',
      },
      { status: 500 }
    )
  }
}

