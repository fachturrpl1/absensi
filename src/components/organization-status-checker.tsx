"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkOrganizationStatus, OrganizationStatus } from "@/action/organization";

import { organizationLogger } from '@/lib/logger';
interface OrganizationStatusCheckerProps {
  children: React.ReactNode;
}

export default function OrganizationStatusChecker({ children }: OrganizationStatusCheckerProps) {
  const [status, setStatus] = useState<OrganizationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't check if already on status pages
    if (pathname === '/organization-inactive' || pathname === '/subscription-expired') {
      setLoading(false);
      return;
    }

    async function checkStatus() {
      try {
        const result = await checkOrganizationStatus();
        setStatus(result);

        // Redirect to appropriate page if organization is not valid
        if (!result.isValid && result.reason && result.reason !== "not_found") {
          if (result.reason === "inactive") {
            router.replace('/organization-inactive');
          } else if (result.reason === "expired") {
            // Extract only date part (YYYY-MM-DD) from ISO timestamp
            let dateOnly = '';
            if (result.expirationDate) {
              try {
                dateOnly = new Date(result.expirationDate).toISOString().split('T')[0];
              } catch {
                dateOnly = result.expirationDate.split('T')[0]; // Fallback
              }
            }
            const expiredUrl = dateOnly 
              ? `/subscription-expired?date=${dateOnly}`
              : '/subscription-expired';
            router.replace(expiredUrl);
          }
        }
      } catch (error) {
        // Silently fail open - don't log network errors to console
        // Only log if it's not a network error
        if (error && !(error instanceof TypeError && error.message.includes('fetch'))) {
          organizationLogger.error("Failed to check organization status:", error);
        }
        setStatus({ isValid: true }); // Fail open untuk menghindari lock-out
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
    
    // Recheck every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [pathname, router]);

  // Show loading spinner while checking
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Organization is valid, show content
  return <>{children}</>;
}
