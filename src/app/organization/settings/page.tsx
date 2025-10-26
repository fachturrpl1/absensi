"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Building2,
  Save,
  Eye,
  EyeOff,
  ClipboardCheck,
  Check,
  Upload,
  Image,
  RefreshCw,
  Loader2,
} from "@/components/icons/lucide-exports";
import { getCurrentUserOrganization, updateOrganization, regenerateInviteCode, OrganizationUpdateData } from "@/action/organization-settings";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import { INDUSTRY_OPTIONS, findIndustryValue, getIndustryLabel } from "@/lib/constants/industries";
import { useImageCompression } from "@/hooks/use-image-compression";
// Removed debug imports - functions moved inline

interface OrganizationData {
  id: number;
  code: string;
  name: string;
  legal_name: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  logo_url: string | null;
  inv_code: string;
  is_active: boolean;
  timezone: string | null;
  currency_code: string | null;
  country_code: string;
  industry: string | null;
  time_format: '12h' | '24h';
  created_at: string;
  updated_at: string;
}

export default function OrganizationSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);
  const [orgData, setOrgData] = useState<OrganizationData | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    legal_name: string;
    description: string;
    address: string;
    city: string;
    state_province: string;
    postal_code: string;
    phone: string;
    website: string;
    email: string;
    timezone: string;
    currency_code: string;
    country_code: string;
    industry: string;
    time_format: '12h' | '24h';
  }>({
    name: "",
    legal_name: "",
    description: "",
    address: "",
    city: "",
    state_province: "",
    postal_code: "",
    phone: "",
    website: "",
    email: "",
    timezone: "UTC",
    currency_code: "USD",
    country_code: "ID",
    industry: "",
    time_format: "24h"
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Image compression hook
  const { 
    compressImage, 
    isCompressing, 
    error: compressionError,
    validateFile 
  } = useImageCompression({ preset: 'standard' });

  // Fetch real organization data
  useEffect(() => {
    const fetchOrganizationData = async () => {
      setLoading(true);
      try {
        const result = await getCurrentUserOrganization();
        
        if (result.success && result.data) {
          const data = result.data;
          setOrgData(data as OrganizationData);
          setFormData({
            name: data.name || "",
            legal_name: data.legal_name || "",
            description: data.description || "",
            address: data.address || "",
            city: data.city || "",
            state_province: data.state_province || "",
            postal_code: data.postal_code || "",
            phone: data.phone || "",
            website: data.website || "",
            email: data.email || "",
            timezone: data.timezone || "UTC",
            currency_code: data.currency_code || "USD",
            country_code: data.country_code || "ID",
            industry: findIndustryValue(data.industry), // Normalize industry value
            time_format: data.time_format || '24h'
          });
          setLogoPreview(data.logo_url);
        } else {
          toast.error(result.message || "Failed to load organization data");
        }
      } catch {
        toast.error("An error occurred while loading organization data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, []);

  // Handle logo file selection with compression
  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate file first
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }

      // Show upload progress
      toast.info('Upload logo...');
      
      // Compress the image
      const compressionResult = await compressImage(file);
      if (!compressionResult) {
        toast.error('Failed to process image');
        return;
      }

      // Preserve original filename in compressed file
      const compressedFile = new File([compressionResult.file], file.name, {
        type: compressionResult.file.type,
        lastModified: Date.now(),
      });

      // Update state with compressed file (with preserved filename)
      setLogoFile(compressedFile);
      setLogoPreview(compressionResult.dataUrl || '');
      
      // Show success without compression details
      toast.success('Logo ready to upload');
      
      // Optional: Log compression info to console for debugging
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedSizeMB = (compressionResult.compressedSize / (1024 * 1024)).toFixed(2);
      console.log(`Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${compressionResult.compressionRatio}% reduction)`);
      console.log('Original filename preserved:', compressedFile.name);
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Failed to process image. Please try again.');
    }
  };

  // Upload logo to storage with correct bucket structure
  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      // Helper function to delete old logo
      const deleteOldLogo = async (logoUrl: string) => {
        if (!logoUrl) return { success: false, message: 'No logo URL provided' }
        
        try {
          const filePath = logoUrl.split('/').pop()
          if (!filePath) return { success: false, message: 'Invalid logo URL' }
          
          const { createClient } = await import('@/utils/supabase/client')
          const supabase = createClient()
          
          const { error } = await supabase.storage
            .from('logo')
            .remove([`organization/${filePath}`])
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true, message: 'Logo deleted' }
        } catch (error) {
          return { success: false, message: String(error) }
        }
      }
      const supabase = createClient();
      
      // Debug: Log file details
      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      
      // Create file name with safeguards and fallback
      let fileName;
      let fileNameToUse = file.name;
      
      // Fallback if filename is missing or invalid
      if (!fileNameToUse || typeof fileNameToUse !== 'string' || fileNameToUse.trim() === '') {
        console.warn('Invalid or missing filename, creating random fallback');
        const extension = file.type.split('/')[1] || 'jpg';
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        fileNameToUse = `logo-${timestamp}-${randomId}.${extension}`;
        console.log('Generated fallback filename:', fileNameToUse);
      }
      
      try {
        // Generate logo path: organization/org_{id}_{filename}
        const orgId = orgData?.id || 0
        fileName = `organization/org_${orgId}_${fileNameToUse}`;
      } catch (error) {
        console.error('Error generating file path:', error);
        toast.error('Invalid file name. Please choose another file.');
        return null;
      }
      
      // Delete old logo first if it exists
      if (orgData?.logo_url) {
        console.log('Deleting old logo before uploading new one...');
        const deleteResult = await deleteOldLogo(orgData.logo_url);
        if (deleteResult) {
          console.log('Old logo deleted successfully');
        }
        // Continue with upload even if deletion fails
      }
      
      // Upload new logo
      const { error } = await supabase.storage
        .from('logo')
        .upload(fileName, file, { upsert: true });
      
      if (error) {
        console.error('Upload error:', error);
        toast.error(`Upload failed: ${error.message}`);
        return null;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('logo')
        .getPublicUrl(fileName);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Upload logo error:', error);
      toast.error('Failed to upload logo. Please try again.');
      return null;
    }
  };

  const handleSave = async () => {
    if (!orgData) {
      toast.error("No organization data available");
      return;
    }

    setSaving(true);
    try {
      let logoUrl = orgData?.logo_url;
      
      // Upload logo if new file is selected
      if (logoFile) {
        const uploadedUrl = await uploadLogo(logoFile);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        } else {
          toast.error("Failed to upload logo");
          setSaving(false);
          return;
        }
      }
      
      const updateData: OrganizationUpdateData = {
        name: formData.name,
        legal_name: formData.legal_name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state_province: formData.state_province,
        postal_code: formData.postal_code,
        phone: formData.phone,
        website: formData.website,
        email: formData.email,
        timezone: formData.timezone,
        currency_code: formData.currency_code,
        country_code: formData.country_code,
        industry: formData.industry,
        logo_url: logoUrl,
        time_format: formData.time_format
      };
      
      const result = await updateOrganization(updateData);
      
      if (result.success) {
        toast.success("Organization settings updated successfully!");
        // Reset logo file after successful upload
        setLogoFile(null);
        // Refresh organization data
        const refreshResult = await getCurrentUserOrganization();
        if (refreshResult.success && refreshResult.data) {
          setOrgData(refreshResult.data as OrganizationData);
        }
      } else {
        toast.error(result.message || "Failed to update organization settings");
      }
    } catch {
      toast.error("An error occurred while updating organization settings");
    } finally {
      setSaving(false);
    }
  };

  const copyInviteCode = async () => {
    if (orgData?.inv_code) {
      await navigator.clipboard.writeText(orgData.inv_code);
      setInviteCodeCopied(true);
      toast.success("Invite code copied to clipboard!");
      setTimeout(() => setInviteCodeCopied(false), 2000);
    }
  };

  const handleRegenerateInviteCode = async () => {
    setRegenerating(true);
    try {
      const result = await regenerateInviteCode();
      
        if (result.success) {
        toast.success(result.message);
        // Refresh organization data to get the new invite code
        const refreshResult = await getCurrentUserOrganization();
        if (refreshResult.success && refreshResult.data) {
          const refreshed = refreshResult.data as Partial<OrganizationData>;
          setOrgData({
            ...(refreshResult.data as OrganizationData),
            time_format: refreshed.time_format || '24h'
          });
        }
      } else {
        toast.error(result.message || "Failed to regenerate invitation code");
      }
    } catch {
      toast.error("An error occurred while regenerating invitation code");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading organization settings...</p>
        </div>
      </div>
    );
  }

  return (
    <ContentLayout title="Organization Settings">
      <div className="space-y-6">

      {/* Organization Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Status</p>
            <p className="text-muted-foreground">Your organization&apos;s current activation status</p>
            </div>
            <Badge variant={orgData?.is_active ? "default" : "secondary"}>
              {orgData?.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Invitation Code</p>
                <p className="text-sm text-muted-foreground">Share this code to invite new members</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                  {showInviteCode ? orgData?.inv_code : "••••••••"}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowInviteCode(!showInviteCode)}
                >
                  {showInviteCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyInviteCode}
                  disabled={!showInviteCode}
                >
                  {inviteCodeCopied ? <Check className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={regenerating}
                      title="Generate new invitation code"
                    >
                      {regenerating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Regenerate invite code?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will deactivate the current invitation code immediately. New members must use the new
                        code.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={regenerating}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegenerateInviteCode} disabled={regenerating}>
                        {regenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          "Yes, regenerate"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Created</p>
                <p className="text-sm text-muted-foreground">Organization creation date</p>
              </div>
              <p className="text-sm">
                {orgData?.created_at ? new Date(orgData.created_at).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>
            Update your organization&apos;s basic information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Organization Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="w-16 h-16 rounded-lg border overflow-hidden bg-gray-50">
                  <img 
                    src={logoPreview} 
                    alt="Organization logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border bg-gray-50 flex items-center justify-center">
                  <Image className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo')?.click()}
                  disabled={isCompressing}
                >
                  {isCompressing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upload logo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: JPG, PNG, WEBP, GIF (max 5MB)
                </p>
                {compressionError && (
                  <p className="text-xs text-red-500 mt-1">
                    {compressionError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_name">Legal Name</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData({...formData, legal_name: e.target.value})}
                placeholder="Legal business name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="info@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+62 21 1234 5678"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                placeholder="https://company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select 
                value={formData.industry || ""} 
                onValueChange={(value) => setFormData({...formData, industry: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry type">
                    {formData.industry ? getIndustryLabel(formData.industry) : "Select industry type"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {INDUSTRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief description of your organization"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Full organization address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state_province">State/Province</Label>
              <Input
                id="state_province"
                value={formData.state_province}
                onChange={(e) => setFormData({...formData, state_province: e.target.value})}
                placeholder="State or Province"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                placeholder="Postal code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="country_code">Country</Label>
              <Select value={formData.country_code} onValueChange={(value) => setFormData({...formData, country_code: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ID">Indonesia</SelectItem>
                  <SelectItem value="MY">Malaysia</SelectItem>
                  <SelectItem value="SG">Singapore</SelectItem>
                  <SelectItem value="TH">Thailand</SelectItem>
                  <SelectItem value="PH">Philippines</SelectItem>
                  <SelectItem value="VN">Vietnam</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData({...formData, timezone: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {/* Indonesia */}
                  <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</SelectItem>
                  <SelectItem value="Asia/Makassar">Asia/Makassar (WITA, UTC+8)</SelectItem>
                  <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</SelectItem>
                  <SelectItem value="Asia/Pontianak">Asia/Pontianak (WIB, UTC+7)</SelectItem>
                  
                  {/* Asia */}
                  <SelectItem value="Asia/Singapore">Asia/Singapore (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Bangkok">Asia/Bangkok (UTC+7)</SelectItem>
                  <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</SelectItem>
                  <SelectItem value="Asia/Manila">Asia/Manila (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Taipei">Asia/Taipei (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Seoul">Asia/Seoul (UTC+9)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Asia/Shanghai (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                  <SelectItem value="Asia/Riyadh">Asia/Riyadh (UTC+3)</SelectItem>
                  <SelectItem value="Asia/Qatar">Asia/Qatar (UTC+3)</SelectItem>
                  <SelectItem value="Asia/Kuwait">Asia/Kuwait (UTC+3)</SelectItem>
                  <SelectItem value="Asia/Bahrain">Asia/Bahrain (UTC+3)</SelectItem>
                  <SelectItem value="Asia/Muscat">Asia/Muscat (UTC+4)</SelectItem>
                  <SelectItem value="Asia/Tehran">Asia/Tehran (UTC+3:30)</SelectItem>
                  <SelectItem value="Asia/Karachi">Asia/Karachi (UTC+5)</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</SelectItem>
                  <SelectItem value="Asia/Dhaka">Asia/Dhaka (UTC+6)</SelectItem>
                  <SelectItem value="Asia/Yangon">Asia/Yangon (UTC+6:30)</SelectItem>
                  <SelectItem value="Asia/Colombo">Asia/Colombo (UTC+5:30)</SelectItem>
                  
                  {/* Europe */}
                  <SelectItem value="Europe/London">Europe/London (UTC+0/+1)</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Amsterdam">Europe/Amsterdam (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Rome">Europe/Rome (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Madrid">Europe/Madrid (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Zurich">Europe/Zurich (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Vienna">Europe/Vienna (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Stockholm">Europe/Stockholm (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Oslo">Europe/Oslo (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Copenhagen">Europe/Copenhagen (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Helsinki">Europe/Helsinki (UTC+2/+3)</SelectItem>
                  <SelectItem value="Europe/Warsaw">Europe/Warsaw (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Prague">Europe/Prague (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Budapest">Europe/Budapest (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Moscow">Europe/Moscow (UTC+3)</SelectItem>
                  <SelectItem value="Europe/Istanbul">Europe/Istanbul (UTC+3)</SelectItem>
                  
                  {/* Americas */}
                  <SelectItem value="America/New_York">America/New_York (UTC-5/-4)</SelectItem>
                  <SelectItem value="America/Chicago">America/Chicago (UTC-6/-5)</SelectItem>
                  <SelectItem value="America/Denver">America/Denver (UTC-7/-6)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles (UTC-8/-7)</SelectItem>
                  <SelectItem value="America/Toronto">America/Toronto (UTC-5/-4)</SelectItem>
                  <SelectItem value="America/Vancouver">America/Vancouver (UTC-8/-7)</SelectItem>
                  <SelectItem value="America/Mexico_City">America/Mexico_City (UTC-6/-5)</SelectItem>
                  <SelectItem value="America/Sao_Paulo">America/Sao_Paulo (UTC-3/-2)</SelectItem>
                  <SelectItem value="America/Buenos_Aires">America/Buenos_Aires (UTC-3)</SelectItem>
                  <SelectItem value="America/Lima">America/Lima (UTC-5)</SelectItem>
                  <SelectItem value="America/Bogota">America/Bogota (UTC-5)</SelectItem>
                  <SelectItem value="America/Caracas">America/Caracas (UTC-4)</SelectItem>
                  <SelectItem value="America/Santiago">America/Santiago (UTC-4/-3)</SelectItem>
                  
                  {/* Australia & Oceania */}
                  <SelectItem value="Australia/Sydney">Australia/Sydney (UTC+10/+11)</SelectItem>
                  <SelectItem value="Australia/Melbourne">Australia/Melbourne (UTC+10/+11)</SelectItem>
                  <SelectItem value="Australia/Brisbane">Australia/Brisbane (UTC+10)</SelectItem>
                  <SelectItem value="Australia/Perth">Australia/Perth (UTC+8)</SelectItem>
                  <SelectItem value="Australia/Adelaide">Australia/Adelaide (UTC+9:30/+10:30)</SelectItem>
                  <SelectItem value="Australia/Darwin">Australia/Darwin (UTC+9:30)</SelectItem>
                  <SelectItem value="Pacific/Auckland">Pacific/Auckland (UTC+12/+13)</SelectItem>
                  <SelectItem value="Pacific/Fiji">Pacific/Fiji (UTC+12/+13)</SelectItem>
                  <SelectItem value="Pacific/Honolulu">Pacific/Honolulu (UTC-10)</SelectItem>
                  
                  {/* Africa */}
                  <SelectItem value="Africa/Cairo">Africa/Cairo (UTC+2)</SelectItem>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (UTC+1)</SelectItem>
                  <SelectItem value="Africa/Casablanca">Africa/Casablanca (UTC+0/+1)</SelectItem>
                  <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (UTC+2)</SelectItem>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi (UTC+3)</SelectItem>
                  <SelectItem value="Africa/Algiers">Africa/Algiers (UTC+1)</SelectItem>
                  
                  {/* UTC */}
                  <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                  <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_format">Time Format</Label>
              <Select value={formData.time_format} onValueChange={(value: '12h' | '24h') => setFormData({...formData, time_format: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-Hour Format (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-Hour Format</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency_code} onValueChange={(value) => setFormData({...formData, currency_code: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                  <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
      </div>
    </ContentLayout>
  );
}