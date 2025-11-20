"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Trash2, Save, X, Loader2 } from "lucide-react";
import { ILeaveType } from "@/lib/leave/types";
import { createLeaveType, updateLeaveType, deleteLeaveType } from "@/action/admin-leaves";
import { useOrgStore } from "@/store/org-store";
import { toast } from "sonner";

const leaveTypeSchema = z.object({
  code: z.string().min(1, "Code is required").max(20, "Code must be less than 20 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  days_per_year: z.number().min(0, "Days must be 0 or more").max(365, "Days cannot exceed 365"),
  carry_forward_allowed: z.boolean(),
  max_carry_forward_days: z.number().min(0).max(365).optional(),
  requires_approval: z.boolean(),
  requires_document: z.boolean(),
  minimum_days_notice: z.number().min(0).max(365),
  color_code: z.string().optional(),
  is_paid: z.boolean(),
  is_active: z.boolean()
});

type LeaveTypeForm = z.infer<typeof leaveTypeSchema>;

interface LeaveTypeManagerProps {
  leaveTypes: ILeaveType[];
  onUpdate: () => void;
  triggerCreate?: boolean;
}

const DEFAULT_COLORS = [
  "#10B981", // Green
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#84CC16", // Lime
];

export function LeaveTypeManager({ leaveTypes, onUpdate, triggerCreate }: LeaveTypeManagerProps) {
  const [editingType, setEditingType] = useState<ILeaveType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { organizationId } = useOrgStore();

  const form = useForm<LeaveTypeForm>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      days_per_year: 0,
      carry_forward_allowed: false,
      max_carry_forward_days: 0,
      requires_approval: true,
      requires_document: false,
      minimum_days_notice: 0,
      color_code: DEFAULT_COLORS[0],
      is_paid: true,
      is_active: true
    }
  });

  const handleCreate = () => {
    form.reset({
      code: "",
      name: "",
      description: "",
      days_per_year: 0,
      carry_forward_allowed: false,
      max_carry_forward_days: 0,
      requires_approval: true,
      requires_document: false,
      minimum_days_notice: 0,
      color_code: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
      is_paid: true,
      is_active: true
    });
    setIsCreating(true);
    setEditingType(null);
  };

  // Trigger create mode from parent
  useEffect(() => {
    if (triggerCreate) {
      handleCreate();
    }
  }, [triggerCreate]);

  const handleEdit = (type: ILeaveType) => {
    form.reset({
      code: type.code,
      name: type.name,
      description: type.description || "",
      days_per_year: type.days_per_year,
      carry_forward_allowed: type.carry_forward_allowed,
      max_carry_forward_days: type.max_carry_forward_days || 0,
      requires_approval: type.requires_approval,
      requires_document: type.requires_document,
      minimum_days_notice: type.minimum_days_notice,
      color_code: type.color_code || DEFAULT_COLORS[0],
      is_paid: type.is_paid,
      is_active: type.is_active
    });
    setEditingType(type);
    setIsCreating(false);
  };

  const handleCancel = () => {
    form.reset();
    setEditingType(null);
    setIsCreating(false);
  };

  const handleSubmit = async (data: LeaveTypeForm) => {
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    setLoading(true);
    try {
      let result;
      
      if (isCreating) {
        result = await createLeaveType(organizationId, data);
      } else if (editingType) {
        result = await updateLeaveType(organizationId, editingType.id, data);
      }

      if (result?.success) {
        toast.success(isCreating ? "Leave type created" : "Leave type updated");
        handleCancel();
        onUpdate();
      } else {
        toast.error(result?.message || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    setLoading(true);
    try {
      const result = await deleteLeaveType(organizationId, id);
      
      if (result.success) {
        toast.success("Leave type deleted");
        setDeleteConfirmId(null);
        onUpdate();
      } else {
        toast.error(result.message || "Delete failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All Types</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Create/Edit Form */}
          {(isCreating || editingType) && (
            <Card>
              <CardHeader>
                <CardTitle>{isCreating ? "Create New Leave Type" : "Edit Leave Type"}</CardTitle>
                <CardDescription>
                  {isCreating 
                    ? "Add a new leave type to your organization" 
                    : `Editing ${editingType?.name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Code */}
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ANNUAL" 
                                {...field} 
                                disabled={!isCreating}
                              />
                            </FormControl>
                            <FormDescription>
                              Unique identifier (cannot be changed)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Name */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Annual Leave" {...field} />
                            </FormControl>
                            <FormDescription className="opacity-0">
                              Placeholder for alignment
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe this leave type..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      {/* Days per Year */}
                      <FormField
                        control={form.control}
                        name="days_per_year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days per Year</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              0 for unlimited
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Minimum Notice */}
                      <FormField
                        control={form.control}
                        name="minimum_days_notice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Days Notice</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Advance notice required
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Color */}
                    <FormField
                      control={form.control}
                      name="color_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                              <div className="relative">
                                <input
                                  type="color"
                                  {...field}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div 
                                  className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer hover:border-primary transition-colors"
                                  style={{ backgroundColor: field.value }}
                                />
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {DEFAULT_COLORS.map(color => (
                                  <button
                                    key={color}
                                    type="button"
                                    className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                                    style={{ 
                                      backgroundColor: color,
                                      borderColor: field.value === color ? 'hsl(var(--primary))' : 'transparent'
                                    }}
                                    onClick={() => field.onChange(color)}
                                  />
                                ))}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Switches */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="is_paid"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Paid Leave</FormLabel>
                              <FormDescription>
                                Employee receives salary during this leave
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

                      <FormField
                        control={form.control}
                        name="requires_approval"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Requires Approval</FormLabel>
                              <FormDescription>
                                Manager approval needed
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

                      <FormField
                        control={form.control}
                        name="requires_document"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Requires Document</FormLabel>
                              <FormDescription>
                                Supporting document required
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

                      <FormField
                        control={form.control}
                        name="carry_forward_allowed"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Allow Carry Forward</FormLabel>
                              <FormDescription>
                                Unused days can be carried to next year
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

                      {form.watch("carry_forward_allowed") && (
                        <FormField
                          control={form.control}
                          name="max_carry_forward_days"
                          render={({ field }) => (
                            <FormItem className="ml-8">
                              <FormLabel>Max Carry Forward Days</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Active</FormLabel>
                              <FormDescription>
                                Available for employees to use
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
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {isCreating ? "Create" : "Update"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Leave Types List */}
          <div className="grid gap-4">
            {leaveTypes.map((type) => (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: type.color_code || '#10B981' }}
                        />
                        <h4 className="font-semibold">{type.name}</h4>
                        <Badge variant="outline">{type.code}</Badge>
                        {!type.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      {type.description && (
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {type.days_per_year > 0 && (
                          <Badge variant="outline">
                            {type.days_per_year} days/year
                          </Badge>
                        )}
                        {type.days_per_year === 0 && (
                          <Badge variant="outline">Unlimited</Badge>
                        )}
                        {type.is_paid && (
                          <Badge variant="outline" className="bg-green-50">Paid</Badge>
                        )}
                        {type.requires_approval && (
                          <Badge variant="outline">Approval Required</Badge>
                        )}
                        {type.requires_document && (
                          <Badge variant="outline">Document Required</Badge>
                        )}
                        {type.minimum_days_notice > 0 && (
                          <Badge variant="outline">
                            {type.minimum_days_notice} days notice
                          </Badge>
                        )}
                        {type.carry_forward_allowed && (
                          <Badge variant="outline">Carry Forward</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(type)}
                        disabled={loading || isCreating || editingType !== null}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {deleteConfirmId === type.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(type.id)}
                            disabled={loading}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(type.id)}
                          disabled={loading || isCreating || editingType !== null}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {leaveTypes.filter(t => t.is_active).map((type) => (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: type.color_code || '#10B981' }}
                    />
                    <h4 className="font-semibold">{type.name}</h4>
                    <Badge variant="outline">{type.code}</Badge>
                    {type.days_per_year > 0 ? (
                      <Badge variant="outline">{type.days_per_year} days</Badge>
                    ) : (
                      <Badge variant="outline">Unlimited</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="grid gap-4">
            {leaveTypes.filter(t => !t.is_active).map((type) => (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded opacity-50"
                      style={{ backgroundColor: type.color_code || '#10B981' }}
                    />
                    <h4 className="font-semibold text-muted-foreground">{type.name}</h4>
                    <Badge variant="secondary">{type.code}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
