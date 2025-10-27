import { NextResponse } from 'next/server'
import { getAllOrganization_member } from '@/action/members'

export async function GET() {
  try {
    const response = await getAllOrganization_member()
    
    if (!response.success) {
      return NextResponse.json(
        { success: false, message: response.message },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Vary': 'Cookie'
          }
        }
      )
    }

    return NextResponse.json(
      { success: true, data: response.data },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  } catch (error) {
    console.error('API /members error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch members' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Vary': 'Cookie'
        }
      }
    )
  }
}
