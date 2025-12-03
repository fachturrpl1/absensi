"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOrgStore } from "@/store/org-store"
import { useUserStore } from "@/store/user-store"
import { Organization } from "@/lib/types/organization"
import { getUserOrganizations } from "@/action/auth-multi-org"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Building2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"


export default function OrganizationSelector() {
  const router = useRouter()
  const orgStore = useOrgStore()
  const userStore = useUserStore()
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch organizations from API
        const result = await getUserOrganizations()
        
        if (result.success && result.organizations && result.organizations.length > 0) {
          orgStore.setOrganizations(result.organizations)
          setOrganizations(result.organizations)
        } else {
          setError(result.message || "No organizations found. Please contact administrator.")
        }
      } catch (err) {
        console.error("Error loading organizations:", err)
        setError("Failed to load organizations")
      } finally {
        setLoading(false)
      }
    }

    loadOrganizations()
  }, [])

  
  const handleSelectOrganization = (org: Organization) => {
    console.log("Selecting organization:", org)
    
    // Set organization in store
    orgStore.setOrganizationId(org.id, org.name)
    orgStore.setTimezone(org.timezone)
    
    userStore.setRole("A001", 1)
    
    // Set cookie for middleware to recognize organization selection
    document.cookie = `org_id=${org.id}; path=/; max-age=2592000`
    
    console.log("Organization and role set")
    console.log("orgStore state:", orgStore)
    console.log("userStore state:", userStore)
    console.log("Cookie set: org_id=", org.id)
    
    // Wait for store to persist before redirecting
    setTimeout(() => {
      console.log("Redirecting to dashboard")
      router.push("/")
    }, 500)
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 max-w-6xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Select Organization</h1>
          <p className="text-muted-foreground">Choose an organization to manage</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 max-w-6xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Select Organization</h1>
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
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Select Organization</h1>
          <p className="text-muted-foreground">
            Choose an organization to manage or create a new one
          </p>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.length > 0 ? (
          organizations.map((org) => (
            <Card
              key={org.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
              onClick={() => handleSelectOrganization(org)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                  </div>
                </div>
                <CardDescription>{org.code}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Organization Info */}
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

                {/* Roles */}
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

                {/* Select Button */}
                <Button className="w-full mt-4" onClick={() => handleSelectOrganization(org)}>
                  Select Organization
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No organizations found. Create a new organization to get started.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Create New Organization Button
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleCreateOrganization}
          size="lg"
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Create New Organization
        </Button>
      </div> */}
    </div>
  )
}
