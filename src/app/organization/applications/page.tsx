import { Suspense } from "react"
import { headers } from "next/headers"
import ApplicationsClient from "@/components/organization/ApplicationsClient"
import type { Application } from "@/types/application"

/**
 * Server Component: Fetches applications list server-side.
 */
async function getApplications(): Promise<Application[]> {
    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
    const baseUrl = `${protocol}://${host}`

    try {
        const res = await fetch(`${baseUrl}/api/applications`, {
            cache: "no-store", // Check for latest data
            headers: {
                // Forward cookie for auth
                Cookie: headersList.get("cookie") || ""
            }
        })

        if (!res.ok) {
            console.error(`[applications] API responded ${res.status}`)
            return []
        }

        const json = await res.json()
        return json.data || []
    } catch (error) {
        console.error("[applications] Fetch failed:", error)
        return []
    }
}

export default async function ApplicationsPage() {
    const apps = await getApplications()

    return (
        <Suspense fallback={<ApplicationsPageSkeleton />}>
            <ApplicationsClient initialData={apps} />
        </Suspense>
    )
}

function ApplicationsPageSkeleton() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 animate-pulse" aria-busy="true">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
            <div className="rounded-md border border-gray-200 bg-white p-6">
                <div className="space-y-4">
                    <div className="h-10 bg-gray-100 rounded w-full" />
                    <div className="h-10 bg-gray-100 rounded w-full" />
                    <div className="h-10 bg-gray-100 rounded w-full" />
                </div>
            </div>
        </div>
    )
}