"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAllDepartments } from '@/action/departement'
import { getAllPositions } from '@/action/position'

type Member = any

export default function MemberProfileClient({ initialMember }: { initialMember: Member }) {
  const [editing, setEditing] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [member, setMember] = React.useState<Member>(initialMember)

  const [email, setEmail] = React.useState(member.user?.email ?? '')
  const [dob, setDob] = React.useState(member.user?.date_of_birth ? new Date(member.user.date_of_birth).toISOString().slice(0,10) : '')
  const [departmentId, setDepartmentId] = React.useState(member.departments?.id ?? '')
  const [positionId, setPositionId] = React.useState(member.positions?.id ?? '')

  const [departments, setDepartments] = React.useState<{ id: string; name: string }[]>([])
  const [positions, setPositions] = React.useState<{ id: string; title: string }[]>([])

  React.useEffect(() => {
    let mounted = true
    getAllDepartments().then((res: any) => {
      if (!mounted) return
      if (res?.success) setDepartments(res.data)
    })
    getAllPositions().then((res: any) => {
      if (!mounted) return
      if (res?.success) setPositions(res.data)
    })
    return () => { mounted = false }
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload: any = {
        user: {
          email,
          date_of_birth: dob || null,
        },
        organization_member: {
          department_id: departmentId || null,
          position_id: positionId || null,
        }
      }

      const res = await fetch('/api/members/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, payload })
      })

      const json = await res.json()
      if (json.success) {
        // merge updates locally
        setMember((cur: any) => ({
          ...cur,
          user: {
            ...cur.user,
            email,
            date_of_birth: dob || null,
          },
          departments: departments.find(d => d.id === departmentId) ?? cur.departments,
          positions: positions.find(p => p.id === positionId) ?? cur.positions,
        }))
        setEditing(false)
      } else {
        alert(json.message || 'Failed to save')
      }
    } catch (err: any) {
      alert(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar / Photo */}
        <div className="flex-shrink-0">
          <div className="w-28 h-28 bg-gray-100 rounded-full overflow-hidden">
            {member.user?.profile_photo_url ? (
              // @ts-ignore
              <img src={member.user.profile_photo_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 w-full">
          <h3 className="text-xl font-semibold mb-3 text-left">{member.user?.display_name ?? `${member.user?.first_name ?? ''} ${member.user?.last_name ?? ''}`}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Employee ID</label>
              <Input readOnly value={member.employee_id ?? '-'} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editing} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input readOnly value={member.user?.phone ?? '-'} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Group</label>
              <Select onValueChange={(v) => setDepartmentId(v)} value={departmentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={member.departments?.name ?? 'Select group'} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Position</label>
              <Select onValueChange={(v) => setPositionId(v)} value={positionId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={member.positions?.title ?? 'Select position'} />
                </SelectTrigger>
                <SelectContent>
                  {positions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Hire Date</label>
              <Input readOnly value={member.hire_date ? new Date(member.hire_date).toLocaleDateString() : '-'} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">DOB</label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} disabled={!editing} />
            </div>

            {member.user?.national_id && (
              <div>
                <label className="text-xs text-muted-foreground">National ID</label>
                <Input readOnly value={member.user.national_id} />
              </div>
            )}
          </div>

          <div className="mt-4 flex md:justify-start justify-center">
            {!editing ? (
              <Button onClick={() => setEditing(true)}>Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(false)} disabled={loading}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
