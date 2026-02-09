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

  // Sync state when activeOrg changes (e.g. data loaded)
  React.useEffect(() => {
    if (activeOrg && activeOrg.id !== selectedOrg?.id) {
      setSelectedOrg(activeOrg);
    }
  }, [activeOrg, selectedOrg]);

  // Handle switching organization
  const handleSwitchOrg = (org: typeof userOrganizations[0]) => {
    setSelectedOrg(org);
    // Update global store
    setOrganizationId(org.organization_id, org.organization_name);

    // Optional: Force reload or trigger server action if switching requires backend validation/session update
    // window.location.reload(); 
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
                  {selectedOrg ? selectedOrg.organization_name : "Select Organization"}
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
              <Link href="/organization/new">
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
