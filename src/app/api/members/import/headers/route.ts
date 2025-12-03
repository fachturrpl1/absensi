import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

/**
 * API Route: GET /api/members/import/headers
 * 
 * Purpose: Read Excel file and extract headers from the first row
 * 
 * Request Body: FormData with 'file' field
 * Response: { success: boolean, headers: string[], preview: Record<string, any>[] }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream', // Sometimes Excel files are sent as this
    ]
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      )
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    
    // Get first sheet
    const sheetName = workbook.SheetNames?.[0]
    if (!sheetName) {
      return NextResponse.json(
        { success: false, message: 'No sheet found in Excel file' },
        { status: 400 }
      )
    }

    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      return NextResponse.json(
        { success: false, message: 'Cannot find a valid sheet in Excel file' },
        { status: 400 }
      )
    }

    // Convert to JSON to get headers and preview
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { 
      defval: '',
      raw: false // Convert all values to strings for consistency
    })

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'Excel file is empty or has no data' },
        { status: 400 }
      )
    }

    // Extract headers from first row keys
    const headers = Object.keys(rows[0] || {})
    
    // Get preview (first 5 rows for user to see)
    const preview = rows.slice(0, 5).map(row => {
      const previewRow: Record<string, string> = {}
      headers.forEach(header => {
        previewRow[header] = String(row[header] || '').trim()
      })
      return previewRow
    })

    return NextResponse.json({
      success: true,
      headers,
      preview,
      totalRows: rows.length,
    })
  } catch (error) {
    console.error('Error reading Excel headers:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to read Excel file' 
      },
      { status: 500 }
    )
  }
}

