/**
 * GET /api/integrations
 * 
 * List all integrations for the current organization.
 * Returns both connected and available integrations.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// Force dynamic rendering to prevent caching stale data
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Get active organization ID from cookies (middleware typically sets this)
        const orgId = req.cookies.get('org_id')?.value

        // 1. Get user's organization member record
        let query = supabase
            .from('organization_members')
            .select('organization_id, role_id')
            .eq('user_id', user.id)

        // Smart Fallback: Use cookie if available, otherwise find best match
        if (orgId) {
            query = query.eq('organization_id', orgId)
        }

        console.log('[integrations] Debug Context:', {
            userId: user.id,
            cookieOrgId: orgId
        })

        let member = null
        let memberError = null

        if (orgId) {
            const result = await query.limit(1).maybeSingle()
            member = result.data
            memberError = result.error
        } else {
            // If no cookie, fetch all and find the best one (Owner/Admin)
            const { data: members, error } = await query
            if (error) {
                memberError = error
            } else if (members && members.length > 0) {
                // Priority: Owner(4) > Admin(3) > First found
                member = members.find(m => m.role_id === 4) ||
                    members.find(m => m.role_id === 3) ||
                    members[0]
                console.log('[integrations] Auto-selected best organization:', member?.organization_id)
            }
        }

        if (member) {
            console.log('[integrations] Found Member Record:', {
                orgId: member.organization_id,
                roleId: member.role_id
            })
        } else {
            console.log('[integrations] No member record found for this user/org combination.')
        }

        if (memberError) {
            console.error('[integrations] Member fetch error:', memberError)
            return NextResponse.json({ error: "Database error", details: memberError.message }, { status: 500 })
        }

        if (!member) {
            console.error('[integrations] User not found in organization_members:', user.id)
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            )
        }

        // 2. Resolve role code manually to avoid join issues
        const { data: role, error: roleError } = await supabase
            .from('system_roles')
            .select('code')
            .eq('id', member.role_id)
            .maybeSingle()

        if (roleError || !role) {
            console.error('[integrations] Role fetch error:', roleError)
            return NextResponse.json({ error: "Role not found" }, { status: 403 })
        }

        console.log('[integrations] Role Permission Check:', {
            roleId: member.role_id,
            roleCode: role.code,
            isAuthorized: ['owner', 'admin'].includes(role.code)
        })

        // 3. Check permissions
        if (!['owner', 'admin'].includes(role.code)) {
            console.error('[integrations] Forbidden role:', role.code)
            return NextResponse.json({
                error: "Forbidden",
                message: `User role '${role.code}' is not authorized.`,
                actualRole: role.code,
                requiredRoles: ['owner', 'admin']
            }, { status: 403 })
        }

        // 4. Get all integrations for this organization
        const { data: integrations, error: dbError } = await supabase
            .from('integrations')
            .select('*')
            .eq('organization_id', member.organization_id)
            .order('created_at', { ascending: false })

        if (dbError) {
            console.error('[integrations] Database error:', dbError)
            return NextResponse.json(
                { error: "Failed to fetch integrations", details: dbError.message, hint: "Did you run the migration?" },
                { status: 500 }
            )
        }

        // Transform data for frontend
        const transformedData = (integrations || []).map(integration => ({
            provider: integration.provider,
            connected: integration.connected,
            status: integration.status,
            displayName: integration.display_name,
            lastSyncAt: integration.last_sync_at,
            errorMessage: integration.error_message,
            syncEnabled: integration.sync_enabled
        }))

        return NextResponse.json({ data: transformedData })

    } catch (error) {
        console.error('[integrations] Unexpected error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

/**
 * POST /api/integrations
 * 
 * Create a new integration configuration.
 * This is typically called before initiating OAuth flow.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Get user's organization
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (!member) {
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            )
        }

        const body = await req.json()
        const { provider, displayName, config } = body

        if (!provider) {
            return NextResponse.json(
                { error: "Provider is required" },
                { status: 400 }
            )
        }

        // Check if integration already exists
        const { data: existing } = await supabase
            .from('integrations')
            .select('id')
            .eq('organization_id', member.organization_id)
            .eq('provider', provider)
            .maybeSingle()

        if (existing) {
            return NextResponse.json(
                { error: "Integration already exists", integrationId: existing.id },
                { status: 409 }
            )
        }

        // Create new integration
        const { data: integration, error } = await supabase
            .from('integrations')
            .insert({
                organization_id: member.organization_id,
                provider,
                display_name: displayName || provider,
                config: config || {},
                status: 'PENDING',
                connected: false
            })
            .select()
            .maybeSingle()

        if (error) {
            console.error('[integrations] Failed to create integration:', error)
            return NextResponse.json(
                { error: "Failed to create integration" },
                { status: 500 }
            )
        }

        return NextResponse.json({ data: integration }, { status: 201 })

    } catch (error) {
        console.error('[integrations] Unexpected error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
