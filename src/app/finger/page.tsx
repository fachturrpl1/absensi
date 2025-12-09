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

interface Student {
  id: string
  nisn: string
  name: string
  finger1_registered: boolean
  finger2_registered: boolean
  fingerprint_id: number | null
}

type FilterStatus = 'all' | 'none' | 'partial' | 'complete'

export default function FingerPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, nisn, name, finger1_registered, finger2_registered, fingerprint_id')
        .order('name')

      if (error) {
        toast.error('Failed to load students')
        console.error('Error fetching students:', error)
      } else {
        setStudents(
          (data || []).map((item) => ({
            id: item.id,
            nisn: item.nisn,
            name: item.name,
            finger1_registered: item.finger1_registered || false,
            finger2_registered: item.finger2_registered || false,
            fingerprint_id: item.fingerprint_id ?? null,
          }))
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const getFingerStatus = (student: Student): FilterStatus => {
    if (student.finger1_registered && student.finger2_registered) return 'complete'
    if (student.finger1_registered || student.finger2_registered) return 'partial'
    return 'none'
  }

  const filteredStudents = students.filter((student) => {
    // Search filter
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nisn.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    // Status filter
    if (filterStatus === 'all') return true
    return getFingerStatus(student) === filterStatus
  })

  const handleRegister = async (studentId: string, fingerNumber: 1 | 2): Promise<boolean> => {
    setLoadingStudentId(`${studentId}-${fingerNumber}`)
    
    try {
      // Simulate fingerprint registration process
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // Simulate success/failure (70% success rate)
      const isSuccess = Math.random() > 0.3

      if (isSuccess) {
        // Find the student and update
        const student = students.find((s) => s.id === studentId)
        if (!student) return false

        // Update database
        const updateField = fingerNumber === 1 ? 'finger1_registered' : 'finger2_registered'
        const { error } = await supabase
          .from('students')
          .update({ [updateField]: true })
          .eq('id', studentId)

        if (error) {
          console.error('Error updating student:', error)
          toast.error('Failed to save data')
          return false
        }

        // Update local state
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? {
                  ...s,
                  [`finger${fingerNumber}_registered`]: true,
                }
              : s
          )
        )

        toast.success(`Finger ${fingerNumber} for ${student.name} registered successfully`)
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
      setLoadingStudentId(null)
    }
  }

  const registeredCount = students.filter(
    (s) => s.finger1_registered && s.finger2_registered
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
                {registeredCount} <span className="text-muted-foreground font-normal text-sm">/ {students.length}</span>
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
            placeholder="Search by name or NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={fetchStudents}
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
                All Students
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

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground w-16">No</TableHead>
                  <TableHead className="font-semibold text-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">NISN</TableHead>
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
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      {students.length === 0 ? 'No students found' : 'No data found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => (
                    <TableRow
                      key={student.id}
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
                        {student.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {student.nisn}
                      </TableCell>
                      <TableCell className="text-center">
                        <FingerButtonComponent
                          fingerNumber={1}
                          isRegistered={student.finger1_registered}
                          isLoading={loadingStudentId === `${student.id}-1`}
                          onRegister={() => handleRegister(student.id, 1)}
                          studentName={student.name}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <FingerButtonComponent
                          fingerNumber={2}
                          isRegistered={student.finger2_registered}
                          isLoading={loadingStudentId === `${student.id}-2`}
                          onRegister={() => handleRegister(student.id, 2)}
                          studentName={student.name}
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
  studentName: string
}

function FingerButtonComponent({
  fingerNumber,
  isRegistered,
  isLoading,
  onRegister,
  studentName,
}: FingerButtonComponentProps) {
  const handleClick = async () => {
    if (isRegistered) return

    const namePrefix = studentName ? `${studentName}: ` : ''
    toast.info(`${namePrefix}Please place finger ${fingerNumber} on the fingerprint sensor...`)
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


