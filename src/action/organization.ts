"use server";
import { createSupabaseClient } from "@/config/supabase-config";
import { IOrganization } from "@/interface";
import { createClient } from "@/utils/supabase/server";

// ➕ Add Organization
export const addOrganization = async (organization: Partial<IOrganization>) => {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert([organization])
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Organization added successfully", data: data as IOrganization };
};

// ✏️ Update Organization
export const updateOrganization = async (id: string, organization: Partial<IOrganization>) => {

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .update(organization)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message, data: null };
  }
  return { success: true, message: "Organization updated successfully", data: data as IOrganization };
};


// 📂 Get All Organizations
export const getAllOrganization = async () => {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("organizations") // table name consistency
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, message: error.message, data: [] };
  }

  return { success: true, data: data as IOrganization[] };
};

export const uploadLogo = async (
  file: File,
  oldFilePath?: string // optional: pass old logo when updating
): Promise<string | null> => {
  try {
    const supabase = await createSupabaseClient();
    // 🔥 remove old logo if present
    if (oldFilePath) {
      await deleteLogo(oldFilePath)
    }

    // Buat nama file unik
    const fileExt = file.name.split(".").pop()
    const fileName = `organization/${Date.now()}.${fileExt}`

    // Upload ke Supabase
    const { error } = await supabase.storage
      .from("logo") // nama bucket
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error("Supabase upload error:", error.message)
      throw error
    }

    // Retrieve public URL
    const { data } = supabase.storage.from("logo").getPublicUrl(fileName)

    return data.publicUrl
  } catch (err: unknown) {
    console.error("Upload logo error:", err)
    return null
  }
}
export const deleteLogo = async (fileUrl: string | null): Promise<boolean> => {
  if (!fileUrl) return true; // treat null/empty as success
  try {
    const supabase = await createSupabaseClient();
    // Extract path relative to the bucket
    const url = new URL(fileUrl);
    const path = url.pathname.split("/object/public/logo/")[1];

    if (!path) {
      console.error("Invalid logo URL:", fileUrl);
      return false;
    }

    const { error } = await supabase.storage
      .from("logo")
      .remove([path]);

    if (error) {
      console.error("Delete logo error:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Delete logo exception:", err);
    return false;
  }
};


export const deleteOrganization = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const supabase = await createSupabaseClient();
    // Fetch organization data first to determine logo path
    const { data: org, error: fetchError } = await supabase
      .from("organizations")
      .select("id, logo_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    // Delete logo if present
    if (org?.logo_url) {
      await deleteLogo(org.logo_url);
    }

    // Remove organization record
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: "Organization deleted successfully" };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err instanceof Error ? err.message : 'Unknown error' : "Failed to delete organization" };
  }
};

// action/organization.ts
export const getOrganizationById = async (id: string) => {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return { success: false, message: error.message, data: null }
  }

  return { success: true, data }
}



// ambil org.name dari user yang login
export const getUserOrganizationName = async (userId: string) => {
  const supabase = await createSupabaseClient();
  // cari organization_id user ini di organization_members
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (memberError || !member) {
    return { success: true, name: "E-Attendance" } // fallback
  }

  // ambil nama org dari tabel organizations
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", member.organization_id)
    .maybeSingle()

  if (orgError || !org) {
    return { success: true, name: "E-Attendance" }
  }

  return { success: true, name: org.name }
}

export async function getOrganizationTimezoneByUserId(userId: string) {
  if (!userId) return "UTC";

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select("organizations(timezone)") // ✅ relasi benar sesuai FK
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching organization timezone:", error);
    return "UTC";
  }

  if (!data) return "UTC";

  const organizations = data.organizations as { timezone?: string } | { timezone?: string }[] | null | undefined;

  if (Array.isArray(organizations)) {
    return organizations[0]?.timezone ?? "UTC";
  }

  return organizations?.timezone ?? "UTC";
}
