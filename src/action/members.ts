"use server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { IOrganization_member } from "@/interface";

import { memberLogger } from '@/lib/logger';
// Helper function to get the supabase client
async function getSupabase() {
  return await createClient();
}

// ➕ Add MemIOrganization_member
export const createOrganizationMember = async (Organization_member: Partial<IOrganization_member>) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("organization_members").insert([Organization_member]).select().single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Members added successfully", data: data as IOrganization_member };
};
export const getAllOrganization_member = async (organizationId?: number) => {
  const supabase = await getSupabase();
  const adminClient = createAdminClient();

  // 1. Retrieve user from cookies
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "User not logged in", data: [] };
  }

  // 2. Determine which organization to fetch
  let targetOrgId = organizationId;
  
  if (!targetOrgId) {
    // If no organizationId provided, get user's first organization
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return { success: true, message: "User not registered in any organization", data: [] };
    }
    targetOrgId = member.organization_id;
  }

  memberLogger.debug(`📍 Fetching members for organization: ${targetOrgId}`);

  // 3. Fetch all members belonging to the organization
  const { data, error } = await adminClient
    .from("organization_members")
    .select(`
      *,
      biodata:biodata_nik (*),
      user:user_id (
        id,
        email,
        first_name,
        middle_name,
        last_name,
        display_name
      ),
      departments:department_id (
        id,
        name,
        code,
        organization_id
      ),
      role:role_id (
        id,
        code,
        name,
        description
      )
    `)
    .eq("organization_id", targetOrgId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    memberLogger.error('❌ getAllOrganization_member - error fetching organization_members for org', error);
    return { success: false, message: error.message, data: [] };
  }

  // 4. Untuk member yang user_id null, ambil data dari biodata berdasarkan employee_id (NIK)
  if (data && data.length > 0) {
    const membersWithoutUser = data.filter((m: any) => !m.user_id && m.employee_id);
    
    if (membersWithoutUser.length > 0) {
      const employeeIds = membersWithoutUser.map((m: any) => m.employee_id).filter(Boolean);
      
      if (employeeIds.length > 0) {
        const { data: biodataList, error: biodataError } = await adminClient
          .from("biodata")
          .select("nik, nama, nickname, email, no_telepon")
          .in("nik", employeeIds);

        if (!biodataError && biodataList) {
          // Merge biodata ke dalam member data
          const biodataMap = new Map(biodataList.map((b: any) => [b.nik, b]));
          
          data.forEach((member: any) => {
            if (!member.user_id && member.employee_id) {
              const biodata = biodataMap.get(member.employee_id);
              if (biodata) {
                // Buat object user dummy dari biodata untuk konsistensi dengan struktur yang ada
                member.user = {
                  id: null,
                  email: biodata.email || null,
                  first_name: biodata.nama?.split(" ")[0] || biodata.nama || null,
                  last_name: biodata.nama?.split(" ").slice(1).join(" ") || null,
                  display_name: biodata.nickname || biodata.nama || null,
                };
              }
            }
          });
        }
      }
    }
  }

  memberLogger.info(`✅ Fetched ${data?.length || 0} members for organization ${targetOrgId}`);
  return { success: true, data: data as IOrganization_member[] };
};

type OrganizationSummary = {
  organizationId: string | null;
  stats: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    pendingInvitations: number;
  };
};

export const getMemberSummary = async (): Promise<OrganizationSummary> => {
  const supabase = await getSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      organizationId: null,
      stats: { totalMembers: 0, activeMembers: 0, inactiveMembers: 0, pendingInvitations: 0 },
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership?.organization_id) {
    return {
      organizationId: null,
      stats: { totalMembers: 0, activeMembers: 0, inactiveMembers: 0, pendingInvitations: 0 },
    };
  }

  const organizationId = membership.organization_id as string;

  const [totalMembersRes, activeMembersRes, pendingInvitesRes] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("member_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
  ]);

  const totalMembers = totalMembersRes.count ?? 0;
  const activeMembers = activeMembersRes.count ?? 0;
  const inactiveMembers = totalMembers - activeMembers;
  const pendingInvitations = pendingInvitesRes.count ?? 0;

  return {
    organizationId,
    stats: {
      totalMembers,
      activeMembers,
      inactiveMembers,
      pendingInvitations,
    },
  };
};

