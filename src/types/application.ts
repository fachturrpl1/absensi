/**
 * app/applications/types.ts
 *
 */

export interface Application {
    id: number
    name: string
    developer: string
    email: string
    api_key: string
    // api_secret is omitted from client-side type for security, or made optional
    api_secret?: string
    is_active: boolean
    note?: string
    created_at: string
    updated_at: string
}

export type ApplicationSection = {
    title: string
    items: Application[]
}
