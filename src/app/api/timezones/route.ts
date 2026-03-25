// src/app/api/timezones/route.ts
// Mengembalikan list semua timezone valid dari Intl API
// Tidak butuh library eksternal — pakai Intl.supportedValuesOf bawaan V8/Node

import { NextResponse } from "next/server";
import type { TimezoneOption } from "@/types/organization/org-settings";

// Cache hasil di module level — timezone list tidak berubah antar request
let cachedTimezones: TimezoneOption[] | null = null;

function getOffsetLabel(timezone: string): { offset: string; label: string } {
  try {
    // Gunakan tanggal spesifik untuk mendapatkan offset yang konsisten (hindari DST ambiguity)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "UTC";

    // shortOffset format: "GMT+7", "GMT-5", "GMT+5:30"
    // Kita normalkan jadi "+07:00"
    const raw = offsetPart.replace("GMT", "").trim();
    if (!raw || raw === "") {
      return { offset: "+00:00", label: `${timezone} (UTC)` };
    }

    // Parse offset numerik
    const match = raw.match(/^([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (!match) {
      return { offset: "+00:00", label: `${timezone} (UTC)` };
    }

    // match[1], match[2] dijamin ada karena regex sudah match
    const sign = match[1] as string;
    const hours = (match[2] as string).padStart(2, "0");
    const minutes = match[3] ?? "00";
    const offset = `${sign}${hours}:${minutes}`;

    return { offset, label: `${timezone} (UTC${offset})` };
  } catch {
    return { offset: "+00:00", label: `${timezone} (UTC)` };
  }
}

function buildTimezoneList(): TimezoneOption[] {
  // Intl.supportedValuesOf tersedia di Node 18+ dan modern browsers
  const allTimezones: string[] = (() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      // Fallback manual jika env tidak support (sangat jarang)
      return [
        "UTC",
        "Asia/Jakarta",
        "Asia/Makassar",
        "Asia/Jayapura",
        "Asia/Singapore",
        "Asia/Kuala_Lumpur",
        "Asia/Bangkok",
        "Asia/Tokyo",
        "Asia/Shanghai",
        "Asia/Kolkata",
        "Europe/London",
        "Europe/Paris",
        "Europe/Berlin",
        "America/New_York",
        "America/Chicago",
        "America/Denver",
        "America/Los_Angeles",
        "America/Sao_Paulo",
        "Australia/Sydney",
        "Pacific/Auckland",
      ];
    }
  })();

  const timezones: TimezoneOption[] = allTimezones.map((tz) => {
    const { offset, label } = getOffsetLabel(tz);
    const region = tz.includes("/") ? (tz.split("/")[0] as string) : "Other";
    return { value: tz, label, offset, region };
  });

  // Sort: berdasarkan offset numerik, lalu nama
  timezones.sort((a, b) => {
    const toMinutes = (offset: string) => {
      const m = offset.match(/^([+-])(\d{2}):(\d{2})$/);
      if (!m) return 0;
      const sign = m[1] === "+" ? 1 : -1;
      return sign * (parseInt(m[2] ?? "0") * 60 + parseInt(m[3] ?? "0"));
    };
    const diff = toMinutes(a.offset) - toMinutes(b.offset);
    if (diff !== 0) return diff;
    return a.value.localeCompare(b.value);
  });

  return timezones;
}

export async function GET() {
  if (!cachedTimezones) {
    cachedTimezones = buildTimezoneList();
  }

  return NextResponse.json(cachedTimezones, {
    headers: {
      // Cache di browser 1 jam, CDN/proxy 24 jam
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}