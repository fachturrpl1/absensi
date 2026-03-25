// src/app/api/currencies/route.ts
// Mengembalikan list currency ISO 4217
// Menggunakan package `currency-codes` (npm i currency-codes)
// Fallback ke static list jika package tidak tersedia

import { NextResponse } from "next/server";
import type { CurrencyOption } from "@/types/organization/org-settings";

// Cache di module level
let cachedCurrencies: CurrencyOption[] | null = null;

// Symbol map untuk currency umum (currency-codes tidak include symbol)
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  IDR: "Rp",
  MYR: "RM",
  SGD: "S$",
  THB: "฿",
  PHP: "₱",
  VND: "₫",
  KRW: "₩",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  CHF: "Fr",
  HKD: "HK$",
  TWD: "NT$",
  SAR: "﷼",
  AED: "د.إ",
  BRL: "R$",
  MXN: "$",
  ZAR: "R",
  RUB: "₽",
  TRY: "₺",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  NZD: "NZ$",
};

async function buildCurrencyList(): Promise<CurrencyOption[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cc = require("currency-codes") as {
      codes: () => string[];
      code: (c: string) => { currency: string; number: string } | undefined;
    };

    const allCurrencies: string[] = typeof cc.codes === "function" ? cc.codes() : [];
    if (!allCurrencies.length) throw new Error("No currencies from package");

    return allCurrencies
      .map((code: string) => {
        const data = cc.code(code);
        if (!data) return null;
        const symbol = CURRENCY_SYMBOLS[code] ?? code;
        return {
          code,
          name: data.currency,
          symbol,
          label: `${code} — ${data.currency}`,
        } satisfies CurrencyOption;
      })
      .filter((x): x is CurrencyOption => x !== null)
      .sort((a, b) => a.code.localeCompare(b.code));
  } catch {
    // Fallback: static list currency umum jika package belum diinstall
    const STATIC_CURRENCIES: CurrencyOption[] = [
      { code: "USD", name: "US Dollar", symbol: "$", label: "USD — US Dollar" },
      { code: "EUR", name: "Euro", symbol: "€", label: "EUR — Euro" },
      { code: "GBP", name: "British Pound", symbol: "£", label: "GBP — British Pound" },
      { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", label: "IDR — Indonesian Rupiah" },
      { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", label: "MYR — Malaysian Ringgit" },
      { code: "SGD", name: "Singapore Dollar", symbol: "S$", label: "SGD — Singapore Dollar" },
      { code: "THB", name: "Thai Baht", symbol: "฿", label: "THB — Thai Baht" },
      { code: "PHP", name: "Philippine Peso", symbol: "₱", label: "PHP — Philippine Peso" },
      { code: "VND", name: "Vietnamese Dong", symbol: "₫", label: "VND — Vietnamese Dong" },
      { code: "JPY", name: "Japanese Yen", symbol: "¥", label: "JPY — Japanese Yen" },
      { code: "CNY", name: "Chinese Yuan", symbol: "¥", label: "CNY — Chinese Yuan" },
      { code: "KRW", name: "South Korean Won", symbol: "₩", label: "KRW — South Korean Won" },
      { code: "INR", name: "Indian Rupee", symbol: "₹", label: "INR — Indian Rupee" },
      { code: "AUD", name: "Australian Dollar", symbol: "A$", label: "AUD — Australian Dollar" },
      { code: "CAD", name: "Canadian Dollar", symbol: "C$", label: "CAD — Canadian Dollar" },
      { code: "CHF", name: "Swiss Franc", symbol: "Fr", label: "CHF — Swiss Franc" },
      { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", label: "HKD — Hong Kong Dollar" },
      { code: "BRL", name: "Brazilian Real", symbol: "R$", label: "BRL — Brazilian Real" },
      { code: "SAR", name: "Saudi Riyal", symbol: "﷼", label: "SAR — Saudi Riyal" },
      { code: "AED", name: "UAE Dirham", symbol: "د.إ", label: "AED — UAE Dirham" },
    ];
    return STATIC_CURRENCIES;
  }
}

export async function GET() {
  if (!cachedCurrencies) {
    cachedCurrencies = await buildCurrencyList();
  }

  return NextResponse.json(cachedCurrencies, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}