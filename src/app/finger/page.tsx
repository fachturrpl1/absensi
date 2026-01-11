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
import { Fingerprint, Users, RefreshCw, Search, Check, Loader2, Monitor } from "lucide-react"
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
import { getCache, setCache } from "@/lib/local-cache"
import { PaginationFooter } from "@/components/pagination-footer"

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
  last_name: string | null
  phone: string | null
  email: string | null
  department_name: string | null
  finger1_registered: boolean
  finger2_registered: boolean
}

type DeviceCommandRow = {
  id?: string | number
  status?: string
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
  const [totalItems, setTotalItems] = React.useState(0)
  const registrationCompleteRef = React.useRef(false)
  const lastPolledStatusRef = React.useRef<string | null>(null)
  const [activeCommandId, setActiveCommandId] = React.useState<string | number | null>(null)
  const realtimeStatusRef = React.useRef<string | null>(null)
  const [fingerStats, setFingerStats] = React.useState<{ total: number; registered: number; partial: number; unregistered: number }>({ total: 0, registered: 0, partial: 0, unregistered: 0 })

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

  // Clear local cached members for current organization to avoid stale counts in cards
  const clearMembersCacheForOrg = React.useCallback((orgId?: number | null) => {
    if (!orgId || typeof window === 'undefined') return
    try {
      const prefix = `finger:members:${orgId}:`
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(prefix)) keys.push(key)
      }
      keys.forEach((k) => localStorage.removeItem(k))
    } catch {}
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
        .eq('organization_id', orgId)
        .order('device_name')

      if (error) {
        console.error('❌ Error loading devices:', error)
        // toast.error(`Error loading devices: ${error.message}`)
        setLoadingDevices(false)
        return
      }

      console.log('✅ Devices loaded:', data?.length || 0, 'devices')

      const devicesRaw = (data ?? []) as Array<Partial<Device> & { organization_id?: number }>

      if (devicesRaw.length > 0) {
        const invalidDevices = devicesRaw.filter((d) => d.organization_id !== orgId)
        if (invalidDevices.length > 0) {
          console.error('❌ SECURITY WARNING: Found devices from different organization!', invalidDevices)
          // toast.error("Security error: Invalid devices detected")
          setLoadingDevices(false)
          return
        }
        console.log('✅ All devices validated for organization:', orgId)
      }

      const validDevices = devicesRaw.filter((d): d is Device => {
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
      try {
        if (orgId) {
          setCache<Device[]>(`finger:devices:${orgId}`, validDevices, 1000 * 180)
        }
      } catch { }

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Fetch devices error:', message)
      // toast.error(`Failed to load devices: ${error.message}`)
    } finally {
      setLoadingDevices(false)
    }
  }, [organizationId])

  // Fetch organization-wide fingerprint stats for cards
  const fetchFingerStats = React.useCallback(async () => {
    if (!organizationId) return
    const supabase = createClient()
    try {
      // Count all active members in the organization
      const { count } = await supabase
        .from('organization_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true)
      const total: number = typeof count === 'number' ? count : 0

      // Try to fetch biometric rows via relationship join (no need for organization_id column on biometric_data)
      type BioRow = {
        organization_member_id: number
        finger_number: number | null
        is_active: boolean
      }

      let bioRows: BioRow[] = []
      const { data: joinedRows, error: joinErr } = await supabase
        .from('biometric_data')
        .select('organization_member_id, finger_number, is_active, organization_members!inner(organization_id)')
        .eq('biometric_type', 'FINGERPRINT')
        .eq('is_active', true)
        .eq('organization_members.organization_id', organizationId)

      // Helper to normalize unknown row into BioRow without using any
      const normalizeBioRow = (r: unknown): BioRow | null => {
        if (!r || typeof r !== 'object') return null
        const o = r as Record<string, unknown>
        const omid = o['organization_member_id']
        const fn = o['finger_number']
        const ia = o['is_active']
        const organization_member_id =
          typeof omid === 'number' ? omid : typeof omid === 'string' ? Number(omid) : NaN
        const finger_number =
          typeof fn === 'number' ? fn : typeof fn === 'string' && fn !== '' ? Number(fn) : null
        const is_active = Boolean(ia)
        if (!Number.isFinite(organization_member_id)) return null
        return { organization_member_id: Number(organization_member_id), finger_number, is_active }
      }

      if (!joinErr && Array.isArray(joinedRows)) {
        bioRows = (joinedRows as unknown[])
          .map((r) => normalizeBioRow(r))
          .filter((x): x is BioRow => x !== null)
      } else {
        // Fallback: fetch member IDs and then query biometric_data with IN chunks
        const ids: number[] = []
        const pageSize = 1000
        for (let from = 0; ; from += pageSize) {
          const { data: idRows } = await supabase
            .from('organization_members')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .range(from, from + pageSize - 1)
          if (!idRows || idRows.length === 0) break
          ids.push(...idRows.map(r => r.id))
          if (idRows.length < pageSize) break
        }

        const chunk = 300
        const allRows: BioRow[] = []
        for (let i = 0; i < ids.length; i += chunk) {
          const slice = ids.slice(i, i + chunk)
          const { data: rows } = await supabase
            .from('biometric_data')
            .select('organization_member_id, finger_number, is_active')
            .eq('biometric_type', 'FINGERPRINT')
            .eq('is_active', true)
            .in('organization_member_id', slice)
          if (Array.isArray(rows)) {
            const normalized = (rows as unknown[])
              .map((r) => normalizeBioRow(r))
              .filter((x): x is BioRow => x !== null)
            allRows.push(...normalized)
          }
        }
        bioRows = allRows
      }

      // Aggregate counts per member
      const map: Map<number, Set<number>> = new Map()
      for (const r of bioRows || []) {
        const mid = r.organization_member_id
        const f = typeof r.finger_number === 'number' ? r.finger_number : null
        if (!map.has(mid)) map.set(mid, new Set<number>())
        if (f !== null) map.get(mid)!.add(f)
      }

      let registered = 0
      let partial = 0
      map.forEach((fingers) => {
        if (fingers.size >= 2) registered += 1
        else if (fingers.size === 1) partial += 1
      })

      const unregistered = Math.max(0, total - (registered + partial))
      setFingerStats({ total: Number(total), registered, partial, unregistered })
    } catch (e) {
      console.error('[FINGER-PAGE] Fetch finger stats error:', e)
    }
  }, [organizationId])

  const fetchMembers = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const pageSizeNum = parseInt(pageSize)
      const pageNum = pageIndex + 1
      const url = new URL('/api/finger/members', window.location.origin)
      if (organizationId) url.searchParams.set('organizationId', String(organizationId))
      url.searchParams.set('limit', String(pageSizeNum))
      url.searchParams.set('page', String(pageNum))
      // cache-busting, void any intermediary caches affecting freshness
      url.searchParams.set('t', String(Date.now()))

      const res = await fetch(url.toString(), { credentials: 'same-origin', cache: 'no-store' })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Failed to load members')

      setMembers(json.data || [])
      setTotalItems(json.pagination?.total || 0)

      if (organizationId) {
        setCache<Member[]>(
          `finger:members:${organizationId}:p=${pageNum}:l=${pageSizeNum}`,
          json.data || [],
          1000 * 180
        )
      }
      // Update cards after members fetch
      await fetchFingerStats()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Fetch error:', message)
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, pageIndex, pageSize, fetchFingerStats])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch data when hydration completes
  React.useEffect(() => {
    if (isHydrated && organizationId) {
      const cachedDevices = getCache<Device[]>(`finger:devices:${organizationId}`)
      if (cachedDevices && cachedDevices.length > 0) setDevices(cachedDevices)
      // Do not hydrate members from cache to avoid stale counts in cards
      clearMembersCacheForOrg(organizationId)
      console.log('[FINGER-PAGE] Hydration complete, organizationId available:', organizationId)
      fetchDevices()
      fetchMembers()
      fetchFingerStats()
    }
  }, [isHydrated, organizationId, fetchDevices, fetchMembers, fetchFingerStats, clearMembersCacheForOrg])

  // Refetch when page index or page size changes
  React.useEffect(() => {
    if (isHydrated && organizationId) {
      // Always fetch fresh when paging/pageSize changes
      clearMembersCacheForOrg(organizationId)
      fetchMembers()
      fetchFingerStats()
    }
  }, [pageIndex, pageSize, isHydrated, organizationId, fetchMembers, fetchFingerStats, clearMembersCacheForOrg])

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
          const p = payload as unknown as { new?: { organization_id?: number }, old?: { organization_id?: number } }
          const payloadOrgId = p.new?.organization_id ?? p.old?.organization_id
          if (!payloadOrgId || payloadOrgId !== organizationId) {
            if (DEBUG) console.log('🔄 Change from another organization, skipping refetch')
            return
          }
          // Refetch all data and clear cache to ensure consistency
          clearMembersCacheForOrg(organizationId)
          fetchMembers()
          fetchFingerStats()
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

  // Pagination logic (backend pagination)
  const pageSizeNum = parseInt(pageSize)
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / pageSizeNum))
  const paginatedMembers = filteredMembers

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
    let command: DeviceCommandRow | null = null
    registrationCompleteRef.current = false
    lastPolledStatusRef.current = null
    realtimeStatusRef.current = null

    try {
      const { data: commandData, error: insertError } = await supabase
        .from('device_commands')
        .insert({
          device_code: selectedDevice,
          command_type: 'REGISTER',
          payload: {
            user_id: member.user_id,
            first_name: member.first_name,
            last_name: member.last_name,
            full_name: member.display_name || `${member.first_name || ''} ${member.last_name || ''}`.trim(),
            name: member.display_name || `${member.first_name || ''} ${member.last_name || ''}`.trim(),
            finger_index: fingerNumber
          },
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

      command = (commandData as unknown as DeviceCommandRow) ?? null
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
            status = (data as unknown as { status?: string } | null)
          } catch (e: unknown) {
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

        setMembers(prev => prev.map(m => (
          m.id === member.id
            ? {
              ...m,
              finger1_registered: fingerNumber === 1 ? true : m.finger1_registered,
              finger2_registered: fingerNumber === 2 ? true : m.finger2_registered,
            }
            : m
        )))

        toast.success('Registration successful!')
        // Ensure UI shows latest data even if realtime is delayed
        clearMembersCacheForOrg(organizationId)
        await fetchMembers()
        await fetchFingerStats()
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
        } catch (cancelErr: unknown) {
          const msg = cancelErr instanceof Error ? cancelErr.message : 'Unknown error'
          console.error('Failed to cancel command on error:', msg)
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Cancel error:', message)
      // toast.error(error.message || 'Failed to cancel')
    }
  }

  // Use organization-wide aggregated stats for accurate card numbers
  const registeredCount = fingerStats.registered
  const partialCount = fingerStats.partial
  const unregisteredCount = fingerStats.unregistered

  if (false && isLoading) {
    // Hanya tampilkan skeleton khusus finger
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full">
      <div className="w-full space-y-6 min-w-0">

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-lg shadow-sm border">
              <div className="p-2 rounded-lg bg-primary/10">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Complete (2 Fingers)</p>
                <p className="text-lg font-semibold">{registeredCount}/{fingerStats.total}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-lg shadow-sm border">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Fingerprint className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Partial (1 Finger)</p>
                <p className="text-lg font-semibold">{partialCount}/{fingerStats.total}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-lg shadow-sm border">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Users className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Not Registered</p>
                <p className="text-lg font-semibold">{unregisteredCount}/{fingerStats.total}</p>
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
                            <p className="text-sm font-medium">No active device</p>
                            <p className="text-xs mt-1">Contact the administrator</p>
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

        <div className="bg-card/90 rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/40">
                <TableHead className="font-semibold w-16">No</TableHead>
                <TableHead className="font-semibold w-32">Nick Name</TableHead>
                <TableHead className="font-semibold">Full Name</TableHead>
                <TableHead className="font-semibold">Group</TableHead>
                <TableHead className="font-semibold text-center">Finger 1</TableHead>
                <TableHead className="font-semibold text-center">Finger 2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
              {(isLoading && members.length === 0) ? (
                <>
                  {Array.from({ length: Math.max(5, pageSizeNum) }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={6}>
                        <div className="flex items-center gap-4">
                          <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                          <div className="h-5 w-20 bg-muted rounded animate-pulse ml-auto" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
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
                      "hover:bg-muted/40"
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
                              member.finger1_registered && "bg-green-600 hover:bg-green-700 text-primary-foreground",
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
                              member.finger2_registered && "bg-green-600 hover:bg-green-700 text-primary-foreground",
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

        {/* Pagination Footer (shared) */}
        {filteredMembers.length > 0 && (
          <PaginationFooter
            page={pageIndex + 1}
            totalPages={totalPages || 1}
            onPageChange={(p) => setPageIndex(Math.max(0, Math.min((p - 1), Math.max(0, totalPages - 1))))}
            isLoading={isLoading}
            from={totalItems > 0 ? pageIndex * pageSizeNum + 1 : 0}
            to={Math.min((pageIndex + 1) * pageSizeNum, totalItems)}
            total={totalItems}
            pageSize={pageSizeNum}
            onPageSizeChange={(size) => { setPageSize(String(size)); setPageIndex(0); }}
            pageSizeOptions={[10, 50, 100]}
          />
        )}

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finger re-register confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Finger {registeringMember?.fingerNumber} for {registeringMember?.member.display_name} had already registered.
                Are you sure want to re-register?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReRegister}>
                Proceed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

