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
    const trackHistory = formData.get('trackHistory') === 'true'
    const allowMatchingWithSubfields = formData.get('allowMatchingWithSubfields') === 'true'

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

    // Normalize organization_id to number for comparison
    const orgId = typeof member.organization_id === 'string' 
      ? parseInt(member.organization_id, 10) 
      : member.organization_id
    
    console.log(`[IMPORT] Using organization_id: ${orgId} (type: ${typeof orgId}, original: ${member.organization_id}) for user ${user.id}`)

    // Get reference data for lookups
    // Use admin client to bypass RLS and get all departments (including inactive)
    console.log(`[IMPORT] ========================================`)
    console.log(`[IMPORT] Fetching departments for organization_id: ${orgId} (type: ${typeof orgId})`)
    console.log(`[IMPORT] Using adminClient to bypass RLS`)
    
    // Try multiple query strategies to ensure we get all departments
    // Include description for subfield matching if enabled
    const deptFields = allowMatchingWithSubfields 
      ? 'id, name, code, is_active, organization_id, description'
      : 'id, name, code, is_active, organization_id'
    
    // Strategy 1: Query with number
    const { data: deptsByNumber, error: errNumber } = await adminClient
      .from('departments')
      .select(deptFields)
      .eq('organization_id', orgId)
    
    // Strategy 2: Query with string
    const { data: deptsByString, error: errString } = await adminClient
      .from('departments')
      .select(deptFields)
      .eq('organization_id', String(orgId))
    
    // Strategy 3: Get ALL departments and filter in code
    const { data: allDepartments, error: allDeptError } = await adminClient
      .from('departments')
      .select(deptFields)
      // NO filters at all - get everything
    
    console.log(`[IMPORT] Query results:`)
    console.log(`  By number (${orgId}): ${deptsByNumber?.length || 0} departments`, errNumber?.message || 'OK')
    console.log(`  By string ("${orgId}"): ${deptsByString?.length || 0} departments`, errString?.message || 'OK')
    console.log(`  All departments: ${allDepartments?.length || 0} departments`, allDeptError?.message || 'OK')
    
    // Combine all results and deduplicate by id
    const allDeptResults = [
      ...(deptsByNumber || []),
      ...(deptsByString || []),
      ...(allDepartments || [])
    ]
    const uniqueDepts = Array.from(
      new Map(allDeptResults.map((d: any) => [d.id, d])).values()
    )
    
    // Check if X RPL exists anywhere
    const xRplMatches = uniqueDepts.filter((d: any) => {
      const nameMatch = d.name?.toLowerCase().trim() === 'x rpl'
      const codeMatch = d.code?.toLowerCase().trim() === 'x_rpl'
      return nameMatch || codeMatch
    })
    
    if (xRplMatches.length > 0) {
      console.log(`[IMPORT] 🔍 Found X RPL matches:`, xRplMatches.map((d: any) => 
        `${d.name} (${d.code}) - org:${d.organization_id} (type: ${typeof d.organization_id}) - active:${d.is_active}`
      ))
    } else {
      console.log(`[IMPORT] ⚠️ X RPL not found in results`)
      // Search in all departments
      const searchInAll = allDepartments?.filter((d: any) => 
        d.name?.toLowerCase().includes('rpl') || d.code?.toLowerCase().includes('rpl')
      ) || []
      if (searchInAll.length > 0) {
        console.log(`[IMPORT] But found RPL in other departments:`, searchInAll.map((d: any) => 
          `${d.name} (${d.code}) - org:${d.organization_id}`
        ))
      }
    }
    
    // Filter by organization_id - handle both string and number
    const departments = uniqueDepts.filter((d: any) => {
      const deptOrgId = typeof d.organization_id === 'string' 
        ? parseInt(d.organization_id, 10) 
        : (typeof d.organization_id === 'number' ? d.organization_id : parseInt(String(d.organization_id), 10))
      const match = deptOrgId === orgId
      if (match && (d.name?.toLowerCase().includes('rpl') || d.code?.toLowerCase().includes('rpl'))) {
        console.log(`[IMPORT] ✅ Found RPL department in filtered results: ${d.name} (${d.code})`)
      }
      return match
    })
    
    // Final check: Is X RPL in the departments array?
    const xRplFinalCheck = departments.find((d: any) => {
      const nameMatch = d.name?.toLowerCase().trim() === 'x rpl'
      const codeMatch = d.code?.toLowerCase().trim() === 'x_rpl'
      return nameMatch || codeMatch
    })
    
    if (xRplFinalCheck) {
      console.log(`[IMPORT] ✅✅✅ X RPL IS IN DEPARTMENTS ARRAY!`, xRplFinalCheck)
    } else {
      console.log(`[IMPORT] ❌❌❌ X RPL NOT IN DEPARTMENTS ARRAY!`)
      console.log(`[IMPORT] Departments in array:`, departments.map((d: any) => `${d.name} (${d.code})`).join(', '))
    }
    
    console.log(`[IMPORT] Filtered departments for org ${orgId}:`, {
      count: departments.length,
      departments: departments.map((d: any) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        is_active: d.is_active,
        org_id: d.organization_id
      }))
    })
    
    if (allDeptError) {
      console.error('[IMPORT] Error fetching all departments:', allDeptError)
    }
    
    // Log departments for debugging
    if (departments && departments.length > 0) {
      console.log(`[IMPORT] ✅ Found ${departments.length} departments for org ${orgId}:`, 
        departments.map((d: any) => `"${d.name}" (code: "${d.code}")`).join(', '))
    } else {
      console.warn(`[IMPORT] ⚠️ No departments found for organization ${orgId}`)
      console.warn(`[IMPORT] Total departments in DB: ${allDepartments?.length || 0}`)
      if (allDepartments && allDepartments.length > 0) {
        const uniqueOrgIds = [...new Set(allDepartments.map((d: any) => {
          const id = typeof d.organization_id === 'string' 
            ? parseInt(d.organization_id, 10) 
            : d.organization_id
          return id
        }))]
        console.warn(`[IMPORT] Available org_ids in departments:`, uniqueOrgIds)
        console.warn(`[IMPORT] Looking for org_id: ${orgId} (type: ${typeof orgId})`)
      }
    }
    console.log(`[IMPORT] ========================================`)

    // Fetch positions with description for subfield matching
    const { data: positions } = await adminClient
      .from('positions')
      .select('id, title, name, code, description')
      .eq('organization_id', member.organization_id)
      .eq('is_active', true)

    // Fetch roles with description for subfield matching
    const { data: roles } = await adminClient
      .from('system_roles')
      .select('id, name, code, description')

    // Process each row
    const summary = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Helper function to normalize string for flexible matching
    // Removes spaces, dashes, underscores, and converts to lowercase
    const normalizeForMatching = (str: string): string => {
      if (!str) return ''
      return str
        .trim()
        .toLowerCase()
        .replace(/[\s\-_\.]/g, '') // Remove spaces, dashes, underscores, dots
        .replace(/[^\w]/g, '') // Remove special characters, keep only alphanumeric
    }
    
    // Test normalization with X RPL
    console.log(`[IMPORT] Testing normalization:`)
    console.log(`  "X RPL" -> "${normalizeForMatching('X RPL')}"`)
    console.log(`  "x_rpl" -> "${normalizeForMatching('x_rpl')}"`)
    console.log(`  "X-RPL" -> "${normalizeForMatching('X-RPL')}"`)
    console.log(`  "x.rpl" -> "${normalizeForMatching('x.rpl')}"`)

    // Helper function to find ID by name/code with flexible matching
    // If allowMatchingWithSubfields is true, also searches in description and other subfields
    const findId = (
      collection: any[],
      value: string,
      keys: string[],
      subfieldKeys?: string[]
    ): { id?: string; notFound: boolean } => {
      if (!value || !collection || collection.length === 0) {
        console.log(`[FINDID] Empty value or collection. Value: "${value}", Collection length: ${collection?.length || 0}`)
        return { id: undefined, notFound: false }
      }

      const searchValue = value.trim()
      const normalizedSearch = normalizeForMatching(searchValue)
      
      console.log(`[FINDID] Searching for: "${searchValue}" (normalized: "${normalizedSearch}")`)
      console.log(`[FINDID] Collection has ${collection.length} items`)
      
      if (!normalizedSearch) {
        return { id: undefined, notFound: false }
      }
      
      // First try exact match (case-insensitive, trimmed)
      let match = collection.find((item: any) =>
        keys.some((key) => {
          const itemValue = String(item?.[key] ?? '').trim()
          const match = itemValue.toLowerCase() === searchValue.toLowerCase()
          if (match) {
            console.log(`[FINDID] Exact match found: ${key}="${itemValue}"`)
          }
          return match
        })
      )
      
      // If exact match not found, try flexible matching (ignore spaces, dashes, underscores, dots)
      if (!match) {
        console.log(`[FINDID] No exact match, trying flexible matching...`)
        match = collection.find((item: any) =>
          keys.some((key) => {
            const itemValue = String(item?.[key] ?? '').trim()
            const normalizedItem = normalizeForMatching(itemValue)
            const match = normalizedItem === normalizedSearch && normalizedItem.length > 0
            if (match) {
              console.log(`[FINDID] Flexible match found: ${key}="${itemValue}" (normalized: "${normalizedItem}")`)
            }
            return match
          })
        )
      }
      
      // If still not found and allowMatchingWithSubfields is enabled, try matching with subfields
      if (!match && allowMatchingWithSubfields && subfieldKeys && subfieldKeys.length > 0) {
        console.log(`[FINDID] No match in primary keys, trying subfield matching...`)
        match = collection.find((item: any) =>
          subfieldKeys.some((key) => {
            const itemValue = String(item?.[key] ?? '').trim()
            if (!itemValue) return false
            
            // Try exact match in subfield
            if (itemValue.toLowerCase().includes(searchValue.toLowerCase())) {
              console.log(`[FINDID] Subfield exact match found: ${key}="${itemValue}"`)
              return true
            }
            
            // Try normalized match in subfield
            const normalizedItem = normalizeForMatching(itemValue)
            if (normalizedItem.includes(normalizedSearch) || normalizedSearch.includes(normalizedItem)) {
              console.log(`[FINDID] Subfield normalized match found: ${key}="${itemValue}" (normalized: "${normalizedItem}")`)
              return true
            }
            
            return false
          })
        )
      }
      
      // If still not found, try partial match (contains)
      if (!match && normalizedSearch.length >= 3) {
        console.log(`[FINDID] No flexible match, trying partial matching...`)
        match = collection.find((item: any) =>
          keys.some((key) => {
            const itemValue = String(item?.[key] ?? '').trim()
            const normalizedItem = normalizeForMatching(itemValue)
            const match = normalizedItem.includes(normalizedSearch) || normalizedSearch.includes(normalizedItem)
            if (match) {
              console.log(`[FINDID] Partial match found: ${key}="${itemValue}" (normalized: "${normalizedItem}")`)
            }
            return match
          })
        )
      }
      
      if (!match) {
        console.log(`[FINDID] No match found for "${searchValue}"`)
        // Log all available values for debugging
        const availableValues = collection.map((item: any) => 
          keys.map((key) => `${key}="${item[key]}"`).join(', ')
        ).join(' | ')
        console.log(`[FINDID] Available values: ${availableValues}`)
        return { id: undefined, notFound: true }
      }
      
      console.log(`[FINDID] Match found! ID: ${match.id}`)
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
      
      // Get value from row, handling various formats
      const rawValue = row[excelColumn]
      if (rawValue === null || rawValue === undefined) return ''
      
      // Convert to string and trim
      const stringValue = String(rawValue).trim()
      return stringValue
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      if (!row) continue

      try {
        // Extract values based on mapping
        const email = getMappedValue(row, 'email')
        if (!email || email === '') {
          summary.failed++
          summary.errors.push(`Row ${index + 2}: Email is required (column "${mapping.email || 'not mapped'}" is empty)`)
          continue
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          summary.failed++
          summary.errors.push(`Row ${index + 2}: Invalid email format "${email}". Please check the email address.`)
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
          // Debug: Log search value
          console.log(`Searching for department: "${departmentValue}"`)
          
          const deptResult = findId(
            departments, 
            departmentValue, 
            ['name', 'code'],
            allowMatchingWithSubfields ? ['description'] : undefined
          )
          if (deptResult.id) {
            const foundDept = departments.find((d: any) => String(d.id) === deptResult.id)
            console.log(`Found department: ${foundDept?.name} (${foundDept?.code})`)
            invitationPayload.department_id = deptResult.id
          } else if (deptResult.notFound) {
            // Check if department exists in other organizations
            const { data: deptInOtherOrg } = await adminClient
              .from('departments')
              .select('id, name, code, organization_id')
              .or(`name.ilike.%${departmentValue}%,code.ilike.%${departmentValue}%`)
              .limit(5)
            
            // Try to find exact match in other orgs
            const exactMatch = deptInOtherOrg?.find((d: any) => {
              const nameMatch = d.name?.toLowerCase().trim() === departmentValue.toLowerCase().trim()
              const codeMatch = d.code?.toLowerCase().trim() === departmentValue.toLowerCase().trim()
              return nameMatch || codeMatch
            })
            
            if (exactMatch) {
              // Department exists in another organization - auto-create it in current org
              console.log(`[IMPORT] Department "${departmentValue}" exists in org ${exactMatch.organization_id}, auto-creating in org ${orgId}`)
              
              const newDeptCode = exactMatch.code || departmentValue.toLowerCase().replace(/\s+/g, '_')
              const newDeptName = exactMatch.name || departmentValue
              
              const { data: newDept, error: createError } = await adminClient
                .from('departments')
                .insert({
                  organization_id: orgId,
                  code: newDeptCode,
                  name: newDeptName,
                  is_active: true,
                })
                .select()
                .single()
              
              if (createError) {
                console.error(`[IMPORT] Failed to create department:`, createError)
                const availableDepts = departments
                  .map((d: any) => `"${d.name}" (code: "${d.code}")`)
                  .join(', ')
                summary.failed++
                summary.errors.push(
                  `Row ${index + 2}: Department/Group "${departmentValue}" not found and failed to create. Available: ${availableDepts || 'none'}`
                )
                continue
              }
              
              // Add to departments array and use it
              departments.push(newDept)
              invitationPayload.department_id = String(newDept.id)
              console.log(`[IMPORT] ✅ Auto-created and using department: ${newDept.name} (${newDept.code})`)
            } else {
              // Department doesn't exist anywhere - show error
              const availableDepts = departments
                .map((d: any) => `"${d.name}" (code: "${d.code}")`)
                .join(', ')
              
              console.log(`[IMPORT] Department "${departmentValue}" not found in any organization`)
              summary.failed++
              summary.errors.push(
                `Row ${index + 2}: Department/Group "${departmentValue}" not found. Available: ${availableDepts || 'none'}`
              )
              continue
            }
          }
        }

        // Map position
        const positionValue = getMappedValue(row, 'position')
        if (positionValue && positions) {
          const posResult = findId(
            positions, 
            positionValue, 
            ['title', 'name', 'code'],
            allowMatchingWithSubfields ? ['description'] : undefined
          )
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
          // Map Indonesian role names to English/system names
          const roleMapping: Record<string, string> = {
            'pengguna': 'User',
            'pengguna biasa': 'User',
            'user': 'User',
            'admin': 'Admin',
            'administrator': 'Admin',
            'super admin': 'Super Admin',
            'superadmin': 'Super Admin',
          }
          
          // Normalize role value for mapping
          const normalizedRoleValue = roleValue.toLowerCase().trim()
          const mappedRoleValue = roleMapping[normalizedRoleValue] || roleValue
          
          // Try to find role with mapped value first, then original value
          let roleResult = findId(
            roles, 
            mappedRoleValue, 
            ['name', 'code'],
            allowMatchingWithSubfields ? ['description'] : undefined
          )
          if (roleResult.notFound && mappedRoleValue !== roleValue) {
            // If mapped value not found, try original value
            roleResult = findId(
              roles, 
              roleValue, 
              ['name', 'code'],
              allowMatchingWithSubfields ? ['description'] : undefined
            )
          }
          
          if (roleResult.id) {
            invitationPayload.role_id = roleResult.id
            if (mappedRoleValue !== roleValue) {
              console.log(`[IMPORT] Mapped role "${roleValue}" to "${mappedRoleValue}"`)
            }
          } else if (roleResult.notFound) {
            // Role is optional, just log warning but don't fail
            const availableRoles = roles
              .map((r: any) => `"${r.name}" (code: "${r.code}")`)
              .join(', ')
            summary.errors.push(`Row ${index + 2}: Role "${roleValue}" not found (skipped). Available: ${availableRoles || 'none'}`)
          }
        }

        // Map message/notes
        const message = getMappedValue(row, 'message')
        if (message) invitationPayload.message = message

        // Map status (will be stored in message metadata and applied when invitation is accepted)
        const statusValue = getMappedValue(row, 'status')
        if (statusValue) {
          // Normalize status values
          const normalizedStatus = statusValue.toLowerCase().trim()
          const isActive = normalizedStatus === 'aktif' || normalizedStatus === 'active' || normalizedStatus === '1' || normalizedStatus === 'true'
          // Store status in message if message exists, otherwise create a status note
          if (invitationPayload.message) {
            invitationPayload.message += `\n[STATUS:${isActive ? 'ACTIVE' : 'INACTIVE'}]`
          } else {
            invitationPayload.message = `[STATUS:${isActive ? 'ACTIVE' : 'INACTIVE'}]`
          }
        }

        if (mode === 'test') {
          // Dry-run: only validate, don't create invitations
          summary.success++
        } else {
          // Create invitation (real import)
          // Pass organization_id and invited_by to skip member lookup
          const result = await createInvitation({
            ...invitationPayload,
            organization_id: String(orgId),
            invited_by: user.id,
          })
          
          if (result.success) {
            summary.success++
            
            // Track history if enabled
            if (trackHistory && mode === 'import') {
              try {
                await adminClient
                  .from('audit_logs')
                  .insert({
                    organization_id: orgId,
                    user_id: user.id,
                    action: 'member_import',
                    entity_type: 'organization_member',
                    entity_id: null, // Will be set when invitation is accepted
                    old_values: null,
                    new_values: {
                      email: invitationPayload.email,
                      phone: invitationPayload.phone || null,
                      department_id: invitationPayload.department_id || null,
                      position_id: invitationPayload.position_id || null,
                      role_id: invitationPayload.role_id || null,
                      source: 'import',
                      row_number: index + 2,
                      file_name: file.name,
                    },
                    ip_address: null,
                    user_agent: null,
                    session_id: null,
                  })
              } catch (auditError) {
                // Log error but don't fail the import
                console.error('[IMPORT] Failed to write audit log:', auditError)
              }
            }
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

