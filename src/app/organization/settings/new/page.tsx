"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOrgStore } from "@/store/org-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from "lucide-react"

const STEPS = [
  { number: 1, title: "Organization Info", description: "Basic organization details" },
  { number: 2, title: "Basic Settings", description: "Work hours and policies" },
  { number: 3, title: "Import Members", description: "Upload member data" },
  { number: 4, title: "Role Assignment", description: "Set default roles" },
]

export default function NewOrganization() {
  const router = useRouter()
  const orgStore = useOrgStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    orgName: "",
    orgCode: "",
    timezone: "Asia/Jakarta",
    workStartTime: "08:00",
    workEndTime: "17:00",
    defaultRoleId: "1",
  })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.orgName || !formData.orgCode) {
        setError("Organization name and code are required")
        return
      }
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      setError(null)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleCompleteSetup = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Validate all required data
      if (!formData.orgName || !formData.orgCode) {
        setError("Organization information is incomplete")
        return
      }

      if (!formData.defaultRoleId) {
        setError("Default role is not selected")
        return
      }

      // Simulate API call
      console.log("Creating organization:", formData)
      
      // Set organization in store
      orgStore.setOrganizationId(1, formData.orgName)
      orgStore.setTimezone(formData.timezone)

      // Redirect to dashboard
      router.push("/")
    } catch (err) {
      console.error("Error completing setup:", err)
      setError(err instanceof Error ? err.message : "Failed to complete setup")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Setup Your Organization</h1>
        <p className="text-muted-foreground">
          Complete these steps to set up your organization. This should take about 5 minutes.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {STEPS.map((step) => (
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
            <div className="text-center">
              <p className="text-xs font-medium hidden md:block">{step.title}</p>
              <p className="text-xs text-muted-foreground hidden md:block">{step.description}</p>
            </div>
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

      {/* Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Step {currentStep}: {STEPS[currentStep - 1]?.title}
          </CardTitle>
          <CardDescription>{STEPS[currentStep - 1]?.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                <Input
                  id="orgCode"
                  placeholder="e.g., PTMJ"
                  value={formData.orgCode}
                  onChange={(e) => handleInputChange("orgCode", e.target.value)}
                />
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

            {currentStep === STEPS.length ? (
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
              <p className="text-center font-medium">Setting up your organization...</p>
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




