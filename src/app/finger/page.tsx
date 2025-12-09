'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Fingerprint, Check, Loader2, Search, Users, RefreshCw, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { useOrgStore } from '@/store/org-store'

interface Member {
  id: string
  organization_member_id: number
  first_name: string
  last_name: string
  email: string
  finger1_registered: boolean
  finger2_registered: boolean
}

type FilterStatus = 'all' | 'none' | 'partial' | 'complete'

export default function FingerPage() {
  const orgStore = useOrgStore()
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      if (!orgStore.organizationId) {
        toast.error('Please select an organization')
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          user_profiles!user_id (
            id,
            first_name,
            last_name,
            email
          ),
          finger1_registered,
          finger2_registered
        `)
        .eq('organization_id', orgStore.organizationId)
        .eq('is_active', true)
        .order('id', { ascending: true })

      if (error) {
        toast.error('Failed to load members')
        console.error('Error fetching members:', error)
      } else if (data && data.length > 0) {
        // Fetch user_profiles terpisah jika FK gagal
        const userIds = (data || []).map((item: any) => item.user_id).filter(Boolean);
        let userProfilesMap: any = {};
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name, email')
            .in('id', userIds);
          
          if (profiles) {
            profiles.forEach((p: any) => {
              userProfilesMap[p.id] = p;
            });
          }
        }
        
        const formattedData = (data || []).map((item: any) => {
          const userProfile = item.user_profiles || userProfilesMap[item.user_id];
          return {
            id: userProfile?.id || item.user_id || '',
            organization_member_id: item.id,
            first_name: userProfile?.first_name || '',
            last_name: userProfile?.last_name || '',
            email: userProfile?.email || '',
            finger1_registered: item.finger1_registered || false,
            finger2_registered: item.finger2_registered || false,
          };
        });
        setMembers(formattedData);
      } else {
        setMembers([]);
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (orgStore.organizationId) {
      fetchMembers();
    }
  }, [orgStore.organizationId])

  const getFingerStatus = (member: Member): FilterStatus => {
    if (member.finger1_registered && member.finger2_registered) return 'complete'
    if (member.finger1_registered || member.finger2_registered) return 'partial'
    return 'none'
  }

  const filteredMembers = members.filter((member) => {
    // Search filter
    const matchesSearch =
      member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    // Status filter
    if (filterStatus === 'all') return true
    return getFingerStatus(member) === filterStatus
  })

  const handleRegister = async (memberId: string, fingerNumber: 1 | 2): Promise<boolean> => {
    setLoadingMemberId(`${memberId}-${fingerNumber}`)
    
    try {
      // Simulate fingerprint registration process
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // Simulate success/failure (70% success rate)
      const isSuccess = Math.random() > 0.3

      if (isSuccess) {
        // Find the member and update
        const member = members.find((m) => m.id === memberId)
        if (!member) return false

        // Update database
        const updateField = fingerNumber === 1 ? 'finger1_registered' : 'finger2_registered'
        const { error } = await supabase
          .from('organization_members')
          .update({ [updateField]: true })
          .eq('id', member.organization_member_id)

        if (error) {
          console.error('Error updating member:', error)
          toast.error('Failed to save data')
          return false
        }

        // Update local state
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? {
                  ...m,
                  [`finger${fingerNumber}_registered`]: true,
                }
              : m
          )
        )

        toast.success(`Finger ${fingerNumber} for ${member.first_name} registered successfully`)
        return true
      } else {
        toast.error('Fingerprint invalid or not detected. Please try again.')
        return false
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Sensor error occurred. Please try again.')
      return false
    } finally {
      setLoadingMemberId(null)
    }
  }

  const registeredCount = members.filter(
    (m) => m.finger1_registered && m.finger2_registered
  ).length

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fully Registered</p>
              <p className="text-2xl font-semibold text-foreground">
                {registeredCount} <span className="text-muted-foreground font-normal text-sm">/ {members.length}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search, Refresh, and Filter Bar */}
      <div className="flex gap-2 w-full items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={fetchMembers}
          disabled={isLoading}
          className="shrink-0"
          title="Refresh data"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </Button>

        {/* Filter Dropdown */}
        <div className="relative group">
          <Button
            variant={filterStatus !== 'all' ? 'default' : 'outline'}
            size="icon"
            className="shrink-0"
            title="Filter options"
          >
            <Filter className="w-4 h-4" />
          </Button>
          
          {/* Filter Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-2 space-y-1">
              <button
                onClick={() => setFilterStatus('all')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  filterStatus === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                All Members
              </button>
              <button
                onClick={() => setFilterStatus('none')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  filterStatus === 'none'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                Not Registered
              </button>
              <button
                onClick={() => setFilterStatus('partial')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  filterStatus === 'partial'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                Partial (1 Finger)
              </button>
              <button
                onClick={() => setFilterStatus('complete')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  filterStatus === 'complete'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                Complete (2 Fingers)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground w-16">No</TableHead>
                  <TableHead className="font-semibold text-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Email</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Finger 1</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Finger 2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      {members.length === 0 ? 'No members found' : 'No data found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member, index) => (
                    <TableRow
                      key={member.id}
                      className={cn(
                        'transition-colors duration-200',
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/30',
                        'hover:bg-primary/5'
                      )}
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {member.first_name} {member.last_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <FingerButtonComponent
                          fingerNumber={1}
                          isRegistered={member.finger1_registered}
                          isLoading={loadingMemberId === `${member.id}-1`}
                          onRegister={() => handleRegister(member.id, 1)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <FingerButtonComponent
                          fingerNumber={2}
                          isRegistered={member.finger2_registered}
                          isLoading={loadingMemberId === `${member.id}-2`}
                          onRegister={() => handleRegister(member.id, 2)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Finger Button Component
interface FingerButtonComponentProps {
  fingerNumber: 1 | 2
  isRegistered: boolean
  isLoading: boolean
  onRegister: () => Promise<boolean>
}

function FingerButtonComponent({
  fingerNumber,
  isRegistered,
  isLoading,
  onRegister,
}: FingerButtonComponentProps) {
  const handleClick = async () => {
    if (isRegistered) return

    toast.info(`Please place finger ${fingerNumber} on the fingerprint sensor...`)
    await onRegister()
  }

  if (isRegistered) {
    return (
      <Badge variant="default" className="gap-1.5 py-1.5 px-3 bg-green-600 hover:bg-green-700">
        <Check className="w-3.5 h-3.5" />
        Registered
      </Badge>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'gap-2 transition-all duration-300',
        'hover:bg-primary hover:text-primary-foreground hover:border-primary',
        isLoading && 'bg-primary/10 border-primary'
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Scanning...
        </>
      ) : (
        <>
          <Fingerprint className="w-4 h-4" />
          Finger {fingerNumber}
        </>
      )}
    </Button>
  )
}
