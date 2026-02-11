//src/app/api/integrations/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * DELETE /api/integrations/[id]
 * * Disconnect an integration and revoke access (Soft Delete).
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        // 1. Auth Check
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Org Check (Gunakan maybeSingle agar tidak throw error)
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (!member) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        // 3. Verify Integration Existence
        // Build flexible query based on whether 'id' is UUID or provider name
        const query = supabase
            .from('integrations')
            .select('id')
            .eq('organization_id', member.organization_id)

        // Check if 'id' is a valid UUID format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

        if (isUUID) {
            query.eq('id', id) // Search by UUID
        } else {
            query.eq('provider', id) // Search by provider name (e.g., "github")
        }

        const { data: integration, error: intError } = await query.limit(1).maybeSingle()

        if (intError || !integration) {
            console.error('[integrations] Integration lookup failed for ID:', id, intError)
            return NextResponse.json({ error: "Integration not found" }, { status: 404 })
        }

        console.log('[integrations] Initiating disconnect:', {
            integrationId: integration.id,
            provider: id,
            organizationId: member.organization_id
        })

        // 4. Optional: Revoke token at provider (GitHub, Slack, etc.)
        // This is "best effort" - we proceed with disconnect even if revocation fails
        try {
            // TODO: Implement provider-specific token revocation
            // Example for GitHub:
            // await fetch(`https://api.github.com/applications/${GITHUB_CLIENT_ID}/token`, {
            //   method: 'DELETE',
            //   auth: { username: CLIENT_ID, password: CLIENT_SECRET },
            //   body: JSON.stringify({ access_token: decrypted_token })
            // })

            console.log('[integrations] Token revocation skipped (not implemented for this provider)')
        } catch (revocationError) {
            // Log but don't fail the disconnect
            console.warn('[integrations] Token revocation failed (non-critical):', revocationError)
        }

        // 5. Perform "Clean Disconnect" (Soft Delete)
        // Clear ALL sensitive data and access credentials
        const { error: updateError } = await supabase
            .from('integrations')
            .update({
                // Connection status
                connected: false,
                status: 'DISCONNECTED',

                // Clear ALL tokens and secrets
                access_token: null,
                refresh_token: null,
                token_expires_at: null,
                webhook_secret: null,

                // Clear permissions and error state
                permissions: [],
                error_message: null,
                error_count: 0,

                // Metadata
                updated_at: new Date().toISOString()
            })
            .eq('id', integration.id) // Use actual UUID from database

        if (updateError) {
            console.error('[integrations] Failed to disconnect:', updateError)
            return NextResponse.json({ error: "Failed to disconnect integration" }, { status: 500 })
        }

        console.log('[integrations] Disconnect successful:', {
            integrationId: integration.id,
            provider: id
        })

        return NextResponse.json({
            success: true,
            message: "Integration disconnected successfully"
        })

    } catch (error) {
        console.error('[integrations] Unexpected error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * PATCH /api/integrations/[id]/config
 * * Update integration configuration settings.
 * Note: Walaupun path filenya [id]/route.ts, Next.js akan melayani
 * request PATCH ke /api/integrations/[id] (tanpa /config di URL)
 * kecuali kamu membuat folder khusus /config.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        // 1. Auth Check
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Org Check
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (!member) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        // 3. Parse Body
        const body = await req.json().catch(() => null)
        if (!body) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
        }

        const { config, syncEnabled, syncFrequency } = body

        // 4. Build Update Object (Security: Hanya update field yang diizinkan)
        // Gunakan Partial<IntegrationType> jika kamu punya TypeScript interface-nya
        const updates: Record<string, any> = {
            updated_at: new Date().toISOString()
        }

        if (config !== undefined) updates.config = config
        if (syncEnabled !== undefined) updates.sync_enabled = syncEnabled
        if (syncFrequency !== undefined) updates.sync_frequency = syncFrequency

        // 5. Update Integration (support UUID or provider name)
        const updateQuery = supabase
            .from('integrations')
            .select('id')
            .eq('organization_id', member.organization_id)

        // Check if 'id' is a valid UUID format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

        if (isUUID) {
            updateQuery.eq('id', id)
        } else {
            updateQuery.eq('provider', id)
        }

        const { data: foundIntegration } = await updateQuery.limit(1).maybeSingle()

        if (!foundIntegration) {
            return NextResponse.json({ error: "Integration not found" }, { status: 404 })
        }

        // Perform update using actual UUID
        const { data, error } = await supabase
            .from('integrations')
            .update(updates)
            .eq('id', foundIntegration.id)
            .select()
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error('[integrations] Failed to update config:', error)
            return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 })
        }

        return NextResponse.json({ data })

    } catch (error) {
        console.error('[integrations] Unexpected error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}