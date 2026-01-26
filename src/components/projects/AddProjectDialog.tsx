"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DUMMY_CLIENTS, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import type { NewProjectForm } from "./types"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

type AddProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: NewProjectForm
  onFormChange: React.Dispatch<React.SetStateAction<NewProjectForm>>
  onSave: () => void
}

export default function AddProjectDialog(props: AddProjectDialogProps) {
  const { open, onOpenChange, form, onFormChange, onSave } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">GENERAL</TabsTrigger>
            <TabsTrigger value="members">MEMBERS</TabsTrigger>
            <TabsTrigger value="budget">BUDGET & LIMITS</TabsTrigger>
            <TabsTrigger value="teams">TEAMS</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">PROJECT NAMES*</div>
              <Textarea
                value={form.names}
                onChange={(e) => onFormChange(s => ({ ...s, names: e.target.value }))}
                placeholder="Add project names separated by new lines"
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Billable</span>
                <Switch checked={form.billable} onCheckedChange={(v) => onFormChange(s => ({ ...s, billable: v }))} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Disable activity</span>
                <Switch checked={form.disableActivity} onCheckedChange={(v) => onFormChange(s => ({ ...s, disableActivity: v }))} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Allow project tracking</span>
                <Switch checked={form.allowTracking} onCheckedChange={(v) => onFormChange(s => ({ ...s, allowTracking: v }))} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Disable idle time</span>
                <Switch checked={form.disableIdle} onCheckedChange={(v) => onFormChange(s => ({ ...s, disableIdle: v }))} />
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">CLIENT</div>
              <Select
                value={form.clientId ?? ""}
                onValueChange={(v) => onFormChange(s => ({ ...s, clientId: v || null }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_CLIENTS.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-5">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">MANAGERS</div>
              <div className="text-xs text-muted-foreground">Oversees and manages the project</div>
              <Select
                value={form.members?.[0] ?? ""}
                onValueChange={(v) => {
                  const newMembers = [...(form.members || [])]
                  newMembers[0] = v
                  onFormChange(prev => ({ ...prev, members: newMembers }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_MEMBERS.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">USERS</div>
              <div className="text-xs text-muted-foreground">Works on the project</div>
              <Select
                value={form.members?.[1] ?? ""}
                onValueChange={(v) => {
                  const newMembers = [...(form.members || [])]
                  newMembers[1] = v
                  onFormChange(prev => ({ ...prev, members: newMembers }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_MEMBERS.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">VIEWERS</div>
              <div className="text-xs text-muted-foreground">Can view team reports</div>
              <Select
                value={form.members?.[2] ?? ""}
                onValueChange={(v) => {
                  const newMembers = [...(form.members || [])]
                  newMembers[2] = v
                  onFormChange(prev => ({ ...prev, members: newMembers }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select viewer" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_MEMBERS.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="budget">
            <div className="text-sm text-muted-foreground">Budget & Limits tab (coming soon)</div>
          </TabsContent>
          <TabsContent value="teams" className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">TEAMS</div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-blue-600"
                  onClick={() => onFormChange(s => ({ ...s, teams: DUMMY_TEAMS.map(t => t.id) }))}
                >
                  Select all
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {DUMMY_TEAMS.map((team) => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-${team.id}`}
                      checked={!!form.teams?.includes(team.id)}
                      onCheckedChange={(checked) => {
                        const current = new Set(form.teams || [])
                        if (checked) current.add(team.id); else current.delete(team.id)
                        onFormChange(prev => ({ ...prev, teams: Array.from(current) }))
                      }}
                    />
                    <label htmlFor={`team-${team.id}`} className="text-sm font-medium leading-none">
                      {team.name} <span className="text-muted-foreground">({team.memberCount} members)</span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}