"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useOrgStore } from "@/store/org-store"
import { useAuthStore } from "@/store/user-store"
import { Organization } from "@/lib/types/organization"
import { getUserOrganizations } from "@/action/auth-multi-org"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  AlertCircle, 
  Building2, 
  Grid, 
  List, 
  Search, 
  Plus,
  Command,
  Settings
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupContent
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/layout-new/nav-user"

export default function OrganizationSelector() {
  const router = useRouter()
  const orgStore = useOrgStore()
  const authStore = useAuthStore()
  
  // State untuk data dan UI
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")

  // Load organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getUserOrganizations()
        
        if (result.success && result.organizations && result.organizations.length > 0) {
          orgStore.setOrganizations(result.organizations)
          setOrganizations(result.organizations)
        } else {
          setError(result.message || "No organizations found.")
        }
      } catch (err) {
        console.error("Error loading organizations:", err)
        setError("Failed to load organizations")
      } finally {
        setLoading(false)
      }
    }

    if (isHydrated) {
      loadOrganizations()
    }
  }, [isHydrated]) // Removed orgStore from dependencies
  
  // Track hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Handle organization selection
  const handleSelectOrganization = (org: Organization) => {
    try {
      console.log("[ORG-SELECTOR] Selecting organization:", org)
      
      // Set organization in store
      console.log("[ORG-SELECTOR] Setting org ID:", org.id, org.name)
      orgStore.setOrganizationId(org.id, org.name)
      
      console.log("[ORG-SELECTOR] Setting timezone:", org.timezone)
      orgStore.setTimezone(org.timezone)
      
      // Set user role
      console.log("[ORG-SELECTOR] Setting role")
      authStore.setRole("admin", 1)
      
      // Set cookie
      document.cookie = `org_id=${org.id}; path=/; max-age=2592000`
      console.log("[ORG-SELECTOR] Cookie set")
      
      console.log("[ORG-SELECTOR] Organization selected, navigating to home...")
      
      // Navigate to home
      router.push("/")
    } catch (error) {
      console.error("[ORG-SELECTOR] Error selecting organization:", error)
    }
  }

  // Filter organizations
  const filteredOrganizations = organizations.filter(org => 
    searchQuery ? (
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      org.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true
  )

  // Sidebar content untuk organization selector
  const OrgSidebar = useCallback(() => (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Attendance</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="All Organizations" asChild>
                  <Link href="/organization-selector">
                    <Building2 />
                    <span>All Organizations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" asChild>
                  <Link href="/organization/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  ), []);

  // Don't render SidebarProvider until hydration is complete
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  // Render layout dengan sidebar dan content
  return (
    <SidebarProvider defaultOpen={true}>
      <OrgSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        </header>
        {/* Main Content Area */}
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 overflow-auto">
          {loading ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                <p className="text-muted-foreground">Loading organizations...</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-8 w-full mt-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                <p className="text-muted-foreground">Choose an organization to manage</p>
              </div>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={() => router.push("/auth/login")} variant="outline">
                Back to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                <p className="text-muted-foreground">
                  Select an organization to manage or create a new one
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search organizations..." 
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => setViewMode("grid")} 
                        className={cn(viewMode === "grid" && "bg-accent")}>
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setViewMode("list")}
                        className={cn(viewMode === "list" && "bg-accent")}>
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Organization
                    </Button>
                  </div>
                </div>
              </div>

              {filteredOrganizations.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {searchQuery ? "No organizations match your search" : "No organizations found. Create a new organization to get started."}
                  </AlertDescription>
                </Alert>
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredOrganizations.map((org) => (
                    <Card 
                      key={org.id}
                      className="hover:shadow-lg transition-all hover:border-primary"
                    >
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                        </div>
                        <CardDescription>{org.code}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Country:</span>
                            <span className="font-medium">{org.country_code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Timezone:</span>
                            <span className="font-medium">{org.timezone}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Your Roles:</p>
                          <div className="flex flex-wrap gap-1">
                            {org.roles.length > 0 ? (
                              org.roles.map((role) => (
                                <Badge key={role.id} variant="secondary" className="text-xs">
                                  {role.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No roles assigned</span>
                            )}
                          </div>
                        </div>

                        <Button 
                          className="w-full mt-4"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSelectOrganization(org)
                          }}
                        >
                          Select Organization
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOrganizations.map((org) => (
                    <Card 
                      key={org.id}
                      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                    >
                      <div className="flex items-center p-4">
                        <div className="flex-shrink-0 mr-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-lg font-medium">{org.name}</h3>
                          <p className="text-sm text-muted-foreground">{org.code}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {org.roles.length > 0 ? (
                              org.roles.map((role) => (
                                <Badge key={role.id} variant="secondary" className="text-xs">
                                  {role.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No roles assigned</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectOrganization(org)
                            }}
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}