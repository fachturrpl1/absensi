"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { DUMMY_TEAMS, DUMMY_MEMBERS } from "@/lib/data/dummy-data"
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
    budgetType: "",
    budgetBasedOn: "",
    budgetCost: "",
    budgetNotifyMembers: false,
    budgetNotifyAt: "80",
    budgetNotifyWho: "",
    budgetStopTimers: false,
    budgetStopAt: "100",
    budgetResets: "never",
    budgetStartDate: null,
    budgetIncludeNonBillable: false,
    memberLimits: [{
      members: [],
      type: '',
      basedOn: '',
      cost: '',
      resets: 'never',
      startDate: null
    }],
    memberLimitNotifyAt: "80",
    memberLimitNotifyMembers: false,
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
        teams: [],
        budgetType: "",
        budgetBasedOn: "",
        budgetCost: "",
        budgetNotifyMembers: false,
        budgetNotifyAt: "80",
        budgetNotifyWho: "",
        budgetStopTimers: false,
        budgetStopAt: "100",
        budgetResets: "never",
        budgetStartDate: null,
        budgetIncludeNonBillable: false,
        memberLimits: [{
          members: [],
          type: '',
          basedOn: '',
          cost: '',
          resets: 'never',
          startDate: null
        }],
        memberLimitNotifyAt: "80",
        memberLimitNotifyMembers: false,
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
              <Select
                value={form.members?.[0] ?? ""}
                onValueChange={(v) => {
                  const newMembers = [...(form.members || [])]
                  newMembers[0] = v
                  setForm(prev => ({ ...prev, members: newMembers }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_MEMBERS.map(m => {
                    const isAlreadyAssigned = form.members?.slice(1).includes(m.id)
                    return (
                      <SelectItem
                        key={m.id}
                        value={m.id}
                        disabled={isAlreadyAssigned}
                      >
                        {m.name}{isAlreadyAssigned ? ' (Already assigned as User/Viewer)' : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">USERS</div>
              <div className="text-xs text-muted-foreground">Works on the project, will not see other users (most common)</div>
              <Select
                value={form.members?.[1] ?? ""}
                onValueChange={(v) => {
                  const newMembers = [...(form.members || [])]
                  newMembers[1] = v
                  setForm(prev => ({ ...prev, members: newMembers }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_MEMBERS.map(m => {
                    const isManager = form.members?.[0] === m.id
                    const isViewer = form.members?.[2] === m.id
                    const isAlreadyAssigned = isManager || isViewer
                    return (
                      <SelectItem
                        key={m.id}
                        value={m.id}
                        disabled={isAlreadyAssigned}
                      >
                        {m.name}{isManager ? ' (Already assigned as Manager)' : isViewer ? ' (Already assigned as Viewer)' : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">VIEWERS</div>
              <div className="text-xs text-muted-foreground">Can view team reports for this project</div>
              <Select
                value={form.members?.[2] ?? ""}
                onValueChange={(v) => {
                  const newMembers = [...(form.members || [])]
                  newMembers[2] = v
                  setForm(prev => ({ ...prev, members: newMembers }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select viewer" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_MEMBERS.map(m => {
                    const isManager = form.members?.[0] === m.id
                    const isUser = form.members?.[1] === m.id
                    const isAlreadyAssigned = isManager || isUser
                    return (
                      <SelectItem
                        key={m.id}
                        value={m.id}
                        disabled={isAlreadyAssigned}
                      >
                        {m.name}{isManager ? ' (Already assigned as Manager)' : isUser ? ' (Already assigned as User)' : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="budget">
            <Tabs defaultValue="project-budget" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="project-budget">Project budget</TabsTrigger>
                <TabsTrigger value="member-limits">Member limits</TabsTrigger>
              </TabsList>

              {/* Project Budget Tab */}
              <TabsContent value="project-budget" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">TYPE*</label>
                    <Select
                      value={form.budgetType}
                      onValueChange={(v) => setForm(s => ({ ...s, budgetType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="cost">Cost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">BASED ON*</label>
                    <Select
                      value={form.budgetBasedOn}
                      onValueChange={(v) => setForm(s => ({ ...s, budgetBasedOn: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tracked-time">Tracked Time</SelectItem>
                        <SelectItem value="billable-time">Billable Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">COST*</label>
                    <div className="flex">
                      <div className="flex items-center justify-center bg-gray-100 px-3 border border-r-0 rounded-l-md text-sm text-gray-600">
                        $
                      </div>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={form.budgetCost}
                        onChange={(e) => setForm(s => ({ ...s, budgetCost: e.target.value }))}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.budgetNotifyMembers}
                    onCheckedChange={(v) => setForm(s => ({ ...s, budgetNotifyMembers: v }))}
                  />
                  <label className="text-sm">Notify project members</label>
                </div>

                {form.budgetNotifyMembers && (
                  <div className="grid grid-cols-2 gap-4 pl-8">
                    <div className="space-y-2">
                      <label className="text-xs">NOTIFY AT</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={form.budgetNotifyAt}
                          onChange={(e) => setForm(s => ({ ...s, budgetNotifyAt: e.target.value }))}
                          className="flex-1 pl-3"
                        />
                        <div className="flex items-center px-3 bg-gray-100 border rounded-md text-sm">
                          % of budget
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs">WHO TO NOTIFY</label>
                      <Select
                        value={form.budgetNotifyWho}
                        onValueChange={(v) => setForm(s => ({ ...s, budgetNotifyWho: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="managers">Managers only</SelectItem>
                          <SelectItem value="all">All members</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.budgetStopTimers}
                    onCheckedChange={(v) => setForm(s => ({ ...s, budgetStopTimers: v }))}
                  />
                  <label className="text-sm">Stop timers when budget is reached</label>
                </div>

                {form.budgetStopTimers && (
                  <div className="pl-8 space-y-2">
                    <label className="text-xs flex items-center gap-1">
                      STOP TIMERS AT
                      <span className="text-gray-400 cursor-help" title="Help information">ⓘ</span>
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={form.budgetStopAt}
                        onChange={(e) => setForm(s => ({ ...s, budgetStopAt: e.target.value }))}
                        className="flex-1 pl-3"
                      />
                      <div className="flex items-center px-3 bg-gray-100 border rounded-md text-sm">
                        % of budget
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs">RESETS*</label>
                    <Select
                      value={form.budgetResets}
                      onValueChange={(v) => setForm(s => ({ ...s, budgetResets: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Never" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs flex items-center gap-1">
                      START DATE
                      <span className="text-gray-400 cursor-help" title="Help information">ⓘ</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={form.budgetStartDate || ''}
                        onChange={(e) => setForm(s => ({ ...s, budgetStartDate: e.target.value }))}
                        className="pl-3"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.budgetIncludeNonBillable}
                    onCheckedChange={(v) => setForm(s => ({ ...s, budgetIncludeNonBillable: v }))}
                  />
                  <label className="text-sm">Include non-billable time</label>
                </div>
              </TabsContent>

              {/* Member Limits Tab */}
              <TabsContent value="member-limits" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Member limits aim to stop time tracking at the set amount. While uncommon, technical factors such as network connectivity may occasionally cause a slight overrun.
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <label className="text-xs">NOTIFY AT</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={form.memberLimitNotifyAt}
                        onChange={(e) => setForm(s => ({ ...s, memberLimitNotifyAt: e.target.value }))}
                        className="w-20 pl-3"
                      />
                      <span className="text-sm bg-gray-100 px-3 py-1.5 rounded-md border">% of limit</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.memberLimitNotifyMembers}
                      onCheckedChange={(v) => setForm(s => ({ ...s, memberLimitNotifyMembers: v }))}
                    />
                    <label className="text-sm">Notify project members</label>
                  </div>
                </div>

                {/* Member Limit Sections */}
                <ScrollArea className="h-[400px] w-full pr-4">
                  <div className="space-y-4">
                    {form.memberLimits.map((limit, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold">MEMBERS</label>
                          <Input className="pl-3" placeholder="Select members" readOnly />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs">TYPE*</label>
                            <Select
                              value={limit.type}
                              onValueChange={(v) => {
                                const newLimits = [...form.memberLimits]
                                newLimits[index] = { ...limit, type: v }
                                setForm(s => ({ ...s, memberLimits: newLimits }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs">BASED ON*</label>
                            <Select
                              value={limit.basedOn}
                              onValueChange={(v) => {
                                const newLimits = [...form.memberLimits]
                                newLimits[index] = { ...limit, basedOn: v }
                                setForm(s => ({ ...s, memberLimits: newLimits }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a rate" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="cost">Cost</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs">COST*</label>
                            <div className="flex">
                              <div className="flex items-center justify-center bg-gray-100 px-3 border border-r-0 rounded-l-md text-sm text-gray-600">
                                $
                              </div>
                              <Input
                                type="number"
                                placeholder="0.0"
                                value={limit.cost}
                                onChange={(e) => {
                                  const newLimits = [...form.memberLimits]
                                  newLimits[index] = { ...limit, cost: e.target.value }
                                  setForm(s => ({ ...s, memberLimits: newLimits }))
                                }}
                                className="rounded-l-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs">RESETS*</label>
                            <Select
                              value={limit.resets}
                              onValueChange={(v) => {
                                const newLimits = [...form.memberLimits]
                                newLimits[index] = { ...limit, resets: v }
                                setForm(s => ({ ...s, memberLimits: newLimits }))
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Never" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="never">Never</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs">START DATE</label>
                            <Input
                              className="pl-3"
                              type="date"
                              value={limit.startDate || ''}
                              onChange={(e) => {
                                const newLimits = [...form.memberLimits]
                                newLimits[index] = { ...limit, startDate: e.target.value }
                                setForm(s => ({ ...s, memberLimits: newLimits }))
                              }}
                            />
                          </div>
                        </div>

                        {form.memberLimits.length > 1 && (
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              const newLimits = form.memberLimits.filter((_, i) => i !== index)
                              setForm(s => ({ ...s, memberLimits: newLimits }))
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove limit
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      variant="link"
                      className="text-gray-900 p-0 hover:cursor-pointer"
                      onClick={() => {
                        const newLimit: import('./types').MemberLimit = {
                          members: [],
                          type: '',
                          basedOn: '',
                          cost: '',
                          resets: 'never',
                          startDate: null
                        }
                        setForm(s => ({ ...s, memberLimits: [...s.memberLimits, newLimit] }))
                      }}
                    >
                      + Add member limit
                    </Button>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="teams" className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">TEAMS</div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-gray-900 hover:cursor-pointer"
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
