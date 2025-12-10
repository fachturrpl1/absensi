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
import { AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { createOrganization, validateOrganizationCode } from "@/action/create-organization"

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
  }, [])

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
    } catch (err) {
      console.error("Error validating code:", err)
      setCodeValid(false)
    } finally {
      setCodeValidating(false)
    }
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.orgName || !formData.orgCode) {
        setError("Organization name and code are required")
        return
      }
      if (!codeValid) {
        setError("Organization code is invalid or already exists")
        return
      }
    }

    if (currentStep < SETUP_STEPS.length) {
      setCurrentStep(currentStep + 1)
      setError(null)
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

      console.log("[NEW-ORG] Creating organization:", formData)
      
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
        setError(result.message || "Failed to create organization")
        return
      }

      console.log("[NEW-ORG] Organization created:", result.data)
      
      // Set organization in store with actual data from server
      if (result.data) {
        orgStore.setOrganizationId(result.data.organizationId, result.data.organizationName)
        orgStore.setTimezone(formData.timezone)
        userStore.setRole("A001", result.data.organizationId)

        // Redirect to dashboard
        router.push("/")
      }
    } catch (err) {
      console.error("[NEW-ORG] Error completing setup:", err)
      setError(err instanceof Error ? err.message : "Failed to complete setup")
    } finally {
      setIsSubmitting(false)
    }
  }

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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 overflow-auto max-w-4xl mx-auto w-full">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create</h1>
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
                        onChange={(e) => handleInputChange("orgCode", e.target.value)}
                        disabled={codeValidating}
                      />
                      {codeValidating && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                    {!codeValid && formData.orgCode && (
                      <p className="text-sm text-red-500">Code is invalid or already exists</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      placeholder="e.g., Asia/Jakarta"
                      value={formData.timezone}
                      onChange={(e) => handleInputChange("timezone", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Basic Settings */}
              {currentStep === 2 && (
                <div className="space-y-4">
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
              )}

              {/* Step 3: Import Members */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">
                      Upload member data via Excel file
                    </p>
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="mt-4"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Role Assignment */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultRole">Default Role</Label>
                    <select
                      id="defaultRole"
                      value={formData.defaultRoleId}
                      onChange={(e) => handleInputChange("defaultRoleId", e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="1">Admin</option>
                      <option value="2">Manager</option>
                      <option value="3">Staff</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

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

      {/* Submitting State */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-center font-medium">Creating your organization...</p>
              <p className="text-center text-sm text-muted-foreground">
                This may take a moment. Please don't close this window.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


