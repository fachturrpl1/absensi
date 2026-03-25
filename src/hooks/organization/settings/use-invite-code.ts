"use client";

// src/hooks/organization/settings/use-invite-code.ts
// Mengelola show/hide, copy, dan regenerate invite code

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { regenerateInviteCode, getCurrentUserOrganization } from "@/action/organization-settings";
import { useOrgStore } from "@/store/org-store";
import type { OrganizationData } from "@/types/organization/org-settings";

export function useInviteCode(
  orgData: OrganizationData | null | undefined,
  onOrgDataRefresh: (data: OrganizationData) => void,
) {
  const queryClient = useQueryClient();
  const orgStore = useOrgStore();

  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const toggleShowInviteCode = useCallback(() => {
    setShowInviteCode((prev) => !prev);
  }, []);

  const copyInviteCode = useCallback(async () => {
    if (!orgData?.inv_code) return;
    await navigator.clipboard.writeText(orgData.inv_code);
    setInviteCodeCopied(true);
    toast.success("Invite code copied to clipboard!");
    setTimeout(() => setInviteCodeCopied(false), 2000);
  }, [orgData?.inv_code]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      const result = await regenerateInviteCode(String(orgStore.organizationId));
      if (result.success) {
        toast.success(result.message);
        // Refresh data supaya inv_code terbaru tampil
        const refreshResult = await getCurrentUserOrganization();
        if (refreshResult.success && refreshResult.data) {
          onOrgDataRefresh(refreshResult.data as unknown as OrganizationData);
          queryClient.invalidateQueries({ queryKey: ["organization"] });
        }
      } else {
        toast.error(result.message || "Failed to regenerate invitation code");
      }
    } catch {
      toast.error("An error occurred while regenerating invitation code");
    } finally {
      setRegenerating(false);
    }
  }, [orgStore.organizationId, onOrgDataRefresh, queryClient]);

  return {
    showInviteCode,
    inviteCodeCopied,
    regenerating,
    toggleShowInviteCode,
    copyInviteCode,
    handleRegenerate,
  };
}