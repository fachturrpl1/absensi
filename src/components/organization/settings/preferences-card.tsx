"use client";

// src/components/organization/settings/PreferencesCard.tsx
// Timezone dan currency di-fetch dari API — tidak hardcoded

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Loader2 } from "@/components/icons/lucide-exports";

import { useTimezones, useCurrencies } from "@/hooks/organization/settings/use-select-option";
import type { OrgSettingsFormData } from "@/types/organization/org-settings";

interface PreferencesCardProps {
  formData: OrgSettingsFormData;
  onChange: (updates: Partial<OrgSettingsFormData>) => void;
}

export function PreferencesCard({ formData, onChange }: PreferencesCardProps) {
  const { data: timezones, isLoading: loadingTz } = useTimezones();
  const { data: currencies, isLoading: loadingCur } = useCurrencies();

  // Group timezone berdasarkan region untuk UX lebih baik
  const timezoneGroups = timezones
    ? timezones.reduce<Record<string, typeof timezones>>((acc, tz) => {
        const region = tz.region || "Other";
        if (!acc[region]) acc[region] = [];
        acc[region].push(tz);
        return acc;
      }, {})
    : {};

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Preferences
        </CardTitle>
        <CardDescription>Timezone, currency, and time format settings</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="org-timezone" className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Timezone
          </Label>
          {loadingTz ? (
            <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading timezones...
            </div>
          ) : (
            <Select
              value={formData.timezone}
              onValueChange={(value) => onChange({ timezone: value })}
            >
              <SelectTrigger id="org-timezone" className="h-10">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {Object.entries(timezoneGroups).map(([region, tzList]) => (
                  <SelectGroup key={region}>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {region}
                    </SelectLabel>
                    {tzList.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="org-currency" className="text-sm font-medium">
            Currency
          </Label>
          {loadingCur ? (
            <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading currencies...
            </div>
          ) : (
            <Select
              value={formData.currency_code}
              onValueChange={(value) => onChange({ currency_code: value })}
            >
              <SelectTrigger id="org-currency" className="h-10">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {currencies?.map((cur) => (
                  <SelectItem key={cur.code} value={cur.code}>
                    {cur.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Separator />

        {/* Time Format */}
        <div className="space-y-2">
          <Label htmlFor="org-time-format" className="text-sm font-medium">
            Time Format
          </Label>
          <Select
            value={formData.time_format}
            onValueChange={(value) => onChange({ time_format: value as "12h" | "24h" })}
          >
            <SelectTrigger id="org-time-format" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12-hour (1:00 PM)</SelectItem>
              <SelectItem value="24h">24-hour (13:00)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}