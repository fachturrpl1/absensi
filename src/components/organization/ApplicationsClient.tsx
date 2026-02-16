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

"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Plus,
  MoreHorizontal
} from "lucide-react"
import type { Application } from "@/types/application"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ApplicationsClientProps {
  initialData: Application[] // Changed from sections
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export default function ApplicationsClient({ initialData = [] }: ApplicationsClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  // Ensure initialData is an array to prevent crashes if API fails
  const apps = Array.isArray(initialData) ? initialData : []

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.developer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header */}
      <header className="w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your registered applications and API keys.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New App
          </Button>
        </div>
      </header>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Developer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No applications found.
                </TableCell>
              </TableRow>
            ) : (
              filteredApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>{app.developer}</TableCell>
                  <TableCell>{app.email}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {app.api_key ? `${app.api_key.substring(0, 8)}...` : "—"}
                  </TableCell>
                  <TableCell>
                    {app.is_active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-500">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Revoke / Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}