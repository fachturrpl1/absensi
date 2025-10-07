import { NextResponse } from "next/server";
import { getOrganizationTimezoneByUserId } from "@/action/organization";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ timezone: "UTC" });

  const timezone = await getOrganizationTimezoneByUserId(userId);
  return NextResponse.json({ timezone });
}
