"use client";

// src/hooks/organization/settings/use-select-options.ts
// Fetch timezone dan currency dari API routes secara parallel

import { useQuery } from "@tanstack/react-query";
import type { TimezoneOption, CurrencyOption } from "@/types/organization/org-settings";

async function fetchTimezones(): Promise<TimezoneOption[]> {
  const res = await fetch("/api/timezones");
  if (!res.ok) throw new Error("Failed to fetch timezones");
  return res.json();
}

async function fetchCurrencies(): Promise<CurrencyOption[]> {
  const res = await fetch("/api/currencies");
  if (!res.ok) throw new Error("Failed to fetch currencies");
  return res.json();
}

export function useTimezones() {
  return useQuery<TimezoneOption[]>({
    queryKey: ["timezones"],
    queryFn: fetchTimezones,
    staleTime: Infinity, // Timezone list tidak berubah selama session
    gcTime: 1000 * 60 * 60, // 1 jam
  });
}

export function useCurrencies() {
  return useQuery<CurrencyOption[]>({
    queryKey: ["currencies"],
    queryFn: fetchCurrencies,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
  });
}