"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export interface ICustomFieldDefinition {
  id: string;
  label: string;
  type: "text" | "number" | "date";
  required?: boolean;
}

/**
 * Fetches custom field definitions for an organization.
 * Stored in organization_custom_fields.field_definitions
 */
export async function getCustomFieldDefinitions(orgId: string | number): Promise<ICustomFieldDefinition[]> {
  const admin = createAdminClient();
  try {
    const { data, error } = await admin
      .from("organization_custom_fields")
      .select("field_definitions")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error || !data) return [];
    
    return (data.field_definitions as any) || [];
  } catch (err) {
    console.error("getCustomFieldDefinitions error:", err);
    return [];
  }
}

/**
 * Updates custom field definitions for an organization.
 * Uses upsert on organization_custom_fields table.
 */
export async function updateCustomFieldDefinitions(orgId: string | number, fields: ICustomFieldDefinition[]) {
  const admin = createAdminClient();
  try {
    const { error } = await admin
      .from("organization_custom_fields")
      .upsert({
        organization_id: Number(orgId),
        field_definitions: fields,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id'
      });

    if (error) throw error;

    return { success: true, message: "Custom field definitions updated successfully" };
  } catch (error: any) {
    console.error("updateCustomFieldDefinitions error:", error);
    return { success: false, message: error.message || "Failed to update definitions" };
  }
}
