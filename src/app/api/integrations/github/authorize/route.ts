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
            .limit(1)
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
            .eq('provider', 'github')
            .limit(1)
            .maybeSingle()

        if (!existing) {
            // Create integration entry
            const { data: newIntegration, error: createError } = await supabase
                .from('integrations')
                .insert({
                    organization_id: member.organization_id,
                    provider: 'github',
                    display_name: 'GitHub',
                    status: 'PENDING',
                    connected: false
                })
                .select('id')
                .limit(1)
                .maybeSingle()

            if (createError || !newIntegration) {
                console.error('[github] Failed to create integration:', createError)
                return NextResponse.json(
                    { error: "Failed to initialize integration" },
                    { status: 500 }
                )
            }
        }

        // Generate OAuth state
        const state = generateOAuthState('github', member.organization_id)

        // Build authorization URL
        // GitHub scopes: repo (for private repos), read:user, user:email
        const authUrl = buildAuthorizationUrl(
            {
                clientId: process.env.GITHUB_CLIENT_ID!,
                clientSecret: process.env.GITHUB_CLIENT_SECRET!,
                redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/code/github`,
                authorizationUrl: 'https://github.com/login/oauth/authorize',
                tokenUrl: 'https://github.com/login/oauth/access_token',
                scopes: ['repo', 'read:user', 'user:email']
            },
            state
        )

        // Return URL for client to redirect
        return NextResponse.json({ redirectUrl: authUrl })

    } catch (error) {
        console.error('[github] Authorization error:', error)
        return NextResponse.json(
            { error: "Failed to initiate authorization" },
            { status: 500 }
        )
    }
}
