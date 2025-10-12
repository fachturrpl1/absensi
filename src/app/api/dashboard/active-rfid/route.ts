import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserOrganization } from "@/utils/get-user-org";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options?: any) {
            // @ts-ignore
            cookieStore.set(name, value, options);
          },
          remove(name: string, options?: any) {
            // @ts-ignore
            cookieStore.set(name, "", options);
          },
        },
      }
    );

    const organizationId = await getUserOrganization(supabase);
    if (!organizationId) {
      throw new Error("No organization found for user");
    }

    // Get active organization member IDs
    const { data: members, error: memberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    if (memberError) throw memberError;

    const memberIds = members?.map((m: any) => m.id) || [];

    if (memberIds.length === 0) {
      return NextResponse.json({ success: true, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } });
    }

    // Count RFID cards linked to active members
    const { count: currentCount, error: rfidError } = await supabase
      .from("rfid_cards")
      .select("id", { count: "exact", head: true })
      .in("organization_member_id", memberIds);

    if (rfidError) throw rfidError;

    const current = currentCount ?? 0;

    // For now, we don't compute previous month for RFID as UI hides it; return zero
    return NextResponse.json({ success: true, data: { currentMonth: current, previousMonth: 0, percentChange: 0 } });
  } catch (e) {
    console.error("Error fetching active RFID stats:", e);
    return NextResponse.json({ success: false, data: { currentMonth: 0, previousMonth: 0, percentChange: 0 } });
  }
}
