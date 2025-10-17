import { describe, it, expect, vi } from 'vitest'

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => ({
      select: (_: string, opts?: any) => ({
        eq: (_k: string, _v: any) => ({
          order: (_f: string, _o?: any) => ({
            limit: (_n: number) => ({
              maybeSingle: async () => ({ data: { attendance_date: '2025-10-01' } } ),
            }),
            maybeSingle: async () => ({ data: { attendance_date: '2025-10-01' } } ),
          }),
          then: async () => ({ data: [] })
        }),
        // For avg/rescent queries return data arrays
        then: async () => ({ data: [] }),
      }),
    }),
  })
}))

import { getMemberPerformance } from '@/action/member_performance'

describe('getMemberPerformance', () => {
  it('returns success and data shape', async () => {
    const res = await getMemberPerformance('member-1')
    expect(res.success).toBe(true)
    expect(res.data).toHaveProperty('counts')
    expect(res.data).toHaveProperty('averageWorkDurationMinutes')
    expect(res.data).toHaveProperty('recent30')
  })
})
