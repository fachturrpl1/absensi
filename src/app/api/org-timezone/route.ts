import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getOrganizationTimezoneByUserId } from "@/action/organization"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { timezone: "UTC", message: "Unauthorized fallback" },
        { status: 401 }
      )
    }

    const timezone = await getOrganizationTimezoneByUserId(user.id)
    const finalTimezone = timezone || "UTC"

    return NextResponse.json(
      { timezone: finalTimezone },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    )
  } catch (error) {
    return NextResponse.json(
      { timezone: "UTC", error: "Failed to fetch user timezone" },
      { status: 500 }
    )
  }
}