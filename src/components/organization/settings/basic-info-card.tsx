"use client";

// src/components/organization/settings/BasicInfoCard.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "@/components/icons/lucide-exports";

import { LogoUploader } from "./logo-upload";
import { INDUSTRY_OPTIONS } from "@/lib/constants/industries";
import type { OrgSettingsFormData } from "@/types/organization/org-settings";

interface BasicInfoCardProps {
  formData: OrgSettingsFormData;
  onChange: (updates: Partial<OrgSettingsFormData>) => void;
  // Logo
  logoPreview: string | null;
  orgName?: string;
  isCompressing: boolean;
  compressionError: string | null | undefined;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BasicInfoCard({
  formData,
  onChange,
  logoPreview,
  orgName,
  isCompressing,
  compressionError,
  onLogoChange,
}: BasicInfoCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          Basic Information
        </CardTitle>
        <CardDescription>Organization name, logo, and general details</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Logo */}
        <LogoUploader
          logoPreview={logoPreview}
          orgName={orgName}
          isCompressing={isCompressing}
          compressionError={compressionError}
          onChange={onLogoChange}
        />

        <Separator />

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="org-name" className="text-sm font-medium">
            Organization Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="org-name"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Enter organization name"
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">
            This will be used as both display name and legal name
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="org-description" className="text-sm font-medium">
            Description
          </Label>
          <Textarea
            id="org-description"
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Brief description of your organization"
            className="min-h-20 resize-none"
          />
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="org-industry" className="text-sm font-medium">
            Industry
          </Label>
          <Select
            value={formData.industry}
            onValueChange={(value) => onChange({ industry: value })}
          >
            <SelectTrigger id="org-industry" className="h-10">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}