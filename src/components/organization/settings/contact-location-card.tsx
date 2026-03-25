"use client";

// src/components/organization/settings/ContactLocationCard.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Phone,
  Mail,
  Globe,
  Check,
  ChevronsUpDown,
} from "@/components/icons/lucide-exports";
import { cn } from "@/lib/utils";
import { useState } from "react";

import type { OrgSettingsFormData, GeoState, GeoCity } from "@/types/organization/org-settings";

// Country list — statis, tidak perlu API (hanya beberapa negara SEA)
const COUNTRY_OPTIONS = [
  { value: "ID", label: "Indonesia" },
  { value: "MY", label: "Malaysia" },
  { value: "SG", label: "Singapore" },
  { value: "TH", label: "Thailand" },
  { value: "PH", label: "Philippines" },
  { value: "VN", label: "Vietnam" },
] as const;

interface ContactLocationCardProps {
  formData: OrgSettingsFormData;
  onChange: (updates: Partial<OrgSettingsFormData>) => void;
  onCountryChange: (countryCode: string) => void;
  stateOptions: GeoState[];
  cityOptions: GeoCity[];
  stateLabel: string;
  cityLabel: string;
}

export function ContactLocationCard({
  formData,
  onChange,
  onCountryChange,
  stateOptions,
  cityOptions,
  stateLabel,
  cityLabel,
}: ContactLocationCardProps) {
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-primary" />
          Contact & Location
        </CardTitle>
        <CardDescription>Contact details and address information</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="org-email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            Email Address
          </Label>
          <Input
            id="org-email"
            type="email"
            value={formData.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="info@example.com"
            className="h-10"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="org-phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            Phone Number
          </Label>
          <Input
            id="org-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+62 xxx xxxx xxxx"
            className="h-10"
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="org-website" className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            Website
          </Label>
          <Input
            id="org-website"
            type="url"
            value={formData.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://example.com"
            className="h-10"
          />
        </div>

        <Separator />

        {/* Street Address */}
        <div className="space-y-2">
          <Label htmlFor="org-address" className="text-sm font-medium">
            Street Address
          </Label>
          <Input
            id="org-address"
            value={formData.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="123 Main Street"
            className="h-10"
          />
        </div>

        {/* Country + State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-country" className="text-sm font-medium">
              Country
            </Label>
            <Select value={formData.country_code} onValueChange={onCountryChange}>
              <SelectTrigger id="org-country" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">State / Province</Label>
            <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={statePopoverOpen}
                  className="w-full justify-between h-10"
                >
                  <span className="truncate">{stateLabel || "Select state..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search state..." />
                  <CommandEmpty>No state found.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {stateOptions.map((state) => (
                        <CommandItem
                          key={state.value}
                          value={state.value}
                          onSelect={(val) => {
                            onChange({
                              state_province: val === formData.state_province ? "" : val,
                              city: "", // Reset city saat state berubah
                            });
                            setStatePopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.state_province === state.value ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {state.label}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* City + Postal Code */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">City</Label>
            <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={cityPopoverOpen}
                  className="w-full justify-between h-10"
                  disabled={!formData.state_province}
                >
                  <span className="truncate">{cityLabel || "Select city..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search city..." />
                  <CommandEmpty>No city found.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {cityOptions.map((city) => (
                        <CommandItem
                          key={city.value}
                          value={city.value}
                          onSelect={(val) => {
                            onChange({ city: val === formData.city ? "" : val });
                            setCityPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.city === city.value ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {city.label}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-postal" className="text-sm font-medium">
              Postal Code
            </Label>
            <Input
              id="org-postal"
              value={formData.postal_code}
              onChange={(e) => onChange({ postal_code: e.target.value })}
              placeholder="12345"
              className="h-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}