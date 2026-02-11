/**
 * POST /api/integrations/zoom/connect
 * 
 * Server-to-Server OAuth - Connect Zoom integration using account credentials.
 * No user authorization needed.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getZoomAccessToken } from "@/lib/integrations/zoom-helpers"
import { encrypt } from "@/lib/integrations/oauth-helpers"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()

        // 1. Authenticate user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // 2. Get active organization context from cookie
        const orgId = req.cookies.get('org_id')?.value

        if (!orgId) {
            return NextResponse.json(
                { error: "No active organization. Please select an organization first." },
                { status: 400 }
            )
        }

        // 3. Verify user is a member of the requested organization
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id, role_id')
            .eq('user_id', user.id)
            .eq('organization_id', orgId)
            .limit(1)
            .maybeSingle()

        if (!member) {
            return NextResponse.json(
                { error: "Not a member of this organization" },
                { status: 403 }
            )
        }

        console.log('[zoom] Connecting integration for organization:', member.organization_id)

        // 4. Get access token using Server-to-Server OAuth
        let tokenData
        try {
            tokenData = await getZoomAccessToken()
        } catch (error) {
            console.error('[zoom] Failed to get access token:', error)
            return NextResponse.json(
                { error: "Failed to connect to Zoom. Please check your credentials." },
                { status: 500 }
            )
        }

        // 5. Check if integration already exists
        const { data: existing } = await supabase
            .from('integrations')
            .select('id')
            .eq('organization_id', member.organization_id)
            .eq('provider', 'zoom')
            .limit(1)
            .maybeSingle()

        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

        if (existing) {
            // Update existing integration
            const { error: updateError } = await supabase
                .from('integrations')
                .update({
                    access_token: encrypt(tokenData.access_token),
                    token_expires_at: expiresAt,
                    connected: true,
                    status: 'ACTIVE',
                    permissions: tokenData.scope.split(' '),
                    error_message: null,
                    error_count: 0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)

            if (updateError) {
                console.error('[zoom] Failed to update integration:', updateError)
                return NextResponse.json(
                    { error: "Failed to store Zoom credentials" },
                    { status: 500 }
                )
            }

            console.log('[zoom] Integration updated successfully')
        } else {
            // Create new integration
            const { error: createError } = await supabase
                .from('integrations')
                .insert({
                    organization_id: member.organization_id,
                    provider: 'zoom',
                    display_name: 'Zoom',
                    access_token: encrypt(tokenData.access_token),
                    token_expires_at: expiresAt,
                    connected: true,
                    status: 'ACTIVE',
                    permissions: tokenData.scope.split(' ')
                })

            if (createError) {
                console.error('[zoom] Failed to create integration:', createError)
                return NextResponse.json(
                    { error: "Failed to store Zoom credentials" },
                    { status: 500 }
                )
            }

            console.log('[zoom] Integration created successfully')
        }

        return NextResponse.json({
            success: true,
            message: "Zoom connected successfully",
            expiresIn: tokenData.expires_in
        })

    } catch (error) {
        console.error('[zoom] Connection error:', error)
        return NextResponse.json(
            { error: "Failed to connect Zoom integration" },
            { status: 500 }
        )
    }
}
