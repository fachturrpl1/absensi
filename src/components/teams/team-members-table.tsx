"use client"

import React from "react"
import { ITeamMember } from "@/interface"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface TeamMembersTableProps {
  members: ITeamMember[]
  isLoading?: boolean
}

// FIX: user_profiles tidak punya kolom "name"
// Priority: display_name → first_name + last_name → "Unknown"
function getDisplayName(user: ITeamMember["organization_members"]["user"]): string {
  if (!user) return "Unknown"
  if (user.display_name) return user.display_name
  const full = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
  return full || "Unknown"
}

export function TeamMembersTable({ members, isLoading }: TeamMembersTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 px-4"></TableHead>
            <TableHead className="text-xs uppercase font-semibold">Member Name</TableHead>
            <TableHead className="text-xs uppercase font-semibold">Position</TableHead>
            <TableHead className="text-xs uppercase font-semibold">Primary Team</TableHead>
            <TableHead className="text-xs uppercase font-semibold">Joined Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-sm">
                Loading members...
              </TableCell>
            </TableRow>
          ) : members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground py-6">
                No members in this team.
              </TableCell>
            </TableRow>
          ) : (
            members.map((m) => {
              const user = m.organization_members?.user ?? null
              const userName = getDisplayName(user)
              const userEmail = user?.email || ""
              const userPhoto = user?.profile_photo_url || null
              const positionTitle = m.positions_detail?.title || "No Position"

              return (
                <TableRow key={m.id} className="group transition-colors">
                  <TableCell className="px-4 py-3">
                    <UserAvatar
                      name={userName}
                      photoUrl={userPhoto}
                      className="h-8 w-8 text-[10px]"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{userName}</span>
                      <span className="text-xs text-muted-foreground">{userEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-normal capitalize bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                    >
                      {positionTitle}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {m.is_primary_team ? (
                      <Badge className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-500 dark:border-amber-900/50 hover:bg-amber-50">
                        Primary
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {m.joined_at ? format(new Date(m.joined_at), "MMM dd, yyyy") : "-"}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}