// ✏️ Update Organization
export const updateOrganizationMember = async (id: string, organization: Partial<IOrganization_member>) => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("organization_members")
    .update(organization)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Organization updated successfully", data: data as IOrganization_member };
};
export const deleteOrganization_member = async (id: string) => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Organization Members deleted successfully", data: data as IOrganization_member };
};


export const getOrganizationMembersById = async (id: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
    *,
    organizations:organization_id (*),
    rfid_cards (card_number, card_type),
    role:role_id (
      id,
      code,
      name,
      description
    )
  `)
    .eq("id", id)
    .single()

  if (error) {
    return { success: false, message: error.message, data: null }
  }

  // If the member row exists, also fetch related user, department and position records
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const member: any = data

    if (member) {
      // Fetch user profile
      if (member.user_id) {
        // select common profile fields including email explicitly
        const { data: userData, error: userError } = await supabase
          .from("user_profiles")
          .select("id, employee_code, first_name, middle_name, last_name, display_name, phone, mobile, profile_photo_url, email, is_active, created_at, updated_at, deleted_at")
          .eq("id", member.user_id)
          .maybeSingle()

        if (!userError && userData) member.user = userData
      }

      // Fetch department (group)
      if (member.department_id) {
        const { data: deptData, error: deptError } = await supabase
          .from("departments")
          .select("*")
          .eq("id", member.department_id)
          .maybeSingle()

        if (!deptError && deptData) member.departments = deptData
      }

      // Fetch position
      if (member.position_id) {
        const { data: posData, error: posError } = await supabase
          .from("positions")
          .select("*")
          .eq("id", member.position_id)
          .maybeSingle()

        if (!posError && posData) member.positions = posData
      }

      if (!member.organization && member.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", member.organization_id)
          .maybeSingle()

        if (!orgError && orgData) member.organization = orgData
      }
    }
  } catch (e) {
     
    memberLogger.warn('getOrganizationMembersById: failed to fetch related records', e)
  }

  return { success: true, data }
}

export const getDepartmentMembersByOrganization = async (organizationId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("departments")
    .select(
      `
      id,
      name,
      organization_members:organization_members!department_id (id)
      `
    )
    .eq("organization_id", organizationId);

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  const result = (data || []).map((dept) => ({
    department: dept.name,
    members: dept.organization_members ? dept.organization_members.length : 0,
  }));

  return { success: true, data: result };
};


export const getUserOrganizationId = async (userId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle(); // allows null when none exists

  if (error) {
    return { success: false, message: error.message, organizationId: null };
  }

  if (!data) {
    // user is not yet registered in organization_members
    return { success: true, message: "User not in organization", organizationId: null };
  }

  return { success: true, message: "Organization found", organizationId: data.organization_id };
};

export const getMembersByGroupId = async (groupId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      *,
      user:user_id (
        id,
        email,
        first_name,
        middle_name,
        last_name,
        display_name
      )
    `)
    .eq("department_id", groupId);

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IOrganization_member[] };
};

export const getMembersByPositionId = async (positionId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      *,
      biodata:biodata_nik (*),
      user:user_id (
        id,
        email,
        first_name,
        middle_name,
        last_name,
        display_name
      )
    `)
    .eq("position_id", positionId);

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IOrganization_member[] };
};

export const moveMembersToGroup = async (memberIds: string[], targetGroupId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("organization_members")
    .update({ department_id: targetGroupId })
    .in("id", memberIds)
    .select();

  if (error) {
    return { success: false, message: error.message, data: null };
  }

  return { success: true, message: "Members moved successfully", data };
};