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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Building2, Check, ChevronsUpDown, X } from "@/components/icons/lucide-exports";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  const [industryPopoverOpen, setIndustryPopoverOpen] = useState(false);
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

        <div className="space-y-3">
          <Label htmlFor="org-industry" className="text-sm font-medium">
            Industry (Max 10)
          </Label>
          <Popover open={industryPopoverOpen} onOpenChange={setIndustryPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={industryPopoverOpen}
                className="w-full justify-between h-10 font-normal"
                disabled={formData.industry.length >= 10 && !industryPopoverOpen}
              >
                <span className="text-muted-foreground">Select industries...</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search industry..." />
                <CommandEmpty>No industry found.</CommandEmpty>
                <CommandList className="max-h-72">
                  <CommandGroup>
                    {INDUSTRY_OPTIONS.map((option) => {
                      const isSelected = formData.industry.includes(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          disabled={!isSelected && formData.industry.length >= 10}
                          onSelect={() => {
                            const newIndustries = isSelected
                              ? formData.industry.filter((i) => i !== option.value)
                              : [...formData.industry, option.value];
                            
                            if (newIndustries.length <= 10) {
                              onChange({ industry: newIndustries });
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Selected Industries Badges */}
          {formData.industry.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {formData.industry.map((val) => {
                const option = INDUSTRY_OPTIONS.find((opt) => opt.value === val);
                if (!option) return null;
                return (
                  <Badge
                    key={val}
                    variant="secondary"
                    className="flex items-center gap-1 pl-2 pr-1 py-1 text-xs"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={() => {
                        onChange({
                          industry: formData.industry.filter((i) => i !== val),
                        });
                      }}
                      className="rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}