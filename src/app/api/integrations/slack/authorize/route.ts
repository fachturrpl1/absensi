import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateOAuthState, buildAuthorizationUrl } from "@/lib/integrations/oauth-helpers"

export async function POST(_req: NextRequest) {
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

        // Check if integration already exists
        const { data: existing } = await supabase
            .from('integrations')
            .select('id')
            .eq('organization_id', member.organization_id)
            .eq('provider', 'slack')
            .maybeSingle()

        if (!existing) {
            // Create integration entry
            const { data: newIntegration, error: createError } = await supabase
                .from('integrations')
                .insert({
                    organization_id: member.organization_id,
                    provider: 'slack',
                    display_name: 'Slack',
                    status: 'PENDING',
                    connected: false
                })
                .select('id')
                .maybeSingle()

            if (createError || !newIntegration) {
                console.error('[slack] Failed to create integration:', createError)
                return NextResponse.json(
                    { error: "Failed to initialize integration" },
                    { status: 500 }
                )
            }
        }

        // Generate OAuth state
        const state = generateOAuthState('slack', member.organization_id)

        // Build authorization URL
        const authUrl = buildAuthorizationUrl(
            {
                clientId: process.env.SLACK_CLIENT_ID!,
                clientSecret: process.env.SLACK_CLIENT_SECRET!,
                redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
                authorizationUrl: 'https://slack.com/oauth/v2/authorize',
                tokenUrl: 'https://slack.com/api/oauth.v2.access',
                scopes: ['chat:write', 'incoming-webhook', 'channels:read', 'users:read']
            },
            state
        )

        // Return URL for client to redirect
        return NextResponse.json({ redirectUrl: authUrl })

    } catch (error) {
        console.error('[slack] Authorization error:', error)
        return NextResponse.json(
            { error: "Failed to initiate authorization" },
            { status: 500 }
        )
    }
}
