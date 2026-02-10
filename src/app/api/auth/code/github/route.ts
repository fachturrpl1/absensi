/**
 * GET /api/auth/code/github
 * 
 * Handle GitHub OAuth callback and token exchange.
 * 
 * Note: This replaces the previous /api/integrations/github/callback route
 * to match the user's preferred URL structure / existing configuration.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import {
    verifyOAuthState,
    exchangeCodeForToken,
    storeOAuthTokens,
    encrypt
} from "@/lib/integrations/oauth-helpers"

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        // Check for OAuth errors
        if (error) {
            console.error('[github] OAuth error:', error)
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?error=${error}`
            )
        }

        if (!code || !state) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?error=missing_params`
            )
        }

        // Verify state to prevent CSRF
        let stateData
        try {
            stateData = verifyOAuthState(state)
        } catch (err) {
            console.error('[github] Invalid state:', err)
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?error=invalid_state`
            )
        }

        // Exchange code for tokens
        // CRITICAL: redirectUri must match EXACLTY what was sent in the authorize step
        // We are now using the API-style path preferred by the user: /api/auth/code/github
        const tokens = await exchangeCodeForToken(
            {
                clientId: process.env.GITHUB_CLIENT_ID!,
                clientSecret: process.env.GITHUB_CLIENT_SECRET!,
                // MATCHING THE NEW ROUTE PATH
                redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/code/github`,
                authorizationUrl: 'https://github.com/login/oauth/authorize',
                tokenUrl: 'https://github.com/login/oauth/access_token',
                scopes: []
            },
            code
        )

        // Get integration
        const supabase = await createClient()
        const { data: integration } = await supabase
            .from('integrations')
            .select('id')
            .eq('organization_id', stateData.organizationId)
            .eq('provider', 'github')
            .maybeSingle()

        if (!integration) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?error=integration_not_found`
            )
        }

        // Store tokens
        await storeOAuthTokens(integration.id, tokens)

        // Generate webhook secret for GitHub
        const webhookSecret = crypto.randomUUID()

        await supabase
            .from('integrations')
            .update({
                webhook_secret: encrypt(webhookSecret)
            })
            .eq('id', integration.id)

        // Redirect back to integrations page with success
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?success=github_connected`
        )

    } catch (error) {
        console.error('[github] Callback error:', error)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?error=callback_failed`
        )
    }
}
