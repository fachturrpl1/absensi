"use client"

/**
 * app/integrations/integrations-client.tsx
 *
 * Client boundary for the Integrations page.
 * Owns all interactivity: search filtering, connect/disconnect lifecycle,
 * per-card loading states, error display, and accessibility.
 *
 * Deliberately NOT the page root — the RSC page.tsx handles data fetching
 * and passes hydrated sections via `initialSections`.
 */

import React, { useState, useCallback, useTransition, useId } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  ExternalLink,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Unplug,
  Plug,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Integration, IntegrationSection, IntegrationStatus } from "@/types/integration"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface IntegrationsClientProps {
  initialSections: IntegrationSection[]
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export default function IntegrationsClient({ initialSections }: IntegrationsClientProps) {
  const searchId = useId()
  const [searchTerm, setSearchTerm] = useState("")
  const [sections, setSections] = useState<IntegrationSection[]>(initialSections)
  const [, startTransition] = useTransition()

  // ---------------------------------------------------------------------------
  // Derived state — filter without mutating sections
  // ---------------------------------------------------------------------------
  const filteredSections = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return sections

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.name.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term)
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [searchTerm, sections])

  // ---------------------------------------------------------------------------
  // Per-card status updater — immutable, returns new sections array
  // ---------------------------------------------------------------------------
  const updateItemStatus = useCallback(
    (
      id: string,
      patch: Partial<Pick<Integration, "connected" | "status" | "errorMessage">>
    ) => {
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          items: section.items.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        }))
      )
    },
    []
  )

  // ---------------------------------------------------------------------------
  // Connect / Disconnect handler
  //
  // Design decisions:
  //  1. Sets `status` to "connecting"/"disconnecting" immediately (optimistic UX).
  //  2. Calls the REST API — matches routes from README.md.
  //  3. On success, flips `connected` and resets `status` to "idle".
  //  4. On failure, sets `status` to "error" with a message; does NOT flip state.
  //  5. The in-flight status on each card acts as a per-item mutex — the button
  //     is disabled while the request is pending, preventing duplicate requests.
  // ---------------------------------------------------------------------------
  const handleToggle = useCallback(
    async (item: Integration) => {
      // Guard: if already processing, do nothing (prevents race conditions)
      if (item.status === "connecting" || item.status === "disconnecting") return

      const nextStatus: IntegrationStatus = item.connected
        ? "disconnecting"
        : "connecting"

      // Immediate feedback — card shows spinner
      updateItemStatus(item.id, { status: nextStatus, errorMessage: undefined })

      try {
        let res: Response

        if (item.connected) {
          // Disconnect: DELETE /api/integrations/[id]
          res = await fetch(`/api/integrations/${item.id}`, {
            method: "DELETE",
          })
        } else {
          // Connect: POST to authorize endpoint
          // For OAuth integrations this may return a redirect URL.
          res = await fetch(`/api/integrations/${item.id}/authorize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          })
        }

        // Read JSON once to avoid "double read" errors
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(data?.error || data?.message || `Request failed (${res.status})`)
        }

        // Some integrations return an OAuth redirect URL
        if (data?.redirectUrl) {
          // Navigate to OAuth provider — the page will reload after the callback
          window.location.href = data.redirectUrl
          return
        }

        // Toggle succeeded — flip connected state, clear status
        startTransition(() => {
          updateItemStatus(item.id, {
            connected: !item.connected,
            status: "idle",
            errorMessage: undefined,
          })
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Try again."

        updateItemStatus(item.id, {
          status: "error",
          errorMessage: message,
          // connected state is NOT changed on error
        })
      }
    },
    [updateItemStatus, startTransition]
  )

  // ---------------------------------------------------------------------------
  // Dismiss error on a specific card
  // ---------------------------------------------------------------------------
  const handleDismissError = useCallback(
    (id: string) => {
      updateItemStatus(id, { status: "idle", errorMessage: undefined })
    },
    [updateItemStatus]
  )

  // ---------------------------------------------------------------------------
  // Counts for accessible status summary
  // ---------------------------------------------------------------------------
  const connectedCount = React.useMemo(
    () => sections.flatMap((s) => s.items).filter((i) => i.connected).length,
    [sections]
  )

  const totalCount = React.useMemo(
    () => sections.flatMap((s) => s.items).length,
    [sections]
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full flex flex-1 flex-col gap-10 p-6 pt-2 max-w-[1600px] mx-auto">

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <header className="w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organisation&apos;s connections with third-party services.{" "}
            <span
              className="font-medium text-gray-600"
              aria-live="polite"
              aria-atomic="true"
            >
              {connectedCount} of {totalCount} connected.
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-[300px]">
            <label htmlFor={searchId} className="sr-only">
              Search integrations
            </label>
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              placeholder="Search integrations…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-gray-300 rounded-full bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-offset-1"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Request Integration CTA */}
          <Button
            className="rounded-full shrink-0"
            onClick={() => {
              /* TODO: open a modal / mailto / feedback form */
            }}
            aria-label="Request a new integration"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Request Integration
          </Button>
        </div>
      </header>

      {/* ── Integration Sections ────────────────────────────────────────────── */}
      <main className="space-y-16 pb-16">
        {filteredSections.length === 0 ? (
          <EmptyState searchTerm={searchTerm} />
        ) : (
          filteredSections.map((section) => (
            <section
              key={section.title}
              className="space-y-6"
              aria-labelledby={`section-${section.title.toLowerCase()}`}
            >
              <h2
                id={`section-${section.title.toLowerCase()}`}
                className="text-xs font-semibold text-gray-500 uppercase tracking-widest"
              >
                {section.title}
              </h2>

              <ul
                className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 list-none p-0 m-0"
                aria-label={`${section.title} integrations`}
              >
                {section.items.map((item) => (
                  <li key={item.id}>
                    <IntegrationCard
                      item={item}
                      onToggle={() => handleToggle(item)}
                      onDismissError={() => handleDismissError(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// IntegrationCard
// ---------------------------------------------------------------------------
interface IntegrationCardProps {
  item: Integration
  onToggle: () => void
  onDismissError: () => void
}

function IntegrationCard({ item, onToggle, onDismissError }: IntegrationCardProps) {
  const [imgError, setImgError] = useState(false)

  const isLoading =
    item.status === "connecting" || item.status === "disconnecting"
  const isError = item.status === "error"

  const actionLabel = isLoading
    ? item.status === "connecting"
      ? "Connecting…"
      : "Disconnecting…"
    : item.connected
      ? "Disconnect"
      : "Connect"

  const ariaLabel = isLoading
    ? `${actionLabel} ${item.name}`
    : item.connected
      ? `Disconnect ${item.name}`
      : `Connect ${item.name}`

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between p-5 bg-white border rounded-xl transition-all duration-200",
        "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-400",
        isError
          ? "border-red-200 shadow-sm shadow-red-50"
          : "border-gray-200 hover:shadow-md hover:border-gray-300"
      )}
      aria-label={`${item.name} integration — ${item.connected ? "Connected" : "Not connected"}`}
    >
      {/* ── Card Header ── */}
      <div>
        <div className="flex items-start justify-between mb-4">
          {/* Integration icon with graceful fallback */}
          <div
            className="h-11 w-11 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 p-2 shrink-0"
            aria-hidden="true"
          >
            {imgError ? (
              <InitialsAvatar name={item.name} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.iconUrl}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain"
                onError={() => setImgError(true)}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>

          {/* Status badge */}
          <div aria-live="polite" aria-atomic="true" className="flex flex-col items-end gap-1.5">
            {item.connected && !isLoading && !isError && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Connected
              </span>
            )}
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                {item.status === "connecting" ? "Connecting" : "Disconnecting"}
              </span>
            )}
            {isError && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                <XCircle className="h-3 w-3" aria-hidden="true" />
                Failed
              </span>
            )}
          </div>
        </div>

        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
          {item.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
          {item.description}
        </p>

        {/* Error message banner */}
        {isError && item.errorMessage && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2"
          >
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.errorMessage}</span>
            <button
              onClick={onDismissError}
              className="shrink-0 text-red-500 hover:text-red-700 focus:outline-none focus:underline"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── Card Footer ── */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <a
          href={item.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors focus:outline-none focus:underline"
          aria-label={`Learn more about ${item.name} (opens in new tab)`}
        >
          Learn more
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>

        <Button
          variant={item.connected ? "outline" : "default"}
          size="sm"
          className={cn(
            "h-8 px-4 text-xs font-medium transition-all min-w-[90px]",
            item.connected && !isLoading
              ? "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              : !item.connected && !isLoading
                ? "bg-black text-white hover:bg-gray-800 shadow-sm"
                : "" // loading state — neutral styling
          )}
          onClick={onToggle}
          disabled={isLoading}
          aria-label={ariaLabel}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" aria-hidden="true" />
              {item.status === "connecting" ? "Connecting" : "Disconnecting"}
            </>
          ) : item.connected ? (
            <>
              <Unplug className="h-3 w-3 mr-1.5" aria-hidden="true" />
              Disconnect
            </>
          ) : (
            <>
              <Plug className="h-3 w-3 mr-1.5" aria-hidden="true" />
              Connect
            </>
          )}
        </Button>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function EmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <div
      className="text-center py-24"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
        <Search className="h-6 w-6 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        No integrations found
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchTerm
          ? `No results for "${searchTerm}". Try a different search term.`
          : "No integrations are available right now."}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// InitialsAvatar — fallback when integration icon URL fails to load
// ---------------------------------------------------------------------------
function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <span
      className="text-xs font-bold text-gray-500 select-none"
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}