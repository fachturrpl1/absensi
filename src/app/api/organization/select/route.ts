import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await req.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      )
    }

    // Create response
    const response = NextResponse.json(
      { success: true, message: "Organization selected" },
      { status: 200 }
    )

    // Set cookie on server-side (this ensures it's sent to client and available in middleware)
    response.cookies.set({
      name: "org_id",
      value: organizationId,
      path: "/",
      maxAge: 2592000, // 30 days
      sameSite: "lax",
      httpOnly: false, // Allow client-side access
    })

    console.log(`[API] Organization selected: ${organizationId}`)

    return response
  } catch (error) {
    console.error("[API] Error selecting organization:", error)
    return NextResponse.json(
      { error: "Failed to select organization" },
      { status: 500 }
    )
  }
}
