"use client";



import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

  ChevronsUpDown,
  RefreshCw,

  Loader2,

  Mail,

  Phone,

  Globe,

  MapPin,

  Clock,

  Settings,

  File as FileIcon,
  Image as ImageIcon,
} from "@/components/icons/lucide-exports";

import { getCurrentUserOrganization, updateOrganization, regenerateInviteCode, OrganizationUpdateData } from "@/action/organization-settings";

import { INDUSTRY_OPTIONS, findIndustryValue, getIndustryLabel } from "@/lib/constants/industries";

import { useImageCompression } from "@/hooks/use-image-compression";

import { organizationLogger } from '@/lib/logger';

import { cn } from "@/lib/utils";
import type { GeoCountry, GeoCity } from "@/types/geo";
import OrganizationSettingsLoading from "./loading";
// Removed debug imports - functions moved inline


// Helper functions for geo data
const getStateLabelFromGeo = (geoData: GeoCountry | null, value: string | null): string => {
  if (!geoData || !value) return "";
  const state = geoData.states.find((s) => s.value === value);
  return state?.label ?? "";
};

const getCityLabelFromGeo = (geoData: GeoCountry | null, value: string | null): string => {
  if (!geoData || !value) return "";
  for (const state of geoData.states) {
    const city = state.cities.find((c) => c.value === value);
    if (city) return city.label;
  }
  return "";
};

const normalizeStateValue = (geoData: GeoCountry | null, input: string | null): string => {
  if (!geoData || !input) return "";
  const normalized = input.trim().toLowerCase();
  const match = geoData.states.find(
    (s) => s.value.toLowerCase() === normalized || s.label.toLowerCase() === normalized
  );
  return match?.value ?? "";
};

