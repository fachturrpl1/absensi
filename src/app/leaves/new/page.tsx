"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getLeaveTypes, getMyLeaveBalance, createLeaveRequest } from "@/action/leaves";
import { ILeaveType, LeaveBalanceWithType } from "@/lib/leave/types";
import { calculateTotalLeaveDays, meetsNoticeRequirement } from "@/lib/leave/utils";
import Link from "next/link";

import { logger } from '@/lib/logger';
// Form Schema
const leaveRequestSchema = z.object({
  leave_type_id: z.string().min(1, "Please select a leave type"),
  start_date: z.date(),
  end_date: z.date(),
  start_half_day: z.boolean(),
  end_half_day: z.boolean(),
  reason: z.string().min(10, "Please provide a detailed reason (minimum 10 characters)"),
  emergency_contact: z.string().optional()
}).refine(
  (data) => data.end_date >= data.start_date,
  {
    message: "End date must be after or equal to start date",
    path: ["end_date"]
  }
);

type LeaveRequestForm = z.infer<typeof leaveRequestSchema>;

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const [leaveTypes, setLeaveTypes] = useState<ILeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<ILeaveType | null>(null);
  const [calculatedDays, setCalculatedDays] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [noticeWarning, setNoticeWarning] = useState<string | null>(null);

  const form = useForm<LeaveRequestForm>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type_id: "",
      start_half_day: false,
      end_half_day: false,
      reason: "",
      emergency_contact: ""
    }
  });

  const watchStartDate = form.watch("start_date");
  const watchEndDate = form.watch("end_date");
  const watchStartHalfDay = form.watch("start_half_day");
  const watchEndHalfDay = form.watch("end_half_day");
  const watchLeaveTypeId = form.watch("leave_type_id");

  // Load leave types and balances
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [typesResult, balancesResult] = await Promise.all([
        getLeaveTypes(),
        getMyLeaveBalance()
      ]);

      if (typesResult.success && typesResult.data) {
        setLeaveTypes(typesResult.data as ILeaveType[]);
      }

      if (balancesResult.success && balancesResult.data) {
        setBalances(balancesResult.data as any);
      }
    } catch (error) {
      logger.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Update selected leave type
  useEffect(() => {
    if (watchLeaveTypeId) {
      const type = leaveTypes.find(t => t.id === parseInt(watchLeaveTypeId));
      setSelectedLeaveType(type || null);

      // Find balance for this type
      const balance = balances.find(b => b.leave_type_id === parseInt(watchLeaveTypeId));
      setAvailableBalance(balance?.remaining_days || 0);
    }
  }, [watchLeaveTypeId, leaveTypes, balances]);

  // Calculate total days
  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const days = calculateTotalLeaveDays(
        watchStartDate,
        watchEndDate,
        watchStartHalfDay,
        watchEndHalfDay
      );
      setCalculatedDays(days);

      // Check notice requirement
      if (selectedLeaveType) {
        const notice = meetsNoticeRequirement(
          watchStartDate,
          selectedLeaveType.minimum_days_notice
        );

        if (!notice.valid && selectedLeaveType.minimum_days_notice > 0) {
          setNoticeWarning(
            `This leave type requires ${selectedLeaveType.minimum_days_notice} days advance notice. You have ${notice.daysUntil} days.`
          );
        } else {
          setNoticeWarning(null);
        }
      }
    }
  }, [watchStartDate, watchEndDate, watchStartHalfDay, watchEndHalfDay, selectedLeaveType]);

  async function onSubmit(data: LeaveRequestForm) {
    setSubmitting(true);
    try {
      const result = await createLeaveRequest({
        leave_type_id: parseInt(data.leave_type_id),
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
        start_half_day: data.start_half_day,
        end_half_day: data.end_half_day,
        reason: data.reason,
        emergency_contact: data.emergency_contact
      });

      if (result.success) {
        toast.success("Leave request submitted successfully");
        router.push("/leaves");
      } else {
        toast.error(result.message || "Failed to submit leave request");
      }
    } catch (error) {
      logger.error("Error submitting leave request:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leaves">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Request Leave</h1>
          <p className="text-muted-foreground">Submit a new leave request</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
          <CardHeader>
            <CardTitle>Leave Request Form</CardTitle>
            <CardDescription>Fill in the details for your leave request</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Leave Type */}
                <FormField
                  control={form.control}
                  name="leave_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leaveTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: type.color_code || '#10B981' }}
                                />
                                {type.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Leave Type Info */}
                {selectedLeaveType && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <p>{selectedLeaveType.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedLeaveType.days_per_year > 0 && (
                          <Badge variant="outline">
                            {selectedLeaveType.days_per_year} days/year
                          </Badge>
                        )}
                        {selectedLeaveType.requires_document && (
                          <Badge variant="outline">Document required</Badge>
                        )}
                        {selectedLeaveType.minimum_days_notice > 0 && (
                          <Badge variant="outline">
                            {selectedLeaveType.minimum_days_notice} days notice
                          </Badge>
                        )}
                        {selectedLeaveType.is_paid && (
                          <Badge variant="outline" className="bg-green-50">Paid</Badge>
                        )}
                      </div>
                      {selectedLeaveType.days_per_year > 0 && (
                        <p className="text-sm font-medium mt-2">
                          Available balance: <span className="text-green-600">{availableBalance} days</span>
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < (watchStartDate || new Date())}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Half Day Options */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_half_day"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Start Half Day</FormLabel>
                          <FormDescription>
                            Leave starts at noon
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_half_day"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>End Half Day</FormLabel>
                          <FormDescription>
                            Leave ends at noon
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Calculated Days */}
                {calculatedDays > 0 && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Total: {calculatedDays} working day{calculatedDays !== 1 ? 's' : ''}</strong>
                      {selectedLeaveType && selectedLeaveType.days_per_year > 0 && (
                        <>
                          {' • '}
                          Balance after: <strong>{availableBalance - calculatedDays} days</strong>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Notice Warning */}
                {noticeWarning && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{noticeWarning}</AlertDescription>
                  </Alert>
                )}

                {/* Reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide a detailed reason for your leave..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 10 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Emergency Contact */}
                <FormField
                  control={form.control}
                  name="emergency_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Phone number or email to reach you during leave"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !!noticeWarning}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
    </div>
  );
}
