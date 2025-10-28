"use server";

import { createClient } from "@/utils/supabase/server";
import { IMemberInvitation } from "@/interface";
import { sendInvitationEmailViaSupabase, sendInvitationEmail } from "@/lib/email";

// Toggle email service:
// true = Supabase built-in email (only works for NEW emails)
// false = Resend (works for all emails, but requires third-party)
const USE_SUPABASE_EMAIL = true;

/**
 * Server Actions for Member Invitation System
 * Handles invitation CRUD operations and acceptance flow
 */

// ============================================
// 1. CREATE INVITATION
// ============================================

interface CreateInvitationData {
  email: string;
  role_id?: string;
  department_id?: string;
  position_id?: string;
  message?: string;
}

export async function createInvitation(data: CreateInvitationData) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated", data: null };
    }

    // Get user's organization
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return {
        success: false,
        message: "User not member of any organization",
        data: null,
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, message: "Invalid email format", data: null };
    }

    // Check if email already registered in auth system
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());

    if (existingAuthUser) {
      // Check if they're already a member of this organization
      const { data: existingOrgMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", member.organization_id)
        .eq("user_id", existingAuthUser.id)
        .maybeSingle();

      if (existingOrgMember) {
        return {
          success: false,
          message: "⚠️ This user is already a member of your organization. You can view them in the Members list.",
          data: null,
        };
      }

      return {
        success: false,
        message: "⚠️ This email is already registered in the system. Please contact your administrator to add this user directly to your organization.",
        data: null,
      };
    }

    // Check if pending invitation already exists for this email
    const { data: existingInvitation } = await supabase
      .from("member_invitations")
      .select("id, status, expires_at")
      .eq("organization_id", member.organization_id)
      .eq("email", data.email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvitation) {
      const expiresAt = new Date(existingInvitation.expires_at);
      const now = new Date();
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        success: false,
        message: `⚠️ A pending invitation already exists for this email (expires in ${daysLeft} days). Please go to Settings > Invitations to resend or cancel it.`,
        data: null,
      };
    }

    // Auto-expire old pending invitations for this email
    await supabase
      .from("member_invitations")
      .update({ status: "expired" })
      .eq("organization_id", member.organization_id)
      .eq("email", data.email)
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    // Create new invitation
    const { data: invitation, error } = await supabase
      .from("member_invitations")
      .insert({
        organization_id: member.organization_id,
        email: data.email,
        invited_by: user.id,
        role_id: data.role_id || null,
        department_id: data.department_id || null,
        position_id: data.position_id || null,
        message: data.message || null,
      })
      .select(
        `
        *,
        organization:organizations(*),
        role:system_roles(*),
        department:departments(*),
        position:positions(*)
      `
      )
      .single();

    if (error) {
      return { success: false, message: error.message, data: null };
    }

    // Send invitation email
    try {
      const orgData = invitation.organization as any;

      if (USE_SUPABASE_EMAIL) {
        // Use Supabase built-in email (only works for NEW users)
        const emailResult = await sendInvitationEmailViaSupabase({
          to: invitation.email,
          invitationToken: invitation.invitation_token,
          organizationName: orgData?.name,
          message: invitation.message || undefined,
        });

        // If email was skipped (user already registered), that's OK
        // Invitation is still created, just no email sent
        if (emailResult.skipEmail) {
          console.log("Email skipped for registered user. Invitation created without email.");
        }
      } else {
        // Option 2: Use Resend (requires API key)
        const { data: inviterProfile } = await supabase
          .from("user_profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        const inviterName = inviterProfile
          ? `${inviterProfile.first_name || ""} ${inviterProfile.last_name || ""}`.trim()
          : "Someone";

        await sendInvitationEmail({
          to: invitation.email,
          organizationName: orgData?.name || "the organization",
          inviterName: inviterName || "Team",
          invitationToken: invitation.invitation_token,
          message: invitation.message || undefined,
        });
      }
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the invitation creation if email fails
    }

    return {
      success: true,
      message: "Invitation sent successfully",
      data: invitation as IMemberInvitation,
    };
  } catch (error) {
    console.error("Error creating invitation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}

// ============================================
// 2. GET INVITATION BY TOKEN
// ============================================

export async function getInvitationByToken(token: string) {
  try {
    const supabase = await createClient();

    const { data: invitation, error } = await supabase
      .from("member_invitations")
      .select(
        `
        *,
        organization:organizations(*),
        role:system_roles(*),
        department:departments(*),
        position:positions(*)
      `
      )
      .eq("invitation_token", token)
      .maybeSingle();

    if (error) {
      return { success: false, message: error.message, data: null };
    }

    if (!invitation) {
      return { success: false, message: "Invitation not found", data: null };
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Auto-update status to expired
      await supabase
        .from("member_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return { success: false, message: "Invitation has expired", data: null };
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return {
        success: false,
        message: "Invitation has already been accepted",
        data: null,
      };
    }

    // Check if cancelled
    if (invitation.status === "cancelled") {
      return {
        success: false,
        message: "Invitation has been cancelled",
        data: null,
      };
    }

    return {
      success: true,
      message: "Invitation found",
      data: invitation as IMemberInvitation,
    };
  } catch (error) {
    console.error("Error getting invitation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}

// ============================================
// 3. ACCEPT INVITATION
// ============================================

interface AcceptInvitationData {
  token: string;
  first_name: string;
  last_name: string;
  password: string;
}

export async function acceptInvitation(data: AcceptInvitationData) {
  try {
    const supabase = await createClient();

    // Get invitation
    const invitationResult = await getInvitationByToken(data.token);
    if (!invitationResult.success || !invitationResult.data) {
      return {
        success: false,
        message: invitationResult.message,
        data: null,
      };
    }

    const invitation = invitationResult.data;

    // Create user account via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
      },
    });

    if (authError) {
      return { success: false, message: authError.message, data: null };
    }

    if (!authData.user) {
      return { success: false, message: "Failed to create user", data: null };
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        email: invitation.email,
        first_name: data.first_name,
        last_name: data.last_name,
        is_active: true,
      });

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      // Continue anyway, profile might already exist
    }

    // Create organization member
    const { data: orgMember, error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: invitation.organization_id,
        user_id: authData.user.id,
        role_id: invitation.role_id || null,
        department_id: invitation.department_id || null,
        position_id: invitation.position_id || null,
        hire_date: new Date().toISOString().split("T")[0],
        is_active: true,
      })
      .select()
      .single();

    if (memberError) {
      return { success: false, message: memberError.message, data: null };
    }

    // Update invitation status
    await supabase
      .from("member_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    return {
      success: true,
      message: "Invitation accepted successfully",
      data: orgMember,
    };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}

// ============================================
// 4. GET ALL INVITATIONS (for dashboard)
// ============================================

export async function getAllInvitations(status?: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "User not authenticated", data: [] };
    }

    // Get user's organization
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return {
        success: false,
        message: "User not member of any organization",
        data: [],
      };
    }

    // Build query
    let query = supabase
      .from("member_invitations")
      .select(
        `
        *,
        inviter:user_profiles!invited_by(*),
        role:system_roles(*),
        department:departments(*),
        position:positions(*)
      `
      )
      .eq("organization_id", member.organization_id)
      .order("created_at", { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data: invitations, error } = await query;

    if (error) {
      return { success: false, message: error.message, data: [] };
    }

    return {
      success: true,
      data: invitations as IMemberInvitation[],
    };
  } catch (error) {
    console.error("Error getting invitations:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: [],
    };
  }
}