const normalizeCityValue = (geoData: GeoCountry | null, input: string | null, stateValue: string): string => {
  if (!geoData || !input || !stateValue) return "";
  const state = geoData.states.find((s) => s.value === stateValue);
  if (!state) return "";
  const normalized = input.trim().toLowerCase();
  const match = state.cities.find(
    (c) => c.value.toLowerCase() === normalized || c.label.toLowerCase() === normalized
  );
  return match?.value ?? "";
};


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
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [regenerating, setRegenerating] = useState(false);

  const [showInviteCode, setShowInviteCode] = useState(false);

  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);

  const [orgData, setOrgData] = useState<OrganizationData | null>(null);

  const [formData, setFormData] = useState<{

    name: string;

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

  const [geoData, setGeoData] = useState<GeoCountry | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const geoCacheRef = useRef<Record<string, GeoCountry>>({});
  const selectedCountry = (formData.country_code || "ID").toUpperCase();
  const stateOptions = geoData?.states ?? [];
  const cityOptions = useMemo<GeoCity[]>(() => {
    if (!geoData) return [];
    if (!formData.state_province) return [];
    const state = geoData.states.find((s) => s.value === formData.state_province);
    return state ? state.cities : [];
  }, [geoData, formData.state_province]);
  const stateLabel = useMemo(
    () => getStateLabelFromGeo(geoData, formData.state_province),
    [geoData, formData.state_province],
  );
  const cityLabel = useMemo(
    () => getCityLabelFromGeo(geoData, formData.city),
    [geoData, formData.city],
  );
  const fetchGeoData = useCallback(
    async (countryCode: string) => {
      const key = (countryCode || "ID").toUpperCase();
      if (geoCacheRef.current[key]) {
        setGeoData(geoCacheRef.current[key]);
        return geoCacheRef.current[key];
      }

      setGeoLoading(true);
      try {
        const response = await fetch(`/api/geo/${key}`);
        if (!response.ok) {
          throw new Error("Failed to fetch geo data");
        }
        const data: GeoCountry = await response.json();
        geoCacheRef.current[key] = data;
        setGeoData(data);
        return data;
      } catch (error) {
        organizationLogger.error("Geo data error:", error);
        toast.error("Failed to load geographic data");
        return null;
      } finally {
        setGeoLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchGeoData(selectedCountry);
  }, [selectedCountry, fetchGeoData]);
  
  
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

          const countryCode = (data.country_code || "ID").toUpperCase();
          const geo = await fetchGeoData(countryCode);
          const normalizedState = normalizeStateValue(geo, data.state_province);
          const normalizedCity = normalizeCityValue(geo, data.city, normalizedState);

          setFormData({

            name: data.name || "",

            description: data.description || "",

            address: data.address || "",

            city: normalizedCity,
            state_province: normalizedState,
            postal_code: data.postal_code || "",

            phone: data.phone || "",

            website: data.website || "",

            email: data.email || "",

            timezone: data.timezone || "UTC",

            currency_code: data.currency_code || "USD",

            country_code: countryCode,
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      organizationLogger.debug(`Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${compressionResult.compressionRatio}% reduction)`);

      organizationLogger.debug('Original filename preserved:', compressedFile.name);

    } catch (error) {

      organizationLogger.error('Compression error:', error);

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

      organizationLogger.debug('Uploading file:', {

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

        organizationLogger.warn('Invalid or missing filename, creating random fallback');

        const extension = file.type.split('/')[1] || 'jpg';

        const timestamp = Date.now();

        const randomId = Math.random().toString(36).substring(2, 15);

        fileNameToUse = `logo-${timestamp}-${randomId}.${extension}`;

        organizationLogger.debug('Generated fallback filename:', fileNameToUse);

      }

      
      
      try {

        // Generate logo path: organization/org_{id}_{filename}

        const orgId = orgData?.id || 0

        fileName = `organization/org_${orgId}_${fileNameToUse}`;

      } catch (error) {

        organizationLogger.error('Error generating file path:', error);

        toast.error('Invalid file name. Please choose another file.');

        return null;

      }

      
      
      // Delete old logo first if it exists

      if (orgData?.logo_url) {

        organizationLogger.debug('Deleting old logo before uploading new one...');

        const deleteResult = await deleteOldLogo(orgData.logo_url);

        if (deleteResult) {

          organizationLogger.debug('Old logo deleted successfully');

        }

        // Continue with upload even if deletion fails

      }

      
      
      // Upload new logo

      const { error } = await supabase.storage

        .from('logo')

        .upload(fileName, file, { upsert: true });
      
      
      
      if (error) {

        organizationLogger.error('Upload error:', error);

        toast.error(`Upload failed: ${error.message}`);

        return null;

      }

      
      
      // Get public URL

      const { data: publicUrlData } = supabase.storage

        .from('logo')

        .getPublicUrl(fileName);
      
      
      
      return publicUrlData.publicUrl;

    } catch (error) {

      organizationLogger.error('Upload logo error:', error);

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

        legal_name: formData.name, // Sync legal_name with name

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

        // Invalidate organization query cache for immediate update across all components
        queryClient.invalidateQueries({ queryKey: ['organization', 'full-data'] });

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

    return <OrganizationSettingsLoading />;
  }



  return (

    <div className="flex flex-1 flex-col">
      <div className="max-w-5xl mx-auto p-6 w-full">
        <div className="space-y-4">

          {/* Organization Overview */}
          <Card className="border shadow-sm">
            <CardContent className="p-6 space-y-4">
              {/* Header - Bagian Kiri Atas */}
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Logo */}
                <div className="shrink-0">
                  {logoPreview || orgData?.logo_url ? (
                    <div className="w-24 h-24 rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center">
                      <img 
                        src={logoPreview || orgData?.logo_url || ''} 
                        alt={`${orgData?.name || 'Organization'} logo`}
                        className="block w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Organization Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold">{orgData?.name || 'Organization'}</h1>
                    <Badge 
                      variant="secondary"
                      className={
                        orgData?.is_active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-400/30"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200 border border-amber-200 dark:border-amber-400/30"
                      }
                    >
                      {orgData?.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  {orgData?.industry && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Category: {getIndustryLabel(orgData.industry)}</span>
                    </div>
                  )}

                  {/* Created Date - DI BAWAH nama organisasi */}
                  {orgData?.created_at && (
                    <p className="text-sm opacity-70">
                      Created: {new Date(orgData.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Invitation Code Card - Full Width */}
              <div 
                className="rounded-xl p-4 space-y-3 w-full"
                style={{
                  background: '#18181b',
                  border: '1px solid #27272a'
                }}
              >
                {/* Label */}
                <Label className="text-base font-semibold text-foreground">
                  Invitation Code
                </Label>

                {/* Code Box */}
                <div className="px-3 py-2 bg-background border border-border rounded-md">
                  <code className="text-sm font-mono tracking-wider text-foreground">
                    {showInviteCode ? orgData?.inv_code : "••••••••"}
                  </code>
                </div>

                {/* Icon Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowInviteCode(!showInviteCode)}
                    className="h-9 w-9 p-0 hover:bg-muted"
                  >
                    {showInviteCode ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyInviteCode}
                    disabled={!showInviteCode}
                    className="h-9 w-9 p-0 hover:bg-muted"
                    title="Copy invitation code"
                  >
                    {inviteCodeCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <ClipboardCheck className="h-4 w-4" />
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={regenerating}
                        className="h-9 w-9 p-0 hover:bg-muted"
                        title="Generate new invitation code"
                      >
                        {regenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate invite code?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will deactivate the current invitation code immediately. New members must use the new code.
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
            </CardContent>
          </Card>

          {/* Organization Information */}
          {/* Organization Information */}

        <Card className="border shadow-sm">

          <CardHeader className="pb-4">

            <CardTitle className="flex items-center gap-2 text-xl">

              <Settings className="h-5 w-5 text-primary" />

              Organization Information

            </CardTitle>

          <CardDescription>

            Update your organization&apos;s basic information and contact details

          </CardDescription>

        </CardHeader>

          <CardContent className="space-y-8">

            {/* Logo Upload Section */}

            <div className="flex flex-col items-start">

              <Label htmlFor="logo" className="text-base font-semibold mb-3">
                Organization Logo

              </Label>

              
              
              {/* Logo Preview Frame */}

              {logoPreview ? (

                <div className="w-[120px] h-[120px] rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                  <img 

                    src={logoPreview} 

                    alt={`${orgData?.name || 'Organization'} logo preview`}

                    className="block w-full h-full object-cover"
                  />

                </div>

              ) : (

                <div className="w-[120px] h-[120px] rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                </div>

              )}



              {/* Upload Button */}

              <div className="mt-3">
                <Input

                  id="logo"

                  type="file"

                  accept="image/*"

                  onChange={handleLogoChange}

                  className="hidden"

                />

                <Button

                  type="button"

                  size="sm"

                  variant="secondary"
                  onClick={() => document.getElementById('logo')?.click()}

                  disabled={isCompressing}

                  className="px-4 py-2 text-sm flex items-center gap-2"
                >

                  {isCompressing ? (

                    <>

                      <Loader2 className="h-4 w-4 animate-spin" />

                      Processing...

                    </>

                  ) : (

                    <>

                      <Upload className="h-4 w-4" />

                      {logoPreview ? 'Change Logo' : 'Upload Logo'}

                    </>

                  )}

                </Button>

              </div>



              {/* Format Info Text */}

              <p className="mt-4 text-sm text-muted-foreground">
                Supported formats: JPG, PNG, WEBP, GIF (max 5MB)

              </p>



              {/* Error Message */}

                {compressionError && (

                <p className="mt-2 text-sm text-destructive">
                    {compressionError}

                  </p>

                )}

              </div>



            <Separator />



            {/* Basic Information */}

            <div className="space-y-4">

              <div className="flex items-center gap-2 mb-4">

                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-semibold">Basic Information</Label>

          </div>



              <div className="space-y-4">

          <div className="space-y-2">

                  <Label htmlFor="name" className="text-sm font-medium">

                    Organization Name <span className="text-destructive">*</span>

                  </Label>

            <Input

              id="name"

              value={formData.name}

              onChange={(e) => setFormData({...formData, name: e.target.value})}

              placeholder="Enter organization name"

                    className="h-10"

            />

            <p className="text-xs text-muted-foreground">

              This will be used as both display name and legal name

            </p>

          </div>



            <div className="space-y-2">

                  <Label htmlFor="description" className="text-sm font-medium">

                    Description

                  </Label>

                  <Textarea

                    id="description"

                    value={formData.description}

                    onChange={(e) => setFormData({...formData, description: e.target.value})}

                    placeholder="Brief description of your organization"

                    rows={3}

                    className="resize-none"

                  />

                </div>



                <div className="space-y-2">

                  <Label htmlFor="industry" className="text-sm font-medium">

                    Industry

                  </Label>

                  <Select 

                    value={formData.industry || ""} 

                    onValueChange={(value) => setFormData({...formData, industry: value})}

                  >

                    <SelectTrigger className="h-10">

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

            </div>



            <Separator />



            {/* Contact Information */}

            <div className="space-y-4">

              <div className="flex items-center gap-2 mb-4">

                <Phone className="h-4 w-4 text-muted-foreground" />

                <Label className="text-base font-semibold">Contact Information</Label>

              </div>

              
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-2">

                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">

                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />

                    Email Address

                  </Label>

              <Input

                id="email"

                type="email"

                value={formData.email}

                onChange={(e) => setFormData({...formData, email: e.target.value})}

                placeholder="info@company.com"

                    className="h-10"

              />

            </div>



            <div className="space-y-2">

                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">

                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />

                    Phone Number

                  </Label>

              <Input

                id="phone"

                type="tel"

                value={formData.phone}

                onChange={(e) => setFormData({...formData, phone: e.target.value})}

                placeholder="+62 21 1234 5678"

                    className="h-10"

              />

          </div>



                <div className="space-y-2 md:col-span-2">

                  <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">

                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />

                    Website

                  </Label>

              <Input

                id="website"

                type="url"

                value={formData.website}

                onChange={(e) => setFormData({...formData, website: e.target.value})}

                placeholder="https://company.com"

                    className="h-10"

              />

            </div>

            </div>

          </div>



            <Separator />



            {/* Location Information */}

            <div className="space-y-4">

              <div className="flex items-center gap-2 mb-4">

                <MapPin className="h-4 w-4 text-muted-foreground" />

                <Label className="text-base font-semibold">Location Information</Label>

          </div>



              <div className="space-y-4">

          <div className="space-y-2">

                  <Label htmlFor="address" className="text-sm font-medium">

                    Address

                  </Label>

            <Textarea

              id="address"

              value={formData.address}

              onChange={(e) => setFormData({...formData, address: e.target.value})}

              placeholder="Full organization address"

              rows={2}

                    className="resize-none"

            />

          </div>



                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="space-y-2">

                    <Label htmlFor="city" className="text-sm font-medium">

                      City

                    </Label>

                    <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={cityPopoverOpen}
                          className="h-10 w-full justify-between"
                          disabled={cityOptions.length === 0 || !formData.state_province || geoLoading}
                        >
                          {cityLabel || "Select city..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search city..." />
                          <CommandList>
                            <CommandEmpty>
                              {geoLoading ? "Loading..." : cityOptions.length === 0 ? "Select a province first" : "No city found."}
                            </CommandEmpty>
                            <CommandGroup>
                              {cityOptions.map((city) => (
                                <CommandItem
                                  key={city.value}
                                  value={city.value}
                                  onSelect={() => {
                                    setFormData({
                                      ...formData,
                                      city: city.value,
                                    });
                                    setCityPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.city === city.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                            {city.label}

                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
            </div>



            <div className="space-y-2">

                    <Label htmlFor="state_province" className="text-sm font-medium">

                      State/Province

                    </Label>

                    <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={statePopoverOpen}
                          className="h-10 w-full justify-between"
                          disabled={stateOptions.length === 0 || geoLoading}
                        >
                          {stateLabel || "Select province..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search province..." />
                          <CommandList>
                            <CommandEmpty>
                              {geoLoading ? "Loading..." : "No province found."}
                            </CommandEmpty>
                            <CommandGroup>
                              {stateOptions.map((state) => (
                                <CommandItem
                                  key={state.value}
                                  value={state.value}
                                  onSelect={() => {
                                    setFormData({
                                      ...formData,
                                      state_province: state.value,
                                      city: "",
                                    });
                                    setStatePopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.state_province === state.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {state.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
            </div>



            <div className="space-y-2">

                    <Label htmlFor="postal_code" className="text-sm font-medium">

                      Postal Code

                    </Label>

                    <div className="w-24">

              <Input

                id="postal_code"

                value={formData.postal_code}

                onChange={(e) => setFormData({...formData, postal_code: e.target.value})}

                placeholder="Postal code"

                        className="h-10"

                        maxLength={10}

              />

                    </div>

                  </div>

                </div>

            </div>

          </div>



            <Separator />



            {/* Regional Settings */}

            <div className="space-y-4">

              <div className="flex items-center gap-2 mb-4">

                <Clock className="h-4 w-4 text-muted-foreground" />

                <Label className="text-base font-semibold">Regional Settings</Label>

              </div>

              
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="space-y-2">

                  <Label htmlFor="country_code" className="text-sm font-medium">

                    Country

                  </Label>

              <Select
                value={formData.country_code}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    country_code: value,
                    city: "",
                    state_province: "",
                  })
                }
              >
                    <SelectTrigger className="h-10">

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

                  <Label htmlFor="timezone" className="text-sm font-medium">

                    Timezone

                  </Label>

              <Select value={formData.timezone} onValueChange={(value) => setFormData({...formData, timezone: value})}>

                    <SelectTrigger className="h-10">

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

                  <Label htmlFor="time_format" className="text-sm font-medium">

                    Time Format

                  </Label>

              <Select value={formData.time_format} onValueChange={(value: '12h' | '24h') => setFormData({...formData, time_format: value})}>

                    <SelectTrigger className="h-10">

                  <SelectValue placeholder="Select time format" />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="12h">12-Hour Format (AM/PM)</SelectItem>

                  <SelectItem value="24h">24-Hour Format</SelectItem>

                </SelectContent>

              </Select>

            </div>



            <div className="space-y-2">

                  <Label htmlFor="currency" className="text-sm font-medium">

                    Currency

                  </Label>

              <Select value={formData.currency_code} onValueChange={(value) => setFormData({...formData, currency_code: value})}>

                    <SelectTrigger className="h-10">

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

            </div>

        </CardContent>

      </Card>



      {/* Save Button */}

        <div className="flex justify-end gap-3 pt-4">

          <Button 

            onClick={handleSave} 

            disabled={saving}

            size="lg"

            className="min-w-[160px] gap-2 px-6 py-3 text-base font-semibold rounded-xl text-white border shadow-[0_6px_18px_rgba(0,0,0,0.35)] hover:brightness-110 active:brightness-90 disabled:opacity-60"

            style={{ backgroundColor: "#2b2b2b", borderColor: "#3c3c3c" }}

          >

          {saving ? (

            <>

                <Loader2 className="h-4 w-4 animate-spin text-white" />

              Saving...

            </>

          ) : (

            <>

                <Save className="h-4 w-4 text-white" />

                Save

            </>

          )}

        </Button>
        </div>
        </div>
      </div>
    </div>

  );

}
