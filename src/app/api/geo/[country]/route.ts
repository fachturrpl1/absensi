import { NextResponse } from "next/server";
import { loadGeoCountry } from "@/lib/geo/loader";

interface Params {
  country: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params },
) {
  const countryCode = params.country?.toUpperCase();
  if (!countryCode) {
    return NextResponse.json({ error: "Country code is required" }, { status: 400 });
  }

  const geoData = await loadGeoCountry(countryCode);
  if (!geoData) {
    return NextResponse.json({ error: "Country not supported" }, { status: 404 });
  }

  return NextResponse.json(geoData);
}

