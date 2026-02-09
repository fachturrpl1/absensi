"use server";

import { createClient } from "@/utils/supabase/server";
import { UserOrganization } from "@/store/user-store";

export async function getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("organization_members")
            .select(`
        id,
        organization_id,
        organization:organizations (
          id,
          name
        ),
        role:system_roles (
          id,
          code,
          name
        )
      `)
            .eq("user_id", userId)
            .eq("is_active", true);

        console.log("[getUserOrganizations] Fetching for userId:", userId);
        console.log("[getUserOrganizations] Raw DB Data:", JSON.stringify(data, null, 2));
        console.log("[getUserOrganizations] DB Error:", error);

        if (error) {
            console.error("Error fetching user organizations:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Transform the data to match UserOrganization interface
        return data.map((item: any) => ({
            id: item.id,
            organization_id: item.organization_id,
            organization_name: item.organization?.name || "Unknown Organization",
            roles: item.role ? [item.role] : []
        }));
    } catch (error) {
        console.error("Error in getUserOrganizations:", error);
        return [];
    }
}
