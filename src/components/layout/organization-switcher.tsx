"use client";

import * as React from "react";
import { ChevronsUpDown, Building2, Plus, Check, Command } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/user-store";
import { useOrgStore } from "@/store/org-store";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar();
  const { userOrganizations } = useAuthStore();
  const { organizationId, setOrganizationId } = useOrgStore();

  // Find the active organization based on the store's organizationId
  const activeOrg = React.useMemo(() => {
    return userOrganizations?.find(org => org.organization_id === organizationId) || userOrganizations?.[0] || null;
  }, [userOrganizations, organizationId]);

  const [selectedOrg, setSelectedOrg] = React.useState<typeof userOrganizations[0] | null>(activeOrg);

  // Sync state when activeOrg changes (e.g. data loaded or fallback happened)
  React.useEffect(() => {
    if (activeOrg) {
      if (activeOrg.id !== selectedOrg?.id) {
        setSelectedOrg(activeOrg);
      }
      if (activeOrg.organization_id !== organizationId) {
        // Automatically fix the global store if the ID was invalid (e.g. from an old session)
        setOrganizationId(activeOrg.organization_id, activeOrg.organization_name);

        // Ensure the server cookie matches as well
        fetch("/api/organization/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId: activeOrg.organization_id }),
        }).catch(console.error);
      }
    }
  }, [activeOrg, selectedOrg, organizationId, setOrganizationId]);

  // Handle switching organization
  const handleSwitchOrg = async (org: typeof userOrganizations[0]) => {
    try {
      setSelectedOrg(org);
      // Update global store
      setOrganizationId(org.organization_id, org.organization_name);

      // Call API to set cookie (this handles setting the `org_id` correctly on the server)
      const cookieResponse = await fetch("/api/organization/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId: org.organization_id }),
      });

      if (!cookieResponse.ok) {
        throw new Error("Failed to set organization cookie");
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      // Force reload to trigger server action to refetch data with new context
      window.location.reload();
    } catch (e) {
      console.error(e);
      document.cookie = `org_id=${org.organization_id}; path=/; max-age=31536000`; // 1 year expiry fallback
      window.location.reload();
    }
  };


  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {selectedOrg?.organization_name || "Select Organization"}
                </span>
                <span className="truncate text-xs">
                  {selectedOrg ? "Active" : "No Organization"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {userOrganizations?.map((org, index) => (
              <DropdownMenuItem
                key={org.id || index}
                onClick={() => handleSwitchOrg(org)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Building2 className="size-4 shrink-0" />
                </div>
                {org.organization_name}
                {selectedOrg?.id === org.id && <Check className="ml-auto size-4" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" asChild>
              <Link href="/onboarding/setup">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Add Organization</div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
