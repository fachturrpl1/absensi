/**
 * POST /api/integrations/github/webhook
 * 
 * Handle incoming GitHub webhook events.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import {
    verifyWebhookSignature,
    storeWebhookEvent
} from "@/lib/integrations/webhook-helpers"

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const payload = JSON.parse(body)

        const eventType = req.headers.get('x-github-event')
        const signature = req.headers.get('x-hub-signature-256')

        if (!eventType || !signature) {
            return NextResponse.json(
                { error: "Missing required headers" },
                { status: 400 }
            )
        }

        if (eventType === 'ping') {
            return NextResponse.json({ message: 'pong' })
        }

        // For GitHub, the installation ID is often in the payload.
        // However, since we set up the integration via OAuth app (not GitHub App),
        // we might need to rely on identifying the organization based on the repository or user
        // or simply try to match signature against all active GitHub integrations.

        // NOTE: In a production App, efficient lookup is key. 
        // Since we store the webhook secret per integration, we need to find WHICH integration this is for.
        // GitHub 'OAuth App' webhooks are usually configured manually on the Repo or Org level.
        // When manually adding the webhook, the user would copy the URL which could include the org ID, e.g. /api/integrations/github/webhook?orgId=...
        // OR we iterate through all active GitHub integrations and try to verify signature.

        // For this implementation, we'll extract an 'organizationId' query param if present, or iteration.
        const url = new URL(req.url)
        const orgIdFromParam = url.searchParams.get('orgId')

        const supabase = await createClient()

        let candidateIntegrations: any[] = []

        if (orgIdFromParam) {
            const res = await supabase
                .from('integrations')
                .select('id, webhook_secret')
                .eq('provider', 'github')
                .eq('organization_id', orgIdFromParam)
                .eq('connected', true)
            candidateIntegrations = res.data || []
        } else {
            // Fallback: This is expensive if there are many orgs. 
            // Better approach: User must add ?integrationId=... or ?orgId=... to the webhook URL in GitHub.
            // For now, we will assume the URL includes ?id=<integration_id>.
            const integrationId = url.searchParams.get('id')
            if (integrationId) {
                const res = await supabase
                    .from('integrations')
                    .select('id, webhook_secret')
                    .eq('id', integrationId)
                    .maybeSingle()
                if (res.data) candidateIntegrations = [res.data]
            } else {
                // Try to find ANY match (not recommended for production scale)
                const res = await supabase
                    .from('integrations')
                    .select('id, webhook_secret')
                    .eq('provider', 'github')
                    .eq('connected', true)
                candidateIntegrations = res.data || []
            }
        }

        let verifiedIntegration = null

        // Prepare headers for verification
        const headers: Record<string, string> = {}
        req.headers.forEach((value, key) => {
            headers[key] = value
        })

        // Try to verify against candidates
        for (const integration of candidateIntegrations) {
            const verification = await verifyWebhookSignature(
                'github',
                body,
                headers,
                integration.id
            )
            if (verification.valid) {
                verifiedIntegration = integration
                break
            }
        }

        if (!verifiedIntegration) {
            console.error('[github] Could not verify signature for any integration')
            return NextResponse.json(
                { error: "Invalid signature or unknown integration" },
                { status: 401 }
            )
        }

        // Store webhook event for async processing
        await storeWebhookEvent(
            verifiedIntegration.id,
            eventType,
            payload,
            headers
        )

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error('[github] Webhook error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
