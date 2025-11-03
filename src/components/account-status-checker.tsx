"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import { accountLogger } from '@/lib/logger';
/**
 * AccountStatusChecker Component
 * 
 * Checks if the current user's account (organization_member) is active.
 * If inactive, redirects to /account-inactive page.
 * 
 * This runs client-side to avoid blocking server rendering.
 */
export default function AccountStatusChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip check on these pages
    const excludedPaths = [
      "/account-inactive",
      "/organization-inactive", 
      "/subscription-expired",
      "/auth/login",
      "/auth/signup",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/verify-email",
      "/onboarding",
    ];

    if (excludedPaths.some(path => pathname.startsWith(path))) {
      return;
    }

    async function checkAccountStatus() {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // Not authenticated, let auth handle it
          return;
        }

        // Check member status
        const { data: member, error: memberError } = await supabase
          .from("organization_members")
          .select("is_active")
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberError) {
          accountLogger.error("Error checking account status:", memberError);
          return;
        }

        // If member exists but is inactive, redirect
        if (member && member.is_active === false) {
          accountLogger.debug("Account is inactive, redirecting to /account-inactive");
          router.replace("/account-inactive");
        }
      } catch (error) {
        accountLogger.error("Error in account status check:", error);
      }
    }

    checkAccountStatus();
  }, [pathname, router]);

  // Render children
  return <>{children}</>;
}
