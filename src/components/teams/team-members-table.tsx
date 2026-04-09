"use client"

import React from "react"
import { ITeamMember } from "@/interface"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns" // install date-fns jika belum ada

interface TeamMembersTableProps {
  members: ITeamMember[]
  isLoading?: boolean
}

export function TeamMembersTable({ members, isLoading }: TeamMembersTableProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'lead': return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400";
      case 'manager': return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400";
    }
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 px-4"></TableHead>
            <TableHead className="text-xs uppercase font-semibold">Member Name</TableHead>
            <TableHead className="text-xs uppercase font-semibold">Role</TableHead>
            <TableHead className="text-xs uppercase font-semibold">Primary</TableHead>
            <TableHead className="text-xs uppercase font-semibold">Joined Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading members...</TableCell></TableRow>
          ) : members.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No members in this team.</TableCell></TableRow>
          ) : (
            members.map((m) => (
              <TableRow key={m.id} className="group transition-colors">
                <TableCell className="px-4 py-3">
                  <UserAvatar 
                    name={m.organization_members.user.name} 
                    photoUrl={m.organization_members.user.profile_photo_url} 
                    className="h-8 w-8" 
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{m.organization_members.user.name}</span>
                    <span className="text-xs text-muted-foreground">{m.organization_members.user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("capitalize font-normal", getRoleBadge(m.role))}>
                    {m.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {m.is_primary_team ? (
                    <Badge className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-500 hover:bg-amber-50">Primary</Badge>
                  ) : (
                    <span className="text-muted-foreground/30 text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(m.joined_at), "MMM dd, yyyy")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}