"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOrgStore } from "@/store/org-store"
import { useUserStore } from "@/store/user-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Home } from "lucide-react"
import { createOrganization, validateOrganizationCode, getAvailableTimezones, getAvailableRoles } from "@/action/create-organization"
import { toast } from "sonner"

const SETUP_STEPS = [
  { number: 1, title: "Organization Info"},
  { number: 2, title: "Basic Settings"},
  { number: 3, title: "Import Members"},
  { number: 4, title: "Role Assignment"},
]

export default function NewOrganizationPage() {
  const router = useRouter()
  const orgStore = useOrgStore()
  const userStore = useUserStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [timezones, setTimezones] = useState<string[]>([])
  const [roles, setRoles] = useState<Array<{ id: string; code: string; name: string }>>([]) 
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [formData, setFormData] = useState({
    orgName: "",
    orgCode: "",
    timezone: "Asia/Jakarta",
    workStartTime: "08:00",
    workEndTime: "17:00",
    defaultRoleId: "A001",
  })
  const [codeValidating, setCodeValidating] = useState(false)
  const [codeValid, setCodeValid] = useState(true)

  useEffect(() => {
    setIsHydrated(true)
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true)
      const [tzResult, rolesResult] = await Promise.all([
        getAvailableTimezones(),
        getAvailableRoles()
      ])
      setTimezones(tzResult)
      setRoles(rolesResult)
    } catch (err) {
      console.error("Error loading initial data:", err)
      toast.error("Failed to load form data")
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Validate organization code when it changes
    if (field === "orgCode") {
      validateCode(value)
    }
  }

  const validateCode = async (code: string) => {
    if (!code || code.length < 2) {
      setCodeValid(false)
      return
    }
    
    setCodeValidating(true)
    try {
      const result = await validateOrganizationCode(code)
      setCodeValid(result.isValid)
      if (!result.isValid) {
        toast.error(result.message || "Organization code already exists")
      }
    } catch (err) {
      console.error("Error validating code:", err)
      setCodeValid(false)
      toast.error("Failed to validate organization code")
    } finally {
      setCodeValidating(false)
    }
  }

  const validateWorkTimes = (): boolean => {
    const startTime = new Date(`2024-01-01 ${formData.workStartTime}`)
    const endTime = new Date(`2024-01-01 ${formData.workEndTime}`)
    
    if (endTime <= startTime) {
      setError("Work end time must be after work start time")
      return false
    }
    return true
  }

  const handleNextStep = () => {
    setError(null)
    
    if (currentStep === 1) {
      if (!formData.orgName || !formData.orgName.trim()) {
        setError("Organization name is required")
        return
      }
      if (formData.orgName.length < 2) {
        setError("Organization name must be at least 2 characters")
        return
      }
      if (!formData.orgCode || !formData.orgCode.trim()) {
        setError("Organization code is required")
        return
      }
      if (!codeValid) {
        setError("Organization code is invalid or already exists")
        return
      }
    }

    if (currentStep === 2) {
      if (!validateWorkTimes()) {
        return
      }
    }

    if (currentStep < SETUP_STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleCompleteSetup = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (!formData.orgName || !formData.orgCode) {
        setError("Organization information is incomplete")
        return
      }

      if (!codeValid) {
        setError("Organization code is invalid or already exists")
        return
      }

      if (!validateWorkTimes()) {
        return
      }

      console.log("[NEW-ORG] Creating organization:", formData)
      toast.loading("Creating organization...")
      
      // Call server action to create organization
      const result = await createOrganization({
        orgName: formData.orgName,
        orgCode: formData.orgCode,
        timezone: formData.timezone,
        workStartTime: formData.workStartTime,
        workEndTime: formData.workEndTime,
        defaultRoleId: formData.defaultRoleId,
      })

      if (!result.success) {
        toast.error(result.message || "Failed to create organization")
        setError(result.message || "Failed to create organization")
        return
      }

      console.log("[NEW-ORG] Organization created:", result.data)
      
      // Set organization in store with actual data from server
      if (result.data) {
        orgStore.setOrganizationId(result.data.organizationId, result.data.organizationName)
        orgStore.setTimezone(formData.timezone)
        userStore.setRole("A001", result.data.organizationId)

        toast.success(`Organization "${result.data.organizationName}" created successfully!`)
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push("/")
        }, 1000)
      }
    } catch (err) {
      console.error("[NEW-ORG] Error completing setup:", err)
      const errorMsg = err instanceof Error ? err.message : "Failed to complete setup"
      toast.error(errorMsg)
      setError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (currentStep > 1 || formData.orgName || formData.orgCode) {
      if (confirm("Are you sure you want to cancel? Your progress will be lost.")) {
        router.push("/organization")
      }
    } else {
      router.push("/organization")
    }
  }

  if (!isHydrated || isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 overflow-auto max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
          <p className="text-sm text-muted-foreground">Set up your new organization in a few simple steps</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-10 w-10"
          title="Back to organizations"
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Step {currentStep}: {SETUP_STEPS[currentStep - 1]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {SETUP_STEPS.map((step) => (
              <div key={step.number} className="space-y-2">
                <div
                  className={`flex items-center justify-center h-10 rounded-full font-semibold transition-all ${
                    step.number < currentStep
                      ? "bg-green-600 text-white"
                      : step.number === currentStep
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.number < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <p className="text-xs font-medium text-center hidden md:block">{step.title}</p>
              </div>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Organization Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    placeholder="e.g., PT Maju Jaya"
                    value={formData.orgName}
                    onChange={(e) => handleInputChange("orgName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgCode">Organization Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="orgCode"
                      placeholder="e.g., PTMJ"
                      value={formData.orgCode}
                      onChange={(e) => handleInputChange("orgCode", e.target.value.toUpperCase())}
                      disabled={codeValidating}
                    />
                    {codeValidating && <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />}
                    {!codeValidating && codeValid && formData.orgCode && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                  {!codeValid && formData.orgCode && (
                    <p className="text-sm text-red-500">❌ Code is invalid or already exists</p>
                  )}
                  {codeValid && formData.orgCode && (
                    <p className="text-sm text-green-600">✅ Code is available</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => handleInputChange("timezone", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Basic Settings */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workStartTime">Work Start Time</Label>
                  <Input
                    id="workStartTime"
                    type="time"
                    value={formData.workStartTime}
                    onChange={(e) => handleInputChange("workStartTime", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEndTime">Work End Time</Label>
                  <Input
                    id="workEndTime"
                    type="time"
                    value={formData.workEndTime}
                    onChange={(e) => handleInputChange("workEndTime", e.target.value)}
                  />
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Work Hours:</strong> {formData.workStartTime} - {formData.workEndTime}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Import Members */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>Note:</strong> You can import members later from the Members page. For now, you can skip this step.
                </p>
              </div>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <p className="text-muted-foreground">
                  Upload member data via Excel file (optional)
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="mt-4"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
              </div>
            </div>
          )}

          {/* Step 4: Role Assignment */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultRole">Default Role for New Members</Label>
                <select
                  id="defaultRole"
                  value={formData.defaultRoleId}
                  onChange={(e) => handleInputChange("defaultRoleId", e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  {roles.length === 0 ? (
                    <option value="A001">Admin (Default)</option>
                  ) : (
                    roles.map((role) => (
                      <option key={role.id} value={role.code}>
                        {role.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-muted-foreground">
                  This role will be assigned to new members when they join the organization.
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-900 dark:text-green-100">
                  <strong>Ready to create!</strong> Click "Complete Setup" to create your organization.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            </div>

            {currentStep === SETUP_STEPS.length ? (
              <Button
                onClick={handleCompleteSetup}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
