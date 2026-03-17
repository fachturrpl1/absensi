"use client"

import React from "react"
import z from "zod"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"

// ─── Schema & type — di-export agar bisa dipakai di page ─────────────────────

export const groupSchema = z.object({
  organization_id: z.string().min(1, "Organization is required"),
  code: z.string().min(2, "min 2 characters"),
  name: z.string().min(2, "min 2 characters"),
  description: z.string().optional(),
  is_active: z.boolean(),
})

export type GroupForm = z.infer<typeof groupSchema>
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Can } from "@/components/common/can"
import { UseFormReturn } from "react-hook-form"

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = mode Add, non-null = mode Edit */
  editingId: string | null
  form: UseFormReturn<GroupForm>
  onSubmit: (values: GroupForm) => Promise<void>
  organizationId: string | number | null | undefined
  organizations: { id: string; name: string }[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GroupFormDialog({
  open,
  onOpenChange,
  editingId,
  form,
  onSubmit,
  organizationId,
  organizations,
}: GroupFormDialogProps) {
  const isEditing = editingId !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Group" : "Add Group"}</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Organization: hidden jika sudah ada orgId, visible untuk super-admin */}
            {organizationId ? (
              <input
                type="hidden"
                value={String(organizationId)}
                {...form.register("organization_id")}
              />
            ) : (
              <Can permission="view_departments">
                <FormField
                  control={form.control}
                  name="organization_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Organization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={String(org.id)}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Can>
            )}

            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., x_rpl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., X RPL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Rekayasa Perangkat Lunak" {...field} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <FormLabel className="cursor-pointer">Active</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <Button type="submit" className="w-full">
              {isEditing ? "Update" : "Create"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}