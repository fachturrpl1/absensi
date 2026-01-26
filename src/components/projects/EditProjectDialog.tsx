"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DUMMY_TEAMS } from "@/lib/data/dummy-data"
import type { NewProjectForm, Project } from "./types"

type EditProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  onSave: () => void
  initialTab?: "general" | "members" | "budget" | "teams"
}

export default function EditProjectDialog(props: EditProjectDialogProps) {
  const { open, onOpenChange, project, onSave, initialTab } = props
  const [form, setForm] = useState<NewProjectForm>({
    names: "",
    billable: true,
    disableActivity: false,
    allowTracking: true,
    disableIdle: false,
    clientId: null,
    members: [],
    teams: [],
  })
  const [tab, setTab] = useState<"general" | "members" | "budget" | "teams">("general")

  useEffect(() => {
    if (project) {
      setForm((s) => ({
        ...s,
        names: project.name,
        members: project.members?.map(m => m.id) || [],
        teams: project.teams || []
      }))
    } else {
      setForm({
        names: "",
        billable: true,
        disableActivity: false,
        allowTracking: true,
        disableIdle: false,
        clientId: null,
        members: [],
        teams: []
      })
    }
  }, [project])

  useEffect(() => {
    if (open) {
      setTab(initialTab ?? "general")
    }
  }, [open, initialTab])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
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
                onChange={(e) => setForm(s => ({ ...s, names: e.target.value }))}
                placeholder="Edit project name"
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Billable</span>
                <Switch checked={form.billable} onCheckedChange={(v) => setForm(s => ({ ...s, billable: v }))} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Disable activity</span>
                <Switch checked={form.disableActivity} onCheckedChange={(v) => setForm(s => ({ ...s, disableActivity: v }))} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Allow project tracking</span>
                <Switch checked={form.allowTracking} onCheckedChange={(v) => setForm(s => ({ ...s, allowTracking: v }))} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">Disable idle time</span>
                <Switch checked={form.disableIdle} onCheckedChange={(v) => setForm(s => ({ ...s, disableIdle: v }))} />
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">CLIENT</div>
              <Select
                value={form.clientId ?? ""}
                onValueChange={(v) => setForm(s => ({ ...s, clientId: v || null }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client-1">Client A</SelectItem>
                  <SelectItem value="client-2">Client B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-5">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">MANAGERS</div>
              <div className="text-xs text-muted-foreground">Oversees and manages the project</div>
              <Input placeholder="Select members" readOnly />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">USERS</div>
              <div className="text-xs text-muted-foreground">Works on the project, will not see other users (most common)</div>
              <Input placeholder="Select members" readOnly />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">VIEWERS</div>
              <div className="text-xs text-muted-foreground">Can view team reports for this project</div>
              <Input placeholder="Select members" readOnly />
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
                  onClick={() => setForm(s => ({ ...s, teams: DUMMY_TEAMS.map(t => t.id) }))}
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
                        setForm(prev => ({ ...prev, teams: Array.from(current) }))
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
