"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Settings, AlertCircle } from "lucide-react";
import { getOrganizationLeaveTypes } from "@/action/admin-leaves";
import { ILeaveType } from "@/lib/leave/types";
import { useUserStore } from "@/store/user-store";
import { useOrgStore } from "@/store/org-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LeaveTypeManager } from "@/components/leave/leave-type-manager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<ILeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { role, permissions } = useUserStore();
  const { organizationId } = useOrgStore();
  const router = useRouter();
  
  // Role codes: A001 = Admin Org, SA001 = Super Admin
  const isAdmin = role === 'A001' || role === 'SA001';
  const canManageLeaveTypes = permissions?.includes('leaves:type:manage') || isAdmin;

  // Load leave types
  const loadLeaveTypes = useCallback(async () => {
    if (!organizationId) {
      toast.error("Organization not found");
      return;
    }

    setLoading(true);
    try {
      const result = await getOrganizationLeaveTypes(organizationId);
      
      if (result.success && result.data) {
        setLeaveTypes(result.data);
      } else {
        toast.error(result.message || "Failed to load leave types");
      }
    } catch (error) {
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    // Check permission
    if (!canManageLeaveTypes) {
      toast.error("You do not have access to this page");
      router.push("/leaves");
      return;
    }

    loadLeaveTypes();
  }, [canManageLeaveTypes, loadLeaveTypes, router]);

  if (!canManageLeaveTypes) {
    return null;
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/leaves")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Manage Leave Types</h1>
          </div>
          <p className="text-muted-foreground">
            Configure and manage leave types available in your organization
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className='mb-4 mt-4'>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          Leave types you create will be available to all employees in the organization. 
          Make sure to configure settings correctly before activating leave types.
        </AlertDescription>
      </Alert>

      {/* Statistics */}
      {!loading && leaveTypes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Leave Types</CardDescription>
              <CardTitle className="text-3xl">{leaveTypes.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Types</CardDescription>
              <CardTitle className="text-3xl">
                {leaveTypes.filter(t => t.is_active).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid Types</CardDescription>
              <CardTitle className="text-3xl">
                {leaveTypes.filter(t => t.is_paid).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Leave Types List</CardTitle>
            <CardDescription>
              Total {leaveTypes.length} leave types registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveTypeManager 
              leaveTypes={leaveTypes} 
              onUpdate={loadLeaveTypes}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
