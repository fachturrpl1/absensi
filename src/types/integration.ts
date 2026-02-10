/**
 * app/integrations/types.ts
 *
 * Shared type definitions for the Integrations feature.
 * Kept in a co-located file so both the server page and the client
 * components share the same contract without circular imports.
 */

/** Connection lifecycle state for a single integration card. */
export type IntegrationStatus =
  | "idle"       // default — no pending action
  | "connecting" // OAuth or API call in-flight to connect
  | "disconnecting" // API call in-flight to disconnect
  | "error"      // last action failed; message available

export type IntegrationCategory =
  | "Communication"
  | "Development"
  | "Productivity"
  | "HR"

export type Integration = {
  id: string
  name: string
  description: string
  /** Absolute URL for the integration's logo. Falls back to initials avatar on error. */
  iconUrl: string
  connected: boolean
  /** Per-card async state — drives loading spinners and disabled states. */
  status: IntegrationStatus
  /** Optional: last error message to surface in the UI. */
  errorMessage?: string
  category: IntegrationCategory
  /** Link to the integration's official documentation. */
  docsUrl: string
}

export type IntegrationSection = {
  title: string
  items: Integration[]
}