// ============================================
// 5. RESEND INVITATION
// ============================================

export async function resendInvitation(invitationId: string) {
  try {
    const supabase = await createClient();

    // Get invitation
    const { data: invitation, error: getError } = await supabase
      .from("member_invitations")
      .select("*")
      .eq("id", invitationId)
      .maybeSingle();

    if (getError || !invitation) {
      return {
        success: false,
        message: "Invitation not found",
        data: null,
      };
    }

    // Check if already accepted or cancelled
    if (invitation.status === "accepted") {
      return {
        success: false,
        message: "Cannot resend accepted invitation",
        data: null,
      };
    }

    if (invitation.status === "cancelled") {
      return {
        success: false,
        message: "Cannot resend cancelled invitation",
        data: null,
      };
    }

    // Extend expiration by 7 days
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const { data: updated, error: updateError } = await supabase
      .from("member_invitations")
      .update({
        expires_at: newExpiresAt.toISOString(),
        status: "pending",
      })
      .eq("id", invitationId)
      .select()
      .single();

    if (updateError) {
      return { success: false, message: updateError.message, data: null };
    }

    // Resend invitation email
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", updated.organization_id)
        .single();

      if (USE_SUPABASE_EMAIL) {
        // Option 1: Use Supabase built-in email
        await sendInvitationEmailViaSupabase({
          to: updated.email,
          invitationToken: updated.invitation_token,
          organizationName: org?.name,
          message: updated.message || undefined,
        });
      } else {
        // Option 2: Use Resend
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: inviterProfile } = await supabase
            .from("user_profiles")
            .select("first_name, last_name")
            .eq("id", user.id)
            .single();

          const inviterName = inviterProfile
            ? `${inviterProfile.first_name || ""} ${inviterProfile.last_name || ""}`.trim()
            : "Team";

          await sendInvitationEmail({
            to: updated.email,
            organizationName: org?.name || "the organization",
            inviterName,
            invitationToken: updated.invitation_token,
            message: updated.message || undefined,
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to resend invitation email:", emailError);
    }

    return {
      success: true,
      message: "Invitation resent successfully",
      data: updated as IMemberInvitation,
    };
  } catch (error) {
    console.error("Error resending invitation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}

// ============================================
// 6. CANCEL INVITATION
// ============================================

export async function cancelInvitation(invitationId: string) {
  try {
    const supabase = await createClient();

    const { data: updated, error } = await supabase
      .from("member_invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationId)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message, data: null };
    }

    return {
      success: true,
      message: "Invitation cancelled successfully",
      data: updated as IMemberInvitation,
    };
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}

// ============================================
// 7. DELETE INVITATION
// ============================================

export async function deleteInvitation(invitationId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("member_invitations")
      .delete()
      .eq("id", invitationId);

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: "Invitation deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
