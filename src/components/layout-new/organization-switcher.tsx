"use client";

import * as React from "react";
import { ChevronsUpDown, Building2, Plus, Check } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/user-store";

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
  
  // We can use a local state or store state for the selected org.
  // For now, let's default to the first one or a placeholder.
  // In a real app, this might be persisted or come from the URL/current sessionContext.
  const [selectedOrg, setSelectedOrg] = React.useState<typeof userOrganizations[0] | null>(
    userOrganizations?.[0] || null
  );

  React.useEffect(() => {
    if (userOrganizations?.length > 0 && !selectedOrg) {
        setSelectedOrg(userOrganizations[0]);
    }
  }, [userOrganizations, selectedOrg]);


  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-4" />
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
                onClick={() => setSelectedOrg(org)}
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
