"use client"

import React from "react"
import { z } from "zod"
import { UseFormReturn } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

// ─── Schema Validation ────────────────────────────────────────────────────────
export const teamSchema = z.object({
  organization_id: z.string().min(1, "Organization ID is required"),
  code: z.string().optional().or(z.literal("")),
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional().or(z.literal("")),
  is_active: z.boolean(),
  settings: z.string().optional().or(z.literal("")),
  metadata: z.string().optional().or(z.literal("")),
})

export type TeamForm = z.infer<typeof teamSchema>

// ─── Component Props ──────────────────────────────────────────────────────────
interface TeamFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: number | string | null
  form: UseFormReturn<TeamForm>
  onSubmit: (values: TeamForm) => void
  organizationId: string | number | null | undefined
}

export function TeamFormDialog({
  open,
  onOpenChange,
  editingId,
  form,
  onSubmit,
}: TeamFormDialogProps) {
  const isEditing = !!editingId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Team" : "Add Team"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of the team here."
              : "Create a new team for your organization."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. DEV-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does this team do?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="settings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Settings</FormLabel>
                  <FormControl>
                    {/* FIX: Menggunakan single quotes agar JSX tidak bingung dengan {} */}
                    <Textarea
                      placeholder='{ "key": "value" }'
                      className="resize-none font-mono text-xs"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional JSON settings configuration.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metadata</FormLabel>
                  <FormControl>
                    {/* FIX: Menggunakan single quotes agar JSX tidak bingung dengan {} */}
                    <Textarea
                      placeholder='{ "key": "value" }'
                      className="resize-none font-mono text-xs"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional JSON metadata.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>
                      Determine whether this team is active or inactive.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save changes"
                  : "Create team"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}