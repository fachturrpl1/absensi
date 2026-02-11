/**
 * GET /api/integrations/slack/callback
 * 
 * Handle Slack OAuth callback and token exchange.
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
            console.error('[slack] OAuth error:', error)
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
            console.error('[slack] Invalid state:', err)
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?error=invalid_state`
            )
        }

        // Exchange code for tokens
        // Dynamic base URL detection (matching authorize route)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        const tokens = await exchangeCodeForToken(
            {
                clientId: process.env.SLACK_CLIENT_ID!,
                clientSecret: process.env.SLACK_CLIENT_SECRET!,
                redirectUri: `${baseUrl}/api/integrations/slack/callback`,
                authorizationUrl: 'https://slack.com/oauth/v2/authorize',
                tokenUrl: 'https://slack.com/api/oauth.v2.access',
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
            .eq('provider', 'slack')
            .maybeSingle()

        if (!integration) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?error=integration_not_found`
            )
        }

        // Store tokens
        await storeOAuthTokens(integration.id, tokens)

        // Generate webhook secret for Slack
        const webhookSecret = crypto.randomUUID()

        await supabase
            .from('integrations')
            .update({
                webhook_secret: encrypt(webhookSecret)
            })
            .eq('id', integration.id)

        // Redirect back to integrations page with success
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?success=slack_connected`
        )

    } catch (error) {
        console.error('[slack] Callback error:', error)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?error=callback_failed`
        )
    }
}
