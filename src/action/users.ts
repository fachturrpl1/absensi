"use server"

import { createClient } from "@/utils/supabase/server"
import { IUser } from "@/interface"

// Helper buat bikin client
async function getSupabase() {
  return await createClient()
}

// ======================
// SIGN UP
// ======================
export async function signUp(formData: FormData) {
  const supabase = await getSupabase()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = (formData.get("first_name") as string) || ""
  const middleName = (formData.get("middle_name") as string) || ""
  const lastName = (formData.get("last_name") as string) || ""

  const displayNameParts = [firstName, middleName, lastName].filter((part) => part && part.trim() !== "")
  const displayName = displayNameParts.join(" ") || firstName || email

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName || null,
        display_name: displayName,
      },
      // Ensure email confirmation is handled automatically
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/onboarding`,
    },
  })

  if (error) return { error: error.message }

  // If user is created and confirmed (auto-confirm is enabled in Supabase)
  if (data.user && data.session) {
    return { success: true, user: data.user, session: data.session }
  }

  // If user is created but not confirmed (email confirmation required)
  if (data.user && !data.session) {
    return { success: true, user: data.user, needsConfirmation: true }
  }

  return { success: true, user: data.user }
}

// ======================
// SIGN IN WITH GOOGLE
// ======================
export async function signInWithGoogle() {
  const supabase = await getSupabase()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      skipBrowserRedirect: false,
      queryParams: {
        access_type: 'online',
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    console.error('Google OAuth error:', error)
    return { error: error.message, url: null }
  }

  return { url: data.url, error: null }
}

// ======================
// LOGIN
// ======================
export async function login(formData: FormData) {
  const supabase = await getSupabase()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { success: false, message: error.message }
  if (!data.user) {
    return { success: false, message: "Login failed. Please ensure your email is confirmed." }
  }

  const user = data.user

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError) return { success: false, message: profileError.message }

  const { data: rolesData, error: roleError } = await supabase
    .from("user_roles")
    .select("role:system_roles(id, name)")
    .eq("user_id", user.id)

  if (roleError) return { success: false, message: roleError.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roles = (rolesData as any)?.map((r: any) => ({ 
    id: r.role?.id || r.id, 
    name: r.role?.name || r.name 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })).filter((role: any) => role.id && role.name) ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleIds = roles.map((r: any) => r.id)

  let permissions: { code: string; name: string }[] = []
  if (roleIds.length > 0) {
    const { data: permData, error: permError } = await supabase
      .from("role_permissions")
      .select("permission:permissions(code, name)")
      .in("role_id", roleIds)

    if (permError) return { success: false, message: permError.message }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    permissions = (permData as any)?.map((p: any) => ({ 
      code: p.permission?.code || p.code, 
      name: p.permission?.name || p.name 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })).filter((perm: any) => perm.code && perm.name) ?? []
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      ...profile, // Spread all profile data including profile_photo_url
    },
    roles,
    permissions,
  }
}

// ======================
// GET ALL USERS
// ======================
export async function getAllUsers() {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: error.message, data: [] }

  return { success: true, data: data as IUser[] }
}

export async function getAllUsersNotRegistered() {
  const supabase = await getSupabase()

  const { data: members, error: memberError } = await supabase
    .from("organization_members")
    .select("user_id")

  if (memberError) return { success: false, message: memberError.message, data: [] }

  const memberIds = members.map((m) => m.user_id)

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .not("id", "in", `(${memberIds.join(",") || 0})`)
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: error.message, data: [] }

  return { success: true, data: data as IUser[] }
}

// ======================
// GET CURRENT USER PROFILE
// ======================
export async function getCurrentUserProfile() {
  const supabase = await getSupabase()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: "Not logged in", profile: null }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error || !profile) return { error: error?.message || "Profile not found", profile: null }

  return { error: null, profile }
}

// ======================
// LOGOUT
// ======================
export async function logout() {
  const supabase = await getSupabase()
  const { error } = await supabase.auth.signOut()

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ======================
// DELETE USER
// ======================
export async function deleteUsers(id: string) {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) return { success: false, message: error.message, data: null }
  return { success: true, message: "Users deleted successfully", data: data as IUser }
}

// ======================
// UPDATE USER
// ======================
export async function updateUsers(id: string, values: Record<string, unknown>) {
  const supabase = await getSupabase()

  const { role_id, ...profileData } = values

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update(profileData)
    .eq("id", id)

  if (profileError) return { success: false, message: profileError.message }

  if (role_id) {
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: id, role_id })

    if (roleError) return { success: false, message: roleError.message }
  }

  return { success: true }
}

// ======================
// USER ROLES
// ======================
export async function getUserRoles(userId: string) {
  const supabase = await getSupabase()

  const { data: roles, error } = await supabase
    .from("user_roles")
    .select(`role:system_role(name, id)`)
    .eq("user_id", userId)

  if (error) return { success: false, message: error.message, data: [] }

  return { success: true, data: roles }
}

// ======================
// USER PERMISSIONS
// ======================
export async function getUserPermissions(userId: string) {
  const supabase = await getSupabase()

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select(`role_id`)
    .eq("user_id", userId)

  if (roleError) return { success: false, message: roleError.message, data: [] }
  if (!roles || roles.length === 0) return { success: true, data: [] }

  const roleIds = roles.map((r) => r.role_id)

  const { data: permissions, error: permError } = await supabase
    .from("role_permissions")
    .select(`permission:permission(name, code), role:system_role(name)`)
    .in("role_id", roleIds)

  if (permError) return { success: false, message: permError.message, data: [] }

  return { success: true, data: permissions }
}
