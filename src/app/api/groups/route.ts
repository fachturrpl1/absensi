import { NextResponse } from 'next/server'
import { getAllGroups } from '@/action/group'

export async function GET() {
  try {
    const response = await getAllGroups()
    
    if (!response.success) {
      return NextResponse.json(
        { success: false, message: response.message },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
          }
        }
      )
    }

    return NextResponse.json(
      { success: true, data: response.data },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
        }
      }
    )
  } catch (error) {
    console.error('API /groups error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch groups' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=15'
        }
      }
    )
  }
}
