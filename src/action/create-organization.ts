"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";


export interface CreateOrganizationInput {
  orgName: string;
  orgCode: string;
  timezone: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
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
      address: input.address,
      city: input.city,
      stateProvince: input.stateProvince,
      postalCode: input.postalCode,
      invCode: invCode,
    });

    // Create admin client with service role key for insert operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[CREATE-ORG] Missing environment variables:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey,
      });
      return {
        success: false,
        message: "Server configuration error",
        error: "Missing Supabase credentials",
      };
    }
    
    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);
    const { data: organization, error: orgError } = await adminClient
      .from("organizations")
      .insert([
        {
          name: input.orgName,
          legal_name: input.orgName,
          code: input.orgCode,
          timezone: input.timezone,
          industry: input.industry || null,
          phone: input.phone || null,
          email: input.email || null,
          website: input.website || null,
          address: input.address || null,
          city: input.city || null,
          state_province: input.stateProvince || null,
          postal_code: input.postalCode || null,
          country_code: "ID",
          is_active: true,
          is_suspended: false,
          inv_code: invCode,
        },
      ])
      .select()
      .single();

    if (orgError || !organization) {
      console.error("[CREATE-ORG] Error creating organization:", {
        error: orgError,
        message: orgError?.message,
        details: orgError?.details,
        hint: orgError?.hint,
      });
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
          hire_date: new Date().toISOString().split('T')[0],
          is_active: true,
        },
      ])
      .select()
      .single();

    if (memberError || !member) {
      console.error("[CREATE-ORG] Error adding member:", {
        error: memberError,
        message: memberError?.message,
        details: memberError?.details,
        hint: memberError?.hint,
        code: memberError?.code,
        inputData: {
          user_id: user.id,
          organization_id: organization.id,
          is_active: true,
        },
      });
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

    // 6. Assign default role to user
    console.log("[CREATE-ORG] Assigning default role to user:", input.defaultRoleId);

    // Get selected role from system_roles
    const { data: selectedRole, error: roleError } = await adminClient
      .from("system_roles")
      .select("id")
      .eq("code", input.defaultRoleId)
      .single();

    if (roleError || !selectedRole) {
      console.error("[CREATE-ORG] Error fetching selected role:", {
        roleCode: input.defaultRoleId,
        error: roleError,
        message: roleError?.message,
        details: roleError?.details,
        hint: roleError?.hint,
        code: roleError?.code,
      });
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
        error: roleError?.message || `Role ${input.defaultRoleId} not found`,
      };
    }

    // Create organization_member_roles record
    const { error: memberRoleError } = await adminClient
      .from("organization_member_roles")
      .insert([
        {
          organization_member_id: member.id,
          role_id: selectedRole.id,
        },
      ]);

    if (memberRoleError) {
      console.error("[CREATE-ORG] Error assigning role:", {
        error: memberRoleError,
        message: memberRoleError?.message,
        details: memberRoleError?.details,
        hint: memberRoleError?.hint,
        code: memberRoleError?.code,
        inputData: {
          organization_member_id: member.id,
          role_id: selectedRole.id,
        },
      });
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
        error: memberRoleError?.message || "Database error",
      };
    }

    console.log("[CREATE-ORG] Admin role assigned successfully");

    // 7. Success - return organization details
    console.log("[CREATE-ORG] Organization creation completed successfully", {
      organizationId: organization.id,
      organizationName: organization.name,
      organizationCode: organization.code,
      assignedRole: input.defaultRoleId,
    });

    return {
      success: true,
      message: `Organization "${organization.name}" created successfully with role ${input.defaultRoleId}`,
      data: {
        organizationId: organization.id,
        organizationName: organization.name,
        organizationCode: organization.code,
      },
    };
  } catch (error) {
    console.error("[CREATE-ORG] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      message: "An unexpected error occurred",
      error: errorMessage,
    };
  }
}

/**
 * Generate random invitation code
 * @deprecated Not currently used, but kept for future reference
 */
// function generateInvitationCode(): string {
//   return Math.random().toString(36).substring(2, 10).toUpperCase();
// }

/**
 * Validate organization code uniqueness
 */
export async function validateOrganizationCode(
  code: string
): Promise<{ isValid: boolean; message?: string }> {
  try {
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

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
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

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
