"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

import { organizationLogger } from '@/lib/logger';
export interface OrganizationUpdateData {
  name: string;
  legal_name?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  timezone?: string | null;
  currency_code?: string | null;
  country_code?: string | null;
  industry?: string | null;
  logo_url?: string | null;
  time_format?: '12h' | '24h';
}

// Get organization by ID (with fallback to user's organization)
export async function getCurrentUserOrganization(organizationId?: number | null): Promise<{
  success: boolean;
  data?: {
    id: number;
    code: string;
    name: string;
    legal_name: string | null;
    description: string | null;
    address: string | null;
    city: string | null;
    state_province: string | null;
    postal_code: string | null;
    phone: string | null;
    website: string | null;
    email: string | null;
    logo_url: string | null;
    inv_code: string;
    is_active: boolean;
    timezone: string | null;
    currency_code: string | null;
    country_code: string;
    industry: string | null;
    time_format: '12h' | '24h';
    created_at: string;
    updated_at: string;
  };
  message: string;
}> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Determine which organization to fetch
    let targetOrgId = organizationId;
    
    if (!targetOrgId) {
      // If no organizationId provided, get user's first organization
      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (memberError || !member) {
        return { success: false, message: "No organization found for this user" };
      }
      targetOrgId = member.organization_id;
    }

    // Fetch organization data
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select(`
        id,
        code,
        name,
        legal_name,
        description,
        address,
        city,
        state_province,
        postal_code,
        phone,
        email,
        website,
        logo_url,
        timezone,
        currency_code,
        country_code,
        industry,
        inv_code,
        is_active,
        time_format,
        created_at,
        updated_at
      `)
      .eq("id", targetOrgId)
      .maybeSingle();

    if (orgError) {
      organizationLogger.error("Organization query error:", orgError);
      return { success: false, message: "Failed to fetch organization data" };
    }

    if (!org) {
      return { success: false, message: "Organization not found" };
    }

    const timeFormat = org.time_format === '12h' ? '12h' : '24h';
    
    return {
      success: true,
      data: {
        id: org.id,
        code: org.code,
        name: org.name,
        legal_name: org.legal_name,
        description: org.description,
        address: org.address,
        city: org.city,
        state_province: org.state_province,
        postal_code: org.postal_code,
        phone: org.phone,
        website: org.website,
        email: org.email,
        logo_url: org.logo_url,
        inv_code: org.inv_code,
        is_active: org.is_active,
        timezone: org.timezone,
        currency_code: org.currency_code,
        country_code: org.country_code,
        industry: org.industry,
        time_format: timeFormat,
        created_at: org.created_at,
        updated_at: org.updated_at
      },
      message: "Organization data fetched successfully"
    };

  } catch (error: unknown) {
    organizationLogger.error("Get organization error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while fetching organization data"
    };
  }
}

// Update organization data
export async function updateOrganization(updateData: OrganizationUpdateData, organizationId?: number | null): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Determine which organization to update
    let targetOrgId = organizationId;
    
    if (!targetOrgId) {
      // If no organizationId provided, get user's first organization
      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (memberError || !member) {
        return { success: false, message: "No organization found for this user" };
      }
      targetOrgId = member.organization_id;
    }

    // Update organization data - legal_name always syncs with name
    const organizationName = updateData.name.trim();
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        name: organizationName,
        legal_name: organizationName, // Always sync legal_name with name
        description: updateData.description?.trim() || null,
        address: updateData.address?.trim() || null,
        city: updateData.city?.trim() || null,
        state_province: updateData.state_province?.trim() || null,
        postal_code: updateData.postal_code?.trim() || null,
        phone: updateData.phone?.trim() || null,
        website: updateData.website?.trim() || null,
        email: updateData.email?.trim() || null,
        timezone: updateData.timezone?.trim() || null,
        currency_code: updateData.currency_code?.trim() || null,
        country_code: updateData.country_code?.trim() || null,
        industry: updateData.industry?.trim() || null,
        logo_url: updateData.logo_url,
        time_format: updateData.time_format || '24h',
        updated_at: new Date().toISOString()
      })
      .eq("id", targetOrgId);

    if (updateError) {
      organizationLogger.error("Organization update error:", updateError);
      return { success: false, message: "Failed to update organization data" };
    }

    // Revalidate the page to show updated data
    revalidatePath("/organization/settings");

    return {
      success: true,
      message: "Organization settings updated successfully"
    };

  } catch (error: unknown) {
    organizationLogger.error("Update organization error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while updating organization data"
    };
  }
}

