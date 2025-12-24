"use client"

import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Fingerprint, Users, RefreshCw, Search, Check, Loader2, Monitor, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"
import { useOrgStore } from "@/store/org-store"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Device {
  device_code: string
  device_name: string
  location: string | null
  organization_id?: number
}

interface Member {
  id: number
  user_id: string
  display_name: string
  first_name: string | null
  phone: string | null
  email: string | null
  department_name: string | null
  finger1_registered: boolean
  finger2_registered: boolean
}

type FilterStatus = "all" | "complete" | "partial" | "unregistered"

export default function FingerPage() {
  const DEBUG = false
  const [members, setMembers] = React.useState<Member[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [devices, setDevices] = React.useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = React.useState("")
  const [loadingDevices, setLoadingDevices] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const [registeringMember, setRegisteringMember] = React.useState<{ member: Member; fingerNumber: 1 | 2 } | null>(null)
  const [isRegistering, setIsRegistering] = React.useState(false)
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all")
  const [selectedStatus, setSelectedStatus] = React.useState<FilterStatus>("all")
  const [activeMemberId, setActiveMemberId] = React.useState<number | null>(null)
  const [activeFingerNumber, setActiveFingerNumber] = React.useState<1 | 2 | null>(null)
  const { organizationId } = useOrgStore()
  const [isHydrated, setIsHydrated] = React.useState(false)
  const router = useRouter()
  const [pageSize, setPageSize] = React.useState("10")
  const [pageIndex, setPageIndex] = React.useState(0)
  const registrationCompleteRef = React.useRef(false)
  const lastPolledStatusRef = React.useRef<string | null>(null)
  const [activeCommandId, setActiveCommandId] = React.useState<string | number | null>(null)
  const realtimeStatusRef = React.useRef<string | null>(null)

  // Throttled logger to avoid console spam on loops/polling
  const lastLogRef = React.useRef<Record<string, number>>({})
  const logOnce = React.useCallback((key: string, level: 'log' | 'warn' | 'error' = 'log', ...args: unknown[]) => {
    const now = Date.now()
    const last = lastLogRef.current[key] || 0
    // 10s throttle per key
    if (now - last > 10000) {
      const logger: Record<'log' | 'warn' | 'error', (...data: unknown[]) => void> = {
        log: console.log,
        warn: console.warn,
        error: console.error,
      }
      logger[level](...args)
      lastLogRef.current[key] = now
    }
  }, [])

  // Handle click on member name to navigate to profile
  const handleMemberClick = (memberId: number) => {
    if (memberId) {
      router.push(`/members/${memberId}`)
    }
  }

  // Hydration effect
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  const fetchDevices = React.useCallback(async () => {
    setLoadingDevices(true)
    try {
      const supabase = createClient()

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('User error:', userError)
        setLoadingDevices(false)
        return
      }
      
      if (!user) {
        console.log('No user logged in')
        setLoadingDevices(false)
        return
      }

      let orgId = organizationId
      
      if (!orgId) {
        const { data: member, error: memberError } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .maybeSingle()

        if (memberError) {
          console.error('Member error:', memberError)
          setLoadingDevices(false)
          return
        }

        if (!member) {
          console.log('User not in organization')
          setLoadingDevices(false)
          return
        }
        
        orgId = member.organization_id
      }

      console.log('✅ Fetching devices for organization:', orgId)

      const { data, error } = await supabase
        .from('attendance_devices')
        .select('device_code, device_name, location, organization_id')
        .eq('is_active', true)
        .eq('device_type_id', 8)
        .eq('organization_id', orgId)
        .order('device_name')

      if (error) {
        console.error('❌ Error loading devices:', error)
        // toast.error(`Error loading devices: ${error.message}`)
        setLoadingDevices(false)
        return
      }

      console.log('✅ Devices loaded:', data?.length || 0, 'devices')

      if (data && data.length > 0) {
        const invalidDevices = data.filter((d: any) => d.organization_id !== orgId)
        if (invalidDevices.length > 0) {
          console.error('❌ SECURITY WARNING: Found devices from different organization!', invalidDevices)
          // toast.error("Security error: Invalid devices detected")
          setLoadingDevices(false)
          return
        }
        console.log('✅ All devices validated for organization:', orgId)
      }

      const validDevices = (data || []).filter((d: any): d is Device => {
        if (!d.device_code || typeof d.device_code !== 'string' || d.device_code.trim() === '') {
          console.warn('⚠️ Device with empty device_code found:', d)
          return false
        }
        return true
      })

      if (validDevices.length !== (data || []).length) {
        console.warn(`⚠️ Filtered out ${(data || []).length - validDevices.length} invalid devices`)
      }

      setDevices(validDevices)
      
      if (validDevices && validDevices.length > 0) {
        const firstDevice = validDevices[0]
        const firstDeviceCode = firstDevice?.device_code
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem("selected_fingerprint_device")
          if (saved && validDevices.find(d => d.device_code === saved)) {
            setSelectedDevice(saved)
            console.log('✅ Restored saved device:', saved)
          } else if (firstDeviceCode) {
            setSelectedDevice(firstDeviceCode)
            console.log('✅ Auto-selected first device:', firstDeviceCode)
          }
        } else if (firstDeviceCode) {
          setSelectedDevice(firstDeviceCode)
        }
      } else {
        console.warn('⚠️ No valid devices found')
      }
    } catch (error: any) {
      console.error('Fetch devices error:', error)
      // toast.error(`Failed to load devices: ${error.message}`)
    } finally {
      setLoadingDevices(false)
    }
  }, [organizationId])

  const fetchMembers = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      if (DEBUG) console.log('[FINGER-PAGE] === FETCHING MEMBERS ===')
      if (DEBUG) console.log('[FINGER-PAGE] organizationId from store:', organizationId)
      if (DEBUG) console.log('[FINGER-PAGE] isHydrated:', isHydrated)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error("[FINGER-PAGE] User error:", userError)
        // toast.error("Failed to get user")
        setIsLoading(false)
        return
      }
      
      if (!user) {
        console.error("[FINGER-PAGE] No user logged in")
        // toast.error("User not logged in")
        setIsLoading(false)
        return
      }

      if (DEBUG) console.log('User ID:', user.id)

      let orgId = organizationId
      
      if (!orgId) {
        const { data: member, error: memberError } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single()

        if (memberError) {
          console.error("Member error:", memberError)
          // toast.error("Failed to get organization")
          setIsLoading(false)
          return
        }

        if (!member) {
          console.error("User not in organization")
          // toast.error("User not in organization")
          setIsLoading(false)
          return
        }
        
        orgId = member.organization_id
        if (DEBUG) console.log('✅ Organization ID from database:', orgId)
      }

      if (DEBUG) console.log('✅ Using Organization ID:', orgId, '(type:', typeof orgId, ')')
      if (DEBUG) console.log('✅ Fetching members for organization:', orgId)

      // First, fetch ALL members (including inactive) to debug
      const { data: allMembersData, error: allMembersError } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          department_id,
          organization_id,
          is_active,
          user_profiles (
            first_name,
            last_name,
            display_name,
            email,
            phone
          )
        `)
        .eq('organization_id', orgId)

      if (allMembersError) {
        console.error('❌ Error fetching members:', allMembersError)
        toast.error(allMembersError.message)
        setIsLoading(false)
        return
      }

      // Now filter active members in JavaScript
      const membersData = allMembersData?.filter((m: any) => {
        const isActive = m.is_active === true || m.is_active === 'true' || m.is_active === 1 || String(m.is_active).toLowerCase() === 'true'
        if (!isActive) {
          console.log(`⚠️ Filtering out inactive member ${m.id}: is_active = ${m.is_active} (type: ${typeof m.is_active})`)
        }
        return isActive
      }) || []

      if (DEBUG) console.log('✅ Active members after filter:', membersData.length)
      if (DEBUG) console.log('📋 Sample active members data:', membersData?.slice(0, 3))

      if (membersData && membersData.length > 0) {
        const invalidMembers = membersData.filter((m: any) => m.organization_id !== orgId)
        if (invalidMembers.length > 0) {
          console.error('❌ SECURITY WARNING: Found members from different organization!', invalidMembers)
          // toast.error("Security error: Invalid data detected")
          setIsLoading(false)
          return
        }
        
        // Check for members without user_profiles
        const membersWithoutProfile = membersData.filter((m: any) => !m.user_profiles)
        if (membersWithoutProfile.length > 0) {
          logOnce('missing-profile', 'warn', '⚠️ Found members without user_profiles:', membersWithoutProfile.length)
          if (DEBUG) console.warn('⚠️ Sample:', membersWithoutProfile.slice(0, 3))
        }
      }

      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('organization_id', orgId)

      if (deptError) {
        console.warn('⚠️ Departments error:', deptError.message)
      }

      if (DEBUG) console.log('✅ Departments fetched:', departments?.length || 0)

      const deptMap = new Map(departments?.map((d: any) => [d.id, d.name]) || [])

      const memberIds = membersData?.map((m: any) => m.id) || []
      let biometricData: any[] = []
      
      if (memberIds.length > 0) {
        try {
          const { data: bioData, error: bioError } = await supabase
            .from('biometric_data')
            .select('organization_member_id, finger_number, template_data')
            .in('organization_member_id', memberIds)
            .eq('biometric_type', 'FINGERPRINT')
            .eq('is_active', true)
          
          if (bioError) {
            console.warn('⚠️ Biometric data error:', bioError.message)
          } else {
            biometricData = bioData || []
            if (DEBUG) console.log('✅ Biometric data fetched:', biometricData.length, 'records')
            if (DEBUG) console.log('📋 Sample biometric data:', biometricData.slice(0, 5))
          }
        } catch (bioErr) {
          console.warn('⚠️ Biometric data table might not exist, continuing without it:', bioErr)
        }
      }

      // Group biometric data by member_id and sort by enrollment_date
      const memberBiometricMap = new Map<number, any[]>()
      biometricData.forEach((bio: any) => {
        const memberId = bio.organization_member_id
        if (!memberId) return
        
        // Check if template_data has local_id (means registered)
        let hasLocalId = false
        if (bio.template_data) {
          try {
            const templateData = typeof bio.template_data === 'string' 
              ? JSON.parse(bio.template_data) 
              : bio.template_data
            if (templateData && typeof templateData.local_id === 'number') {
              hasLocalId = true
            }
          } catch {
            // Ignore parse errors
          }
        }
        
        // Only process if has local_id or has valid finger_number
        if (hasLocalId || (bio.finger_number && (bio.finger_number === 1 || bio.finger_number === 2))) {
          if (!memberBiometricMap.has(memberId)) {
            memberBiometricMap.set(memberId, [])
          }
          memberBiometricMap.get(memberId)!.push(bio)
        }
      })
      
      // Sort each member's biometric records by enrollment_date or created_at
      memberBiometricMap.forEach((records) => {
        records.sort((a, b) => {
          const dateA = a.enrollment_date || a.created_at || ''
          const dateB = b.enrollment_date || b.created_at || ''
          return dateA.localeCompare(dateB)
        })
      })
      
      // Map to finger numbers (1 or 2)
      const fingerMap = new Map<number, Set<number>>()
      memberBiometricMap.forEach((records, memberId) => {
        records.forEach((bio, index) => {
          let fingerNumber = bio.finger_number
          
          // If finger_number is null, assign based on order (first = 1, second = 2)
          if (!fingerNumber || (fingerNumber !== 1 && fingerNumber !== 2)) {
            fingerNumber = index + 1 // First record = 1, second record = 2
            if (fingerNumber > 2) {
              // If more than 2 records, only count first 2
              return
            }
          }
          
          if (!fingerMap.has(memberId)) {
            fingerMap.set(memberId, new Set())
          }
          fingerMap.get(memberId)!.add(Number(fingerNumber))
          
          if (DEBUG) console.log(`✅ Member ${memberId}: Assigned finger ${fingerNumber} (record ${index + 1} of ${records.length})`)
        })
      })
      
      if (DEBUG) console.log('✅ Finger map created:', fingerMap.size, 'members with registered fingers')
      if (DEBUG) console.log('📊 Finger map details:', Array.from(fingerMap.entries()).map(([id, fingers]) => ({
        memberId: id,
        fingers: Array.from(fingers)
      })))

      // Filter members with is_active = true (handle both boolean and string)
      const activeMembers = membersData?.filter((m: any) => {
        const isActive = m.is_active === true || m.is_active === 'true' || m.is_active === 1
        if (!isActive && DEBUG) console.log(`⚠️ Member ${m.id} is not active: is_active = ${m.is_active} (type: ${typeof m.is_active})`)
        return isActive
      }) || []

      if (DEBUG) console.log(`✅ Filtered active members: ${activeMembers.length} of ${membersData?.length || 0} total`)

      const transformedMembers = activeMembers.map((m: any) => {
        const profile = m.user_profiles
        let displayName = 'No Name'
        let firstName = null
        
        if (!profile) {
          console.warn(`⚠️ Member ${m.id} (user_id: ${m.user_id}) has no user_profiles`)
        }
        
        if (profile) {
          firstName = profile.first_name || null
          if (profile.display_name) {
            displayName = profile.display_name
          } else if (profile.first_name || profile.last_name) {
            displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          }
        }

        const fingers = fingerMap.get(m.id) || new Set()
        const finger1Registered = fingers.has(1)
        const finger2Registered = fingers.has(2)
        
        // Debug logging for members with registered fingers
        if ((finger1Registered || finger2Registered) && DEBUG) {
          console.log(`✅ Member ${m.id} (${displayName}): Finger 1=${finger1Registered}, Finger 2=${finger2Registered}, Fingers Set:`, Array.from(fingers))
        }

        return {
          id: m.id,
          user_id: m.user_id,
          display_name: displayName,
          first_name: firstName,
          phone: profile?.phone || 'No Phone',
          email: profile?.email || null,
          department_name: deptMap.get(m.department_id) || 'No Group',
          finger1_registered: finger1Registered,
          finger2_registered: finger2Registered
        }
      }) || []

      if (DEBUG) console.log('✅ Members transformed:', transformedMembers.length)
      if (DEBUG) console.log('📊 SUMMARY:')
      if (DEBUG) console.log(`   - Organization ID: ${orgId}`)
      if (DEBUG) console.log(`   - Total Members: ${transformedMembers.length}`)
      if (DEBUG) console.log(`   - Members with profiles: ${transformedMembers.filter(m => m.display_name !== 'No Name').length}`)
      if (DEBUG) console.log(`   - Finger 1 Registered: ${transformedMembers.filter(m => m.finger1_registered).length}`)
      if (DEBUG) console.log(`   - Finger 2 Registered: ${transformedMembers.filter(m => m.finger2_registered).length}`)
      
      // Log first few members for debugging
      if (transformedMembers.length > 0 && DEBUG) {
        console.log('📋 First 5 members:', transformedMembers.slice(0, 5).map(m => ({
          id: m.id,
          name: m.display_name,
          first_name: m.first_name,
          department: m.department_name,
          finger1: m.finger1_registered,
          finger2: m.finger2_registered
        })))
      }
      if (DEBUG) console.log(`   - Finger 2 Registered: ${transformedMembers.filter(m => m.finger2_registered).length}`)
      if (DEBUG) console.log(`   - Both Registered: ${transformedMembers.filter(m => m.finger1_registered && m.finger2_registered).length}`)
      
      setMembers(transformedMembers)
      
      // if (transformedMembers.length === 0) {
      //   toast.info("No members found in your organization")
      // }
    } catch (error: any) {
      console.error('❌ Fetch error:', error)
      // toast.error(error.message || "Failed to fetch members")
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch data when hydration completes
  React.useEffect(() => {
    if (isHydrated && organizationId) {
      console.log('[FINGER-PAGE] Hydration complete, organizationId available:', organizationId)
      fetchDevices()
      fetchMembers()
    }
  }, [isHydrated, organizationId, fetchDevices, fetchMembers])

  // Setup real-time subscription for biometric_data changes
  React.useEffect(() => {
    if (!mounted || !organizationId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`biometric-data-changes-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'biometric_data',
          filter: 'biometric_type=eq.FINGERPRINT'
        },
        (payload) => {
          if (DEBUG) console.log('🔄 Biometric data change detected:', payload.eventType)
          const newRow: any = (payload as any).new
          const oldRow: any = (payload as any).old
          const payloadOrgId = newRow?.organization_id ?? oldRow?.organization_id
          if (!payloadOrgId || payloadOrgId !== organizationId) {
            if (DEBUG) console.log('🔄 Change from another organization, skipping refetch')
            return
          }
          // Refetch all data to ensure consistency
          fetchMembers()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (DEBUG) console.log('✅ Real-time subscription active for biometric_data')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error for biometric_data - this may be due to real-time not being enabled for the table in Supabase')
          console.error('💡 To enable: Run this SQL in Supabase SQL Editor:')
          console.error('   ALTER PUBLICATION supabase_realtime ADD TABLE biometric_data;')
        } else {
        }
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [mounted, organizationId, fetchMembers])

  React.useEffect(() => {
    if (!mounted || !activeCommandId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`device-commands-${activeCommandId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_commands',
          filter: `id=eq.${activeCommandId}`
        },
        (payload) => {
          const next = (payload as unknown as { new?: Record<string, unknown> }).new
          const s = typeof next?.status === 'string' ? (next.status as string) : undefined
          if (s === 'EXECUTED' || s === 'FAILED' || s === 'CANCELLED' || s === 'TIMEOUT') {
            registrationCompleteRef.current = true
            realtimeStatusRef.current = s
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [mounted, activeCommandId])

  React.useEffect(() => {
    if (mounted && selectedDevice) {
      localStorage.setItem("selected_fingerprint_device", selectedDevice)
    }
  }, [selectedDevice, mounted])

  const getUniqueDepartments = (): string[] => {
    const deptNames: string[] = []
    members.forEach(member => {
      if (member.department_name) {
        deptNames.push(member.department_name)
      }
    })
    return Array.from(new Set(deptNames)).sort()
  }

  const getFilteredMembers = (): Member[] => {
    return members.filter(member => {
      const matchesSearch = 
        member.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.phone && member.phone.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesDepartment = 
        selectedDepartment === "all" || member.department_name === selectedDepartment

      const matchesStatus = 
        selectedStatus === "all" ||
        (selectedStatus === "complete" && member.finger1_registered && member.finger2_registered) ||
        (selectedStatus === "partial" && (member.finger1_registered || member.finger2_registered) && !(member.finger1_registered && member.finger2_registered)) ||
        (selectedStatus === "unregistered" && !member.finger1_registered && !member.finger2_registered)

      return matchesSearch && matchesDepartment && matchesStatus
    })
  }

  const filteredMembers = getFilteredMembers()
  const uniqueDepartments = getUniqueDepartments()

  // Pagination logic
  const pageSizeNum = parseInt(pageSize)
  const totalPages = Math.ceil(filteredMembers.length / pageSizeNum)
  const paginatedMembers = filteredMembers.slice(
    pageIndex * pageSizeNum,
    (pageIndex + 1) * pageSizeNum
  )

  // Reset page index when filters change
  React.useEffect(() => {
    setPageIndex(0)
  }, [searchQuery, selectedDepartment, selectedStatus])

  // Clamp page index if it exceeds total pages
  React.useEffect(() => {
    if (pageIndex >= totalPages && totalPages > 0) {
      setPageIndex(totalPages - 1)
    }
  }, [totalPages, pageIndex])

  const handleFingerClick = async (member: Member, fingerNumber: 1 | 2) => {
    if (!selectedDevice) {
      // toast.error("Please select a fingerprint device first")
      return
    }

    const isRegistered = fingerNumber === 1 ? member.finger1_registered : member.finger2_registered
    
    if (isRegistered) {
      setRegisteringMember({ member, fingerNumber })
      setShowConfirmDialog(true)
    } else {
      await handleRegister(member, fingerNumber)
    }
  }

  const handleConfirmReRegister = async () => {
    setShowConfirmDialog(false)
    if (registeringMember) {
      await handleRegister(registeringMember.member, registeringMember.fingerNumber)
    }
  }

  const handleRegister = async (member: Member, fingerNumber: 1 | 2) => {
    if (!selectedDevice) {
      // toast.error("Please select a fingerprint device first")
      return
    }

    setIsRegistering(true)
    setActiveMemberId(member.id)
    setActiveFingerNumber(fingerNumber)

    const supabase = createClient()
    let command: any = null
    registrationCompleteRef.current = false
    lastPolledStatusRef.current = null
    realtimeStatusRef.current = null

    try {
      if (DEBUG) console.log('=== STARTING REGISTRATION ===')
      if (DEBUG) console.log('Member:', member.display_name, '| User ID:', member.user_id)
      if (DEBUG) console.log('Device:', selectedDevice, '| Finger:', fingerNumber)

      const payload = {
        user_id: member.user_id,
        first_name: member.first_name,
        full_name: member.display_name,
        finger_index: fingerNumber
      }

      const { data: commandData, error: insertError } = await supabase
        .from('device_commands')
        .insert({
          device_code: selectedDevice,
          command_type: 'REGISTER',
          payload: payload,
          status: 'PENDING'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        // toast.error(`Failed to send command: ${insertError.message}`)
        setIsRegistering(false)
        return
      }

      command = commandData
      if (DEBUG) console.log('Command inserted, ID:', command?.id)
      setActiveCommandId(command?.id ?? null)
      // toast.info(`Command sent to device. Please scan finger ${fingerNumber} on the device.`)

      const startTime = Date.now()
      const timeout = 30000
      const pollInterval = 1000

      const pollStatus = async (): Promise<boolean> => {
        while (Date.now() - startTime < timeout && !registrationCompleteRef.current) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))

          // Stop polling if real-time update already completed
          if (registrationCompleteRef.current) {
            console.log('✅ Real-time update already completed, stopping polling')
            const rs = realtimeStatusRef.current
            return rs === 'EXECUTED'
          }

          // Guard: prevent 400 Bad Request when command.id is missing
          if (!command || !command.id) {
            console.warn('⚠️ Polling aborted: missing command.id')
            return false
          }

          let status: { status?: string } | null = null
          try {
            const { data, error } = await supabase
              .from('device_commands')
              .select('status')
              .eq('id', command.id)
              .maybeSingle()
            if (error) {
              logOnce('polling-error', 'warn', '⚠️ Polling error reading device_commands:', error)
              continue
            }
            status = data as any
          } catch (e) {
            logOnce('polling-error', 'warn', '⚠️ Polling error reading device_commands:', e)
            continue
          }

          if (status?.status !== lastPolledStatusRef.current) {
            if (DEBUG) console.log('📊 Polling status changed:', status?.status, '| Elapsed:', Date.now() - startTime, 'ms')
            lastPolledStatusRef.current = status?.status ?? null
          }

          if (status?.status === 'EXECUTED') {
            console.log('✅ Polling detected EXECUTED status')
            registrationCompleteRef.current = true
            return true
          }

          if (status?.status === 'FAILED') {
            console.log('❌ Polling detected FAILED status')
            registrationCompleteRef.current = true
            toast.error('Registration failed')
            return false
          }

          if (status?.status === 'TIMEOUT') {
            console.log('⏱️ Polling detected TIMEOUT status')
            registrationCompleteRef.current = true
            toast.error('Timeout: device not responding')
            return false
          }

          if (status?.status === 'CANCELLED') {
            registrationCompleteRef.current = true
            return false
          }
        }

        // Timeout reached - auto-cancel the command
        console.log('⏱️ Timeout reached (30 seconds), auto-failed command...')
        const { error: cancelError } = await supabase
          .from('device_commands')
          .update({ status: 'TIMEOUT' })
          .eq('id', command?.id)
          .select()

        if (cancelError) {
          console.error('Failed to auto-cancel command:', cancelError)
        } else {
          console.log('✅ Command auto-failed successfully')
        }

        registrationCompleteRef.current = true
        realtimeStatusRef.current = 'TIMEOUT'

        toast.error('Timeout: device not responding')
        return false
      }

      const success = await pollStatus()

      if (success) {
        const { data: existing } = await supabase
          .from('biometric_data')
          .select('id')
          .eq('organization_member_id', member.id)
          .eq('finger_number', fingerNumber)
          .eq('biometric_type', 'FINGERPRINT')
          .maybeSingle()

        if (existing) {
          await supabase
            .from('biometric_data')
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('biometric_data')
            .insert({
              organization_member_id: member.id,
              biometric_type: 'FINGERPRINT',
              finger_number: fingerNumber,
              is_active: true
            })
        }

        setMembers(prev => prev.map(m =>
          m.id === member.id
            ? { ...m, [`finger${fingerNumber}_registered`]: true }
            : m
        ))

        toast.success('Registration successful!')
        // Ensure UI shows latest data even if realtime is delayed
        await fetchMembers()
      }
      
      // Auto-cancel on error only if not success
      if (!success && command?.id) {
        try {
          const s = realtimeStatusRef.current
          if (s !== 'CANCELLED' && s !== 'TIMEOUT' && s !== 'FAILED' && s !== 'EXECUTED') {
            await supabase
              .from('device_commands')
              .update({ status: 'CANCELLED' })
              .eq('id', command.id)
              .select()
          }
        } catch (cancelErr) {
          console.error('Failed to cancel command on error:', cancelErr)
        }
      }
    } finally {
      setActiveCommandId(null)
      setIsRegistering(false)
      setRegisteringMember(null)
      setActiveMemberId(null)
      setActiveFingerNumber(null)
    }
  }

  const handleCancelRegistration = async () => {
    if (!activeMemberId || !activeFingerNumber || !selectedDevice) {
      // toast.error("No active registration to cancel")
      return
    }

    try {
      registrationCompleteRef.current = true
      realtimeStatusRef.current = 'CANCELLED'
      const supabase = createClient()
      
      // Find and cancel the pending command
      const { data: commands, error: fetchError } = await supabase
        .from('device_commands')
        .select('id')
        .eq('device_code', selectedDevice)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(1)

      if (fetchError || !commands || commands.length === 0) {
        console.error('No pending command found')
        // toast.error("No pending command to cancel")
        return
      }

      const { error: updateError } = await supabase
        .from('device_commands')
        .update({ status: 'CANCELLED' })
        .eq('id', commands[0]?.id)
        .select()

      if (updateError) {
        console.error('Cancel error:', updateError)
        // toast.error(`Failed to cancel: ${updateError.message}`)
        return
      }

      toast.success('Registration cancelled')
      
      // Reset states immediately
      setIsRegistering(false)
      setActiveMemberId(null)
      setActiveFingerNumber(null)
      setShowConfirmDialog(false)
      setRegisteringMember(null)
      
      // Refresh data
      fetchMembers()
    } catch (error: any) {
      console.error('Cancel error:', error)
      // toast.error(error.message || 'Failed to cancel')
    }
  }

  const registeredCount = members.filter(m => m.finger1_registered && m.finger2_registered).length
  const partialCount = members.filter(m => (m.finger1_registered || m.finger2_registered) && !(m.finger1_registered && m.finger2_registered)).length
  const unregisteredCount = members.filter(m => !m.finger1_registered && !m.finger2_registered).length

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full">
      <div className="w-full space-y-6 min-w-0">

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-lg shadow-sm border">
              <div className="p-2 rounded-lg bg-green-100">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Complete (2 Fingers)</p>
                <p className="text-lg font-semibold">{registeredCount}/{members.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-lg shadow-sm border">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Fingerprint className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Partial (1 Finger)</p>
                <p className="text-lg font-semibold">{partialCount}/{members.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-lg shadow-sm border">
              <div className="p-2 rounded-lg bg-red-100">
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Not Registered</p>
                <p className="text-lg font-semibold">{unregisteredCount}/{members.length}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col sm:flex-row gap-2 w-full items-start sm:items-center">
              <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border shadow-sm shrink-0">
                <Monitor className="w-4 h-4 text-primary" />
                <div className="flex items-center gap-2">
                  {!mounted || loadingDevices ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading devices...</span>
                    </div>
                  ) : devices.length === 0 ? (
                    <span className="text-sm font-medium text-destructive">No devices found</span>
                  ) : (
                    <Select
                      value={selectedDevice}
                      onValueChange={setSelectedDevice}
                      disabled={!mounted || loadingDevices || devices.length === 0}
                    >
                      <SelectTrigger className="h-6 border-0 shadow-none p-0 font-mono font-semibold text-sm hover:bg-transparent focus:ring-0">
                        <SelectValue placeholder="Pilih...">
                          {selectedDevice && devices.find(d => d.device_code === selectedDevice)?.device_code.replace(/_/g, ' ')}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="w-[320px]">
                        {devices.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">Tidak ada mesin aktif</p>
                            <p className="text-xs mt-1">Hubungi administrator</p>
                          </div>
                        ) : (
                          devices.map((device, index) => {
                            const deviceKey = device.device_code || `device-${index}`
                            const deviceValue = device.device_code || ''
                            
                            return (
                              <SelectItem 
                                key={deviceKey}
                                value={deviceValue}
                                className="cursor-pointer"
                                disabled={!device.device_code}
                              >
                                <div className="flex items-start gap-3 py-1">
                                  <div className="p-2 rounded-md bg-primary/10 mt-0.5 shrink-0">
                                    <Monitor className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    <span className="font-semibold text-sm font-mono">
                                      {device.device_code || '(No Code)'}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate">
                                      {device.device_name || '(No Name)'}
                                    </span>
                                    {device.location && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        📍 {device.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            )
                          })
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    fetchDevices()
                    fetchMembers()
                  }}
                  disabled={isLoading || loadingDevices}
                  className="shrink-0"
                >
                  <RefreshCw className={cn("w-4 h-4", (isLoading || loadingDevices) && "animate-spin")} />
                </Button>
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Nick name, Full name, or Groups"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Filter Department..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {uniqueDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as FilterStatus)}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Filter Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="complete">Complete (2 Fingers)</SelectItem>
                  <SelectItem value="partial">Partial (1 Finger)</SelectItem>
                  <SelectItem value="unregistered">Not Registered</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold w-16">No</TableHead>
                <TableHead className="font-semibold w-32">Nick Name</TableHead>
                <TableHead className="font-semibold">Full Name</TableHead>
                <TableHead className="font-semibold">Group</TableHead>
                <TableHead className="font-semibold text-center">Finger 1</TableHead>
                <TableHead className="font-semibold text-center">Finger 2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : paginatedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {searchQuery || selectedDepartment !== "all" || selectedStatus !== "all" 
                      ? "No data found" 
                      : "No members registered yet"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member, index) => (
                  <TableRow
                    key={member.id}
                    className={cn(
                      "transition-colors",
                      index % 2 === 0 ? "bg-background" : "bg-muted/30",
                      "hover:bg-primary/5"
                    )}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {pageIndex * pageSizeNum + index + 1}
                    </TableCell>
                    <TableCell 
                      className="font-medium text-foreground hover:underline cursor-pointer"
                      onClick={() => handleMemberClick(member.id)}
                    >
                      {member.first_name || 'N/A'}
                    </TableCell>
                    <TableCell 
                      className="text-foreground hover:underline cursor-pointer"
                      onClick={() => handleMemberClick(member.id)}
                    >
                      {member.display_name}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {member.department_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {activeMemberId === member.id && activeFingerNumber === 1 ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleCancelRegistration}
                            disabled={!isRegistering}
                            className="gap-2"
                          >
                            {isRegistering ? (
                              <>
                                <Fingerprint className="w-4 h-4 animate-pulse" />
                                Cancel
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Done
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant={member.finger1_registered ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFingerClick(member, 1)}
                            disabled={isRegistering || activeMemberId !== null}
                            className={cn(
                              "gap-2 transition-all",
                              member.finger1_registered && "bg-green-600 hover:bg-green-700 text-white",
                              activeMemberId !== null && activeMemberId !== member.id && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {member.finger1_registered ? (
                              <>
                                <Check className="w-4 h-4" />
                                Registered
                              </>
                            ) : (
                              <>
                                <Fingerprint className="w-4 h-4" />
                                Finger 1
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {activeMemberId === member.id && activeFingerNumber === 2 ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleCancelRegistration}
                            disabled={!isRegistering}
                            className="gap-2"
                          >
                            {isRegistering ? (
                              <>
                                <Fingerprint className="w-4 h-4 animate-pulse" />
                                Cancel
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Done
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant={member.finger2_registered ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFingerClick(member, 2)}
                            disabled={isRegistering || activeMemberId !== null}
                            className={cn(
                              "gap-2 transition-all",
                              member.finger2_registered && "bg-green-600 hover:bg-green-700 text-white",
                              activeMemberId !== null && activeMemberId !== member.id && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {member.finger2_registered ? (
                              <>
                                <Check className="w-4 h-4" />
                                Registered
                              </>
                            ) : (
                              <>
                                <Fingerprint className="w-4 h-4" />
                                Finger 2
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {filteredMembers.length > 0 && (
          <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-md border">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageIndex(0)}
                disabled={pageIndex === 0 || isLoading}
                className="h-8 w-8 p-0"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                disabled={pageIndex === 0 || isLoading}
                className="h-8 w-8 p-0"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground">Page</span>
              
              <input
                type="number"
                min="1"
                max={totalPages}
                value={pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0
                  setPageIndex(Math.max(0, Math.min(page, totalPages - 1)))
                }}
                className="w-12 h-8 px-2 border rounded text-sm text-center"
                disabled={isLoading}
              />
              
              <span className="text-sm text-muted-foreground">/ {totalPages || 1}</span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageIndex(Math.min(totalPages - 1, pageIndex + 1))}
                disabled={pageIndex >= totalPages - 1 || isLoading}
                className="h-8 w-8 p-0"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageIndex(totalPages - 1)}
                disabled={pageIndex >= totalPages - 1 || isLoading}
                className="h-8 w-8 p-0"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredMembers.length > 0 ? pageIndex * parseInt(pageSize) + 1 : 0} to {Math.min((pageIndex + 1) * parseInt(pageSize), filteredMembers.length)} of {filteredMembers.length} total records
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value)
                    setPageIndex(0)
                  }}
                  className="px-2 py-1 border rounded text-sm bg-white"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Re-Register Sidik Jari</AlertDialogTitle>
              <AlertDialogDescription>
                Sidik jari {registeringMember?.fingerNumber} untuk {registeringMember?.member.display_name} sudah terdaftar.
                Apakah Anda yakin ingin mendaftarkan ulang?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReRegister}>
                Ya, Daftar Ulang
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

