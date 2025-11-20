"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Settings, AlertCircle, RefreshCw, Loader2, Plus, Layers, CheckCircle, DollarSign } from "lucide-react";
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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/leaves")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Leave Types</h1>
              <p className="text-muted-foreground mt-1">
                Configure and manage leave types available in your organization
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLeaveTypes}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-200">Important Information</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Leave types you create will be available to all employees in the organization. 
          Make sure to configure settings correctly before activating leave types.
        </AlertDescription>
      </Alert>

      {/* Statistics */}
      {!loading && leaveTypes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Total Leave Types</CardDescription>
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">{leaveTypes.length}</CardTitle>
              <Badge variant="outline" className="w-fit mt-2">
                Total configured
              </Badge>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Active Types</CardDescription>
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">
                {leaveTypes.filter(t => t.is_active).length}
              </CardTitle>
              <Badge variant="secondary" className="w-fit mt-2 bg-green-100 text-green-800">
                Currently available
              </Badge>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Paid Types</CardDescription>
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">
                {leaveTypes.filter(t => t.is_paid).length}
              </CardTitle>
              <Badge variant="outline" className="w-fit mt-2">
                With salary
              </Badge>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
            <Separator className="mt-4" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Leave Types Management
                </CardTitle>
                <CardDescription className="mt-1">
                  Total {leaveTypes.length} leave types registered in your organization
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {leaveTypes.filter(t => t.is_active).length} active
                </Badge>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Type
                </Button>
              </div>
            </div>
            <Separator className="mt-4" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <LeaveTypeManager 
                leaveTypes={leaveTypes} 
                onUpdate={loadLeaveTypes}
              />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
