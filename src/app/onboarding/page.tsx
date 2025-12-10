"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Users, 
  Plus, 
  CheckCircle,
  Clock,
  AlertCircle,
  KeyRound,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { joinOrganization, createOrganization, checkUserOrganizationStatus, autoActivateMemberIfOrgActive } from "@/action/onboarding";
import { PendingApproval } from "@/components/pending-approval";
import { INDUSTRY_OPTIONS } from "@/lib/constants/industries";
import styles from "./onboarding.module.css";

import { logger } from '@/lib/logger';
export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("join");
  const [fadeIn, setFadeIn] = useState(false);
  const [userStatus, setUserStatus] = useState<{
    hasOrganization: boolean;
    organization?: { id: string; name: string; is_active: boolean };
    memberStatus?: { is_active: boolean; employment_status: string };
  } | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [organizationData, setOrganizationData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    website: "",
    industry: ""
  });
  const router = useRouter();

  // Check user status and trigger fade-in animation on component mount
  React.useEffect(() => {
    checkStatus();
    // Trigger fade-in animation
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100); // Small delay to ensure component is mounted
    
    return () => clearTimeout(timer);
  }, []);

  const checkStatus = async () => {
    try {
      // Try to auto-activate member first if organization is active
      await autoActivateMemberIfOrgActive();
      
      // Then check status
      const status = await checkUserOrganizationStatus();
      setUserStatus(status);
    } catch (error) {
      logger.error('Error checking user status:', error);
    }
  };

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      // Try to auto-activate member first if organization is active
      await autoActivateMemberIfOrgActive();
      
      // Then check status
      const status = await checkUserOrganizationStatus();
      setUserStatus(status);
      
      // If organization becomes active, redirect to dashboard
      if (status.hasOrganization && status.organization?.is_active && status.memberStatus?.is_active) {
        router.push('/');
      }
    } catch (error) {
      logger.error('Error refreshing status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinOrganization = async () => {
    if (!joinCode.trim()) {
      setJoinError("Please enter the organization code");
      return;
    }

    setLoading(true);
    setJoinError(null); // Clear previous errors
    
    try {
      const result = await joinOrganization(joinCode.trim());
      
      if (result.success) {
        toast.success(result.message);
        router.push("/");
      } else {
        // Set specific error for invalid/expired codes
        setJoinError(result.message);
        // Also show toast for immediate feedback
        toast.error("Failed to join organization");
      }
    } catch {
      setJoinError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!organizationData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setLoading(true);
    try {
      const result = await createOrganization(organizationData);
      
      if (result.success) {
        toast.success(result.message);
        // Refresh status to show pending approval
        await checkStatus();
        setOrganizationData({
          name: "",
          description: "",
          address: "",
          phone: "",
          website: "",
          industry: ""
        });
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle redirects with useEffect to avoid render-time state updates
  React.useEffect(() => {
    if (userStatus?.hasOrganization && userStatus.organization) {
      // If organization is active but member is not, auto-activate member and redirect
      if (userStatus.organization.is_active && !userStatus.memberStatus?.is_active) {
        const activateMember = async () => {
          await autoActivateMemberIfOrgActive();
          router.push('/');
        };
        activateMember();
      }
      // If both organization and member are active, redirect to dashboard
      else if (userStatus.organization.is_active && userStatus.memberStatus?.is_active) {
        router.push('/');
      }
    }
  }, [userStatus, router]);

  // Show pending approval only if organization is inactive
  if (userStatus?.hasOrganization && userStatus.organization) {
    if (!userStatus.organization.is_active) {
      // Organization not approved yet
      return (
        <PendingApproval
          organizationName={userStatus.organization.name}
          onRefresh={handleRefreshStatus}
          isRefreshing={refreshing}
        />
      );
    } else if (userStatus.organization.is_active && !userStatus.memberStatus?.is_active) {
      // Show activating screen while processing
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <p className="text-gray-300">Activating your account...</p>
          </div>
        </div>
      );
    } else if (userStatus.organization.is_active && userStatus.memberStatus?.is_active) {
      // Show loading while redirecting
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="text-gray-300">Redirecting to dashboard...</p>
          </div>
        </div>
      );
    }
  }

  // Show loading state while checking status
  if (userStatus === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <p className="text-gray-300">Checking your organization status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div 
        className={`w-full max-w-2xl mx-auto space-y-8 transition-all duration-700 ease-out ${
          fadeIn 
            ? "opacity-100 transform translate-y-0" 
            : "opacity-0 transform translate-y-8"
        }`}
      >
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Presensi</h1>
          <p className="text-gray-300 text-lg">
            Get started by joining an existing organization or creating your own
          </p>
        </div>

        {/* Main Content */}
        <Card className={`${styles['glass-card']} shadow-2xl`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-white text-2xl">Choose Your Path</CardTitle>
            <CardDescription className="text-center text-gray-300">
              Select how you&apos;d like to get started with your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="space-y-8"
            >
              <TabsList className="grid w-full grid-cols-2 bg-gray-700/50 border-gray-600">
                <TabsTrigger value="join" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-600">
                  <KeyRound className="h-4 w-4" />
                  Join Organization
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-purple-600">
                  <Plus className="h-4 w-4" />
                  Create Organization
                </TabsTrigger>
              </TabsList>

              {/* Join Organization Tab */}
              <TabsContent value="join" className="space-y-8">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Join Existing Organization</h3>
                  <p className="text-gray-300">
                    Enter the invitation code provided by your organization admin
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode" className="text-gray-200">Organization Code</Label>
                    <Input
                      id="joinCode"
                      type="text"
                      placeholder="Enter invitation code"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value);
                        // Clear error when user starts typing
                        if (joinError) setJoinError(null);
                      }}
                      className={`text-center text-lg font-mono bg-gray-700/50 text-white placeholder:text-gray-400 focus:ring-blue-500/20 ${
                        joinError 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-600 focus:border-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {joinError ? (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-red-400 font-medium">Unable to Join Organization</p>
                            <p className="text-sm text-red-300">{joinError}</p>
                            
                            {joinError.includes("regenerated") && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-red-300">
                                  <HelpCircle className="h-4 w-4" />
                                  <span className="font-medium">What to do:</span>
                                </div>
                                <ul className="text-xs text-red-200 space-y-1 ml-6">
                                  <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">•</span>
                                    Contact your organization admin for the latest invitation code
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">•</span>
                                    The admin may have generated a new code for security reasons
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">•</span>
                                    Old invitation codes become invalid when new ones are created
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center">
                        Ask your organization admin for this code
                      </p>
                    )}
                  </div>

                  <Button 
                    onClick={handleJoinOrganization}
                    disabled={loading || !joinCode.trim()}
                    className={`w-full text-white border-0 ${
                      joinError
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    }`}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Joining...
                      </>
                    ) : joinError ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </>
                    ) : (
                      "Join Organization"
                    )}
                  </Button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-blue-300">Benefits of joining:</span>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      Immediate access to organization features
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      Connect with existing team members
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      Start tracking attendance right away
                    </li>
                  </ul>
                  
                  <div className="mt-4 pt-4 border-t border-blue-500/20">
                    <div className="flex items-center gap-2 text-sm text-blue-300 mb-2">
                      <KeyRound className="h-4 w-4" />
                      <span className="font-medium">About Invitation Codes:</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      If your invitation code doesn&apos;t work, it may have been regenerated by your admin for security purposes. Contact them for the latest code.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Create Organization Tab */}
              <TabsContent value="create" className="space-y-8">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Create New Organization</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="orgName" className="text-gray-200">Organization Name *</Label>
                    <Input
                      id="orgName"
                      type="text"
                      placeholder="Enter organization name"
                      value={organizationData.name}
                      onChange={(e) => setOrganizationData({
                        ...organizationData,
                        name: e.target.value
                      })}
                      disabled={loading}
                      required
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgDescription" className="text-gray-200">Description</Label>
                    <Textarea
                      id="orgDescription"
                      placeholder="Brief description of your organization"
                      value={organizationData.description}
                      onChange={(e) => setOrganizationData({
                        ...organizationData,
                        description: e.target.value
                      })}
                      disabled={loading}
                      rows={3}
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgIndustry" className="text-gray-200">Industry Type</Label>
                    <Select
                      value={organizationData.industry}
                      onValueChange={(value) => setOrganizationData({
                        ...organizationData,
                        industry: value
                      })}
                      disabled={loading}
                    >
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500/20">
                        <SelectValue placeholder="Select industry type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600 max-h-64 overflow-y-auto">
                        {INDUSTRY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgPhone" className="text-gray-200">Phone Number</Label>
                      <Input
                        id="orgPhone"
                        type="tel"
                        placeholder="+62 xxx xxx xxxx"
                        value={organizationData.phone}
                        onChange={(e) => setOrganizationData({
                          ...organizationData,
                          phone: e.target.value
                        })}
                        disabled={loading}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgWebsite" className="text-gray-200">Website</Label>
                      <Input
                        id="orgWebsite"
                        type="url"
                        placeholder="https://example.com"
                        value={organizationData.website}
                        onChange={(e) => setOrganizationData({
                          ...organizationData,
                          website: e.target.value
                        })}
                        disabled={loading}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgAddress" className="text-gray-200">Address</Label>
                    <Textarea
                      id="orgAddress"
                      placeholder="Organization address"
                      value={organizationData.address}
                      onChange={(e) => setOrganizationData({
                        ...organizationData,
                        address: e.target.value
                      })}
                      disabled={loading}
                      rows={2}
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 resize-none"
                    />
                  </div>

                  <Button 
                    onClick={handleCreateOrganization}
                    disabled={loading || !organizationData.name.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      "Create Organization"
                    )}
                  </Button>
                </div>

                <Separator className="bg-gray-600" />

                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="h-5 w-5 text-amber-400" />
                    <span className="font-medium text-amber-300">Approval Process</span>
                    <Badge variant="outline" className="text-amber-300 border-amber-500/30 bg-amber-500/10">
                      Pending Review
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>Your organization will be created with pending status and requires admin approval:</p>
                    <ul className="mt-3 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                        Organization created but inactive initially
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                        Admin review required for activation
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                      You&apos;ll be notified once approved
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                        Full access granted after approval
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
}