// Generate random invitation code
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Exclude O and 0 to avoid confusion
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Regenerate organization invite code
export async function regenerateInviteCode(organizationId?: number | null): Promise<{
  success: boolean;
  data?: string;
  message: string;
}> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Determine which organization to update
    let targetOrgId = organizationId;
    
    if (!targetOrgId) {
      // If no organizationId provided, get user's first organization
      const { data: member, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (memberError || !member) {
        return { success: false, message: "No organization found for this user" };
      }
      targetOrgId = member.organization_id;
    }

    // Generate new unique invitation code
    let newInvCode = generateInvitationCode();
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const { data: codeCheck } = await supabase
        .from("organizations")
        .select("id")
        .eq("inv_code", newInvCode)
        .maybeSingle();
        
      if (!codeCheck) {
        isUnique = true;
      } else {
        newInvCode = generateInvitationCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return { success: false, message: "Failed to generate unique invitation code. Please try again." };
    }

    // Update organization with new invite code
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        inv_code: newInvCode,
        updated_at: new Date().toISOString()
      })
      .eq("id", targetOrgId);

    if (updateError) {
      organizationLogger.error("Invite code update error:", updateError);
      return { success: false, message: "Failed to regenerate invitation code" };
    }

    // Revalidate the page to show updated data
    revalidatePath("/organization/settings");

    return {
      success: true,
      data: newInvCode,
      message: "Invitation code regenerated successfully"
    };

  } catch (error: unknown) {
    organizationLogger.error("Regenerate invite code error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while regenerating invitation code"
    };
  }
}

// Soft delete an organization
export async function deleteOrganization(organizationId: number): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    
    // 1. Get current user and verify permissions (e.g., must be owner or superadmin)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // TODO: Add role-based access control here. For now, we assume the user is authorized.

    // 2. Perform the soft delete by updating flags
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        is_active: false,
        // @ts-ignore
        deleted_at: new Date().toISOString(), // Assuming you add a 'deleted_at' timestamp column
      })
      .eq("id", organizationId);

    if (updateError) {
      organizationLogger.error("Soft delete organization error:", updateError);
      return { success: false, message: "Failed to delete organization." };
    }

    const { data: orgMembers, error: orgMembersError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId);

    if (orgMembersError) {
      organizationLogger.error("Fetch organization members error:", orgMembersError);
    } else if (orgMembers && orgMembers.length > 0) {
      const memberIds = orgMembers.map(m => m.id as number);

      const { data: adminRoleRows, error: adminRolesError } = await supabase
        .from("organization_member_roles")
        .select("organization_member_id, system_roles!inner(code)")
        .in("organization_member_id", memberIds)
        .in("system_roles.code", ["A001", "SA001"]);

      if (adminRolesError) {
        organizationLogger.error("Fetch admin roles error:", adminRolesError);
      }

      const adminMemberIds = (adminRoleRows || [])
        .map((r: { organization_member_id: number }) => r.organization_member_id)
        .filter((id, idx, arr) => arr.indexOf(id) === idx);

      const nonAdminIds = memberIds.filter(id => !adminMemberIds.includes(id));

      if (nonAdminIds.length > 0) {
        const { error: deactivateError } = await supabase
          .from("organization_members")
          .update({ is_active: false })
          .in("id", nonAdminIds);

        if (deactivateError) {
          organizationLogger.error("Deactivate non-admin members error:", deactivateError);
        }
      }
    }

    revalidatePath("/organization"); // Revalidate the organization list page

    return {
      success: true,
      message: "Organization has been successfully deleted."
    };

  } catch (error: unknown) {
    organizationLogger.error("Delete organization error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while deleting the organization."
    };
  }
}
