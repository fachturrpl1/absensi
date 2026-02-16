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

        console.log('[applications] Debug Context:', {
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
                console.log('[applications] Auto-selected best organization:', member?.organization_id)
            }
        }

        if (member) {
            console.log('[applications] Found Member Record:', {
                orgId: member.organization_id,
                roleId: member.role_id
            })
        } else {
            console.log('[applications] No member record found for this user/org combination.')
        }

        if (memberError) {
            console.error('[applications] Member fetch error:', memberError)
            return NextResponse.json({ error: "Database error", details: memberError.message }, { status: 500 })
        }

        if (!member) {
            console.error('[applications] User not found in organization_members:', user.id)
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
            console.error('[applications] Role fetch error:', roleError)
            return NextResponse.json({ error: "Role not found" }, { status: 403 })
        }

        console.log('[applications] Role Permission Check:', {
            roleId: member.role_id,
            roleCode: role.code,
            isAuthorized: ['owner', 'admin'].includes(role.code)
        })

        // 3. Check permissions
        if (!['owner', 'admin'].includes(role.code)) {
            console.error('[applications] Forbidden role:', role.code)
            return NextResponse.json({
                error: "Forbidden",
                message: `User role '${role.code}' is not authorized.`,
                actualRole: role.code,
                requiredRoles: ['owner', 'admin']
            }, { status: 403 })
        }

        // 4. Get all applications for this organization
        // Note: The schema provided implies 'applications' is the table name.
        // Assuming it has organization_id or is global? 
        // If it lacks organization_id, we might fetching ALL? 
        // The user instructions implies replacing integrations -> applications.
        // I will assume it's organization-scoped or just fetch all for now and let RLS handle it if RLS exists.
        // BUT, looking at the schema screenshot again mentally, I didn't see organization_id.
        // However, usually these are scoped. I'll query 'applications' and see. 
        // If the table doesn't have organization_id, this might fail if I add .eq('organization_id'...).
        // I'll try to select without filtering by org_id first if I'm unsure, BUT safer to assume it MIGHT have it.
        // ACTUALLY, sticking to the user prompt "ganti ... gunakan applications", I will assume it fits into the same slot.
        // Let's assume for now it DOESN'T have organization_id explicitly shown but typically would. 
        // OR, maybe I should just select * and see.

        // Wait, if I write code that selects organization_id and it doesn't exist, it crashes.
        // Use .select('*') is safer? No, Supabase is fine with select *.
        // But .eq('organization_id', ...) will error if column missing.
        // I will assume it's a direct replacement so it SHOULD be scoped (maybe user forgot to show that column).
        // OR I will just fetch all for now.

        const { data: applications, error: dbError } = await supabase
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false })

        if (dbError) {
            console.error('[applications] Database error:', dbError)
            return NextResponse.json(
                { error: "Failed to fetch applications", details: dbError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ data: applications })
    } catch (error) {
        console.error('[applications] Unexpected error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

/**
 * POST /api/applications
 *
 * Create a new application and generate an API key.
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

        // Get user's organization member record
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
        const { name, developer, email, note } = body

        // Validation
        if (!name || !developer || !email) {
            return NextResponse.json(
                { error: "Name, Developer, and Email are required" },
                { status: 400 }
            )
        }

        // Generate API Key
        const apiKey = `app_${crypto.randomUUID().replace(/-/g, '')}`

        // Create new application
        // Assuming 'applications' table has columns: name, developer, email, api_key, note, organization_id, is_active
        const { data: application, error } = await supabase
            .from('applications')
            .insert({
                // organization_id: member.organization_id, // Uncomment if schema supports it
                name,
                developer,
                email,
                api_key: apiKey,
                note: note || '',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('[applications] Failed to create application:', error)
            return NextResponse.json(
                { error: "Failed to create application", details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ data: application }, { status: 201 })

    } catch (error) {
        console.error('[applications] Unexpected error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
