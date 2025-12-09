"use server";

import { createClient } from "@/utils/supabase/server";
import { createSupabaseClient } from "@/config/supabase-config";
import { IOrganization } from "@/interface";

export interface CreateOrganizationInput {
  orgName: string;
  orgCode: string;
  timezone: string;
  workStartTime: string;
  workEndTime: string;
  defaultRoleId: string;
}

export interface CreateOrganizationResult {
  success: boolean;
  message: string;
  data?: {
    organizationId: number;
    organizationName: string;
    organizationCode: string;
  };
  error?: string;
}

/**
 * Create a new organization with complete setup
 * - Create organization record
 * - Add current user as organization member
 * - Assign admin role to user
 * - Setup default settings
 */
export async function createOrganization(
  input: CreateOrganizationInput
): Promise<CreateOrganizationResult> {
  try {
    const supabase = await createClient();

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        message: "User not authenticated",
        error: "Please login first",
      };
    }

    console.log("[CREATE-ORG] Starting organization creation for user:", user.id);

    // 2. Validate input
    if (!input.orgName || !input.orgCode) {
      return {
        success: false,
        message: "Organization name and code are required",
        error: "Missing required fields",
      };
    }

    // 3. Generate invitation code
    const invCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 4. Create organization
    console.log("[CREATE-ORG] Creating organization:", {
      name: input.orgName,
      code: input.orgCode,
      timezone: input.timezone,
      invCode: invCode,
    });

    const adminClient = await createSupabaseClient();
    const { data: organization, error: orgError } = await adminClient
      .from("organizations")
      .insert([
        {
          name: input.orgName,
          legal_name: input.orgName,
          code: input.orgCode,
          timezone: input.timezone,
          work_start_time: input.workStartTime,
          work_end_time: input.workEndTime,
          is_active: true,
          is_suspended: false,
          created_by: user.id,
          inv_code: invCode,
        },
      ])
      .select()
      .single();

    if (orgError || !organization) {
      console.error("[CREATE-ORG] Error creating organization:", orgError);
      return {
        success: false,
        message: "Failed to create organization",
        error: orgError?.message || "Database error",
      };
    }

    console.log("[CREATE-ORG] Organization created:", organization.id);

    // 5. Add user as organization member
    console.log("[CREATE-ORG] Adding user as organization member");

    const { data: member, error: memberError } = await adminClient
      .from("organization_members")
      .insert([
        {
          user_id: user.id,
          organization_id: organization.id,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (memberError || !member) {
      console.error("[CREATE-ORG] Error adding member:", memberError);
      // Rollback: delete organization
      await adminClient
        .from("organizations")
        .delete()
        .eq("id", organization.id);
      return {
        success: false,
        message: "Failed to add user to organization",
        error: memberError?.message || "Database error",
      };
    }

    console.log("[CREATE-ORG] Member added:", member.id);

    // 6. Assign admin role to user
    console.log("[CREATE-ORG] Assigning admin role to user");

    // Get admin role (A001)
    const { data: adminRole, error: roleError } = await adminClient
      .from("system_roles")
      .select("id")
      .eq("code", "A001")
      .single();

    if (roleError || !adminRole) {
      console.error("[CREATE-ORG] Error fetching admin role:", roleError);
      // Rollback: delete member and organization
      await adminClient
        .from("organization_members")
        .delete()
        .eq("id", member.id);
      await adminClient
        .from("organizations")
        .delete()
        .eq("id", organization.id);
      return {
        success: false,
        message: "Failed to assign role",
        error: "Admin role not found",
      };
    }

    // Create organization_member_roles record
    const { error: memberRoleError } = await adminClient
      .from("organization_member_roles")
      .insert([
        {
          organization_member_id: member.id,
          role_id: adminRole.id,
        },
      ]);

    if (memberRoleError) {
      console.error("[CREATE-ORG] Error assigning role:", memberRoleError);
      // Rollback: delete member and organization
      await adminClient
        .from("organization_members")
        .delete()
        .eq("id", member.id);
      await adminClient
        .from("organizations")
        .delete()
        .eq("id", organization.id);
      return {
        success: false,
        message: "Failed to assign role to member",
        error: memberRoleError.message || "Database error",
      };
    }

    console.log("[CREATE-ORG] Admin role assigned successfully");

    // 7. Success - return organization details
    console.log("[CREATE-ORG] Organization creation completed successfully");

    return {
      success: true,
      message: "Organization created successfully",
      data: {
        organizationId: organization.id,
        organizationName: organization.name,
        organizationCode: organization.code,
      },
    };
  } catch (error) {
    console.error("[CREATE-ORG] Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate random invitation code
 */
function generateInvitationCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Validate organization code uniqueness
 */
export async function validateOrganizationCode(
  code: string
): Promise<{ isValid: boolean; message?: string }> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from("organizations")
      .select("id")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (error) {
      return {
        isValid: false,
        message: "Error validating code",
      };
    }

    if (data) {
      return {
        isValid: false,
        message: "Organization code already exists",
      };
    }

    return {
      isValid: true,
    };
  } catch (error) {
    console.error("[VALIDATE-CODE] Error:", error);
    return {
      isValid: false,
      message: "Error validating code",
    };
  }
}

/**
 * Get available timezones
 */
export async function getAvailableTimezones(): Promise<string[]> {
  return [
    "Asia/Jakarta",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Manila",
    "Asia/Hong_Kong",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Seoul",
    "UTC",
    "Europe/London",
    "Europe/Paris",
    "America/New_York",
    "America/Los_Angeles",
  ];
}

/**
 * Get available roles for organization
 */
export async function getAvailableRoles(): Promise<
  Array<{ id: string; code: string; name: string }>
> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from("system_roles")
      .select("id, code, name")
      .order("code", { ascending: true });

    if (error || !data) {
      console.error("[GET-ROLES] Error:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("[GET-ROLES] Error:", error);
    return [];
  }
}
