"use client"

import { useEffect, useState, useRef } from "react"
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

// Type for geo data
interface GeoCity {
  value: string
  label: string
  postal_codes?: string[]  // Multiple postal codes per city
}

interface GeoState {
  value: string
  label: string
  state_code?: string
  cities: GeoCity[]
}

interface GeoCountry {
  code: string
  name: string
  states: GeoState[]
}

const SETUP_STEPS = [
  { number: 1, title: "Organization Info"},
  { number: 2, title: "Address & Location"},
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
  const [roles, setRoles] = useState<Array<{ id: string; code: string; name: string }>>(
    [
      { id: "1", code: "A001", name: "Admin" },
      { id: "2", code: "US001", name: "User" },
      { id: "5", code: "SA001", name: "Super Admin" },
      { id: "6", code: "SP001", name: "Support" },
      { id: "7", code: "B001", name: "Billing" },
      { id: "8", code: "P001", name: "Petugas" },
    ]
  )
  const [locationData, setLocationData] = useState<GeoCountry | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [formData, setFormData] = useState({
    orgName: "",
    orgCode: "",
    timezone: "Asia/Jakarta",
    address: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    defaultRoleId: "A001",
  })
  const [codeValidating, setCodeValidating] = useState(false)
  const [codeValid, setCodeValid] = useState(true)
  const [availableCities, setAvailableCities] = useState<GeoCity[]>([])
  const [availablePostalCodes, setAvailablePostalCodes] = useState<string[]>([])
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const codeValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsHydrated(true)
    loadInitialData()
    
    // Cleanup timeout on unmount
    return () => {
      if (codeValidationTimeoutRef.current) {
        clearTimeout(codeValidationTimeoutRef.current)
      }
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true)
      const [tzResult, rolesResult, geoResult] = await Promise.all([
        getAvailableTimezones(),
        getAvailableRoles(),
        fetch('/api/geo/ID').then(res => res.json()).catch(() => null)
      ])
      setTimezones(tzResult)
      
      // Load geo data for Indonesia
      if (geoResult && geoResult.code === 'ID') {
        setLocationData(geoResult)
        console.log("[LOAD-DATA] Geo data loaded for Indonesia:", geoResult.states.length, "provinces")
      } else {
        console.warn("[LOAD-DATA] Failed to load geo data")
        setLocationData(null)
      }
      
      // If roles is empty, use fallback roles
      if (rolesResult && rolesResult.length > 0) {
        setRoles(rolesResult)
      } else {
        console.warn("[LOAD-DATA] No roles from database, using fallback")
        setRoles([
          { id: "1", code: "A001", name: "Admin" },
          { id: "2", code: "US001", name: "User" },
          { id: "5", code: "SA001", name: "Super Admin" },
          { id: "6", code: "SP001", name: "Support" },
          { id: "7", code: "B001", name: "Billing" },
          { id: "8", code: "P001", name: "Petugas" },
        ])
      }
    } catch (err) {
      console.error("Error loading initial data:", err)
      toast.error("Failed to load form data")
      // Set fallback roles on error
      setRoles([
        { id: "1", code: "A001", name: "Admin" },
        { id: "2", code: "US001", name: "User" },
        { id: "5", code: "SA001", name: "Super Admin" },
        { id: "6", code: "SP001", name: "Support" },
        { id: "7", code: "B001", name: "Billing" },
        { id: "8", code: "P001", name: "Petugas" },
      ])
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Update cities when province changes
    if (field === "stateProvince") {
      if (locationData) {
        const selectedState = locationData?.states.find(s => s.value === value)
        if (selectedState) {
          setAvailableCities(selectedState.cities)
          setAvailablePostalCodes([])
          // Reset city and postal code when province changes
          setFormData(prev => ({
            ...prev,
            city: "",
            postalCode: ""
          }))
        } else {
          setAvailableCities([])
          setAvailablePostalCodes([])
        }
      }
    }
    
    // Update postal codes when city changes
    if (field === "city" && formData.stateProvince) {
      if (locationData) {
        const selectedState = locationData?.states.find(s => s.value === formData.stateProvince)
        if (selectedState) {
          const selectedCity = selectedState.cities.find(c => c.value === value)
          if (selectedCity && selectedCity.postal_codes && selectedCity.postal_codes.length > 0) {
            // If city has postal_codes array, populate dropdown with all of them
            setAvailablePostalCodes(selectedCity.postal_codes)
          } else {
            // If no postal_codes in geo data, leave empty for user to input
            setAvailablePostalCodes([])
          }
          setFormData(prev => ({
            ...prev,
            postalCode: ""
          }))
        }
      }
    }
    
    // Debounce organization code validation (wait 1 second after user stops typing)
    if (field === "orgCode") {
      // Clear previous timeout
      if (codeValidationTimeoutRef.current) {
        clearTimeout(codeValidationTimeoutRef.current)
      }
      
      // Set new timeout for validation
      codeValidationTimeoutRef.current = setTimeout(() => {
        validateCode(value)
      }, 1000)
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

      console.log("[NEW-ORG] Creating organization:", formData)
      const toastId = toast.loading("Creating organization...")
      
      // Call server action to create organization
      const result = await createOrganization({
        orgName: formData.orgName,
        orgCode: formData.orgCode,
        timezone: formData.timezone,
        address: formData.address,
        city: formData.city,
        stateProvince: formData.stateProvince,
        postalCode: formData.postalCode,
        defaultRoleId: formData.defaultRoleId,
      })

      if (!result.success) {
        const errorMsg = result.message || "Failed to create organization"
        const errorDetail = result.error ? ` (${result.error})` : ""
        const fullError = errorMsg + errorDetail
        
        console.error("[NEW-ORG] Creation failed:", {
          message: result.message,
          error: result.error,
          fullError: fullError,
        })
        
        toast.dismiss(toastId)
        toast.error(fullError)
        setError(fullError)
        return
      }

      console.log("[NEW-ORG] Organization created:", result.data)
      
      // Set organization in store with actual data from server
      if (result.data) {
        orgStore.setOrganizationId(result.data.organizationId, result.data.organizationName)
        orgStore.setTimezone(formData.timezone)
        userStore.setRole("A001", result.data.organizationId)

        toast.dismiss(toastId)
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
      setShowCancelDialog(true)
    } else {
      router.push("/organization")
    }
  }

  const handleConfirmCancel = () => {
    setShowCancelDialog(false)
    router.push("/organization")
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

          {/* Step 2: Address */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="e.g., Jl. Merdeka No. 123"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stateProvince">State/Province</Label>
                  <select
                    id="stateProvince"
                    value={formData.stateProvince}
                    onChange={(e) => handleInputChange("stateProvince", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="">-- Select Province --</option>
                    {locationData?.states.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <select
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    disabled={!formData.stateProvince || availableCities.length === 0}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select City --</option>
                    {availableCities.map((city, index) => (
                      <option key={`${city.value}-${index}`} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <select
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    disabled={!formData.city || availablePostalCodes.length === 0}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select Postal Code --</option>
                    {availablePostalCodes.length > 0 ? (
                      availablePostalCodes.map((code, idx) => (
                        <option key={`${code}-${idx}`} value={code}>
                          {code}
                        </option>
                      ))
                    ) : (
                      <option value="">-- No postal code available --</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> Select province first, then city and postal code will be available. All fields are optional and can be updated later.
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
                  {roles.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.name}
                    </option>
                  ))}
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

      {/* Custom Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Cancel Organization Setup?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are on <strong>Step {currentStep} of {SETUP_STEPS.length}</strong>. If you cancel now, all your progress will be lost.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-amber-900 dark:text-amber-100">
                  <strong>Data that will be lost:</strong>
                  {formData.orgName && <div>• Organization Name: {formData.orgName}</div>}
                  {formData.orgCode && <div>• Organization Code: {formData.orgCode}</div>}
                  {formData.address && <div>• Address: {formData.address}</div>}
                  {formData.city && <div>• City: {formData.city}</div>}
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(false)}
                  className="px-6"
                >
                  Continue Setup
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmCancel}
                  className="px-6"
                >
                  Yes, Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
