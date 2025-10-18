import { describe, it, expect, vi } from 'vitest'

interface SupabaseMaybeSingle<T> {
  maybeSingle: () => Promise<{ data: T }>
}

interface SupabaseSelectQuery {
  eq: (
    column: string,
    value: string
  ) => {
    order: (
      field: string,
      order?: 'asc' | 'desc'
    ) => {
      limit: (limit: number) => SupabaseMaybeSingle<{ attendance_date: string }>
      maybeSingle: () => Promise<{ data: { attendance_date: string } }>
    }
  }
}

const countsByStatus: Record<string, number> = {
  present: 12,
  late: 3,
  absent: 1,
  excused: 0,
}

type QueryHandlerResult = {
  data?: unknown[] | Record<string, unknown> | null
  error?: unknown
  count?: number
}

type QueryHandler = (filters: Record<string, unknown>) => Promise<QueryHandlerResult>

const createQueryBuilder = (handler: QueryHandler) => {
  const filters: Record<string, unknown> = {}

  const execute = async () => handler({ ...filters })

  const builder = {
    eq(column: string, value: unknown) {
      filters[column] = value
      return builder
    },
    gte(column: string, value: unknown) {
      filters[`gte:${column}`] = value
      return builder
    },
    order(field: string, options?: Record<string, unknown>) {
      filters[`order:${field}`] = options ?? {}
      return builder
    },
    limit(value: number) {
      filters.limit = value
      return builder
    },
    async maybeSingle() {
      const result = await execute()
      const rawData = Array.isArray(result.data) ? result.data[0] ?? null : result.data ?? null
      return { data: rawData, error: result.error ?? null }
    },
    then(onFulfilled: (value: QueryHandlerResult) => unknown, onRejected?: (reason: unknown) => unknown) {
      return execute().then(onFulfilled, onRejected)
    },
  }

  return builder
}

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => ({
      select: (columns: string, options?: Record<string, unknown>) => {
        const handler: QueryHandler = async (filters) => {
          if (table === 'attendance_records' && columns === 'id' && options?.count === 'exact') {
            const status = (filters.status as string) ?? ''
            return { count: countsByStatus[status] ?? 0, error: null }
          }

          if (table === 'attendance_records' && columns.includes('organization_members')) {
            return {
              data: [
                {
                  attendance_date: '2025-10-01',
                  organization_members: {},
                },
              ],
              error: null,
            }
          }

          if (table === 'attendance_records' && columns === 'work_duration_minutes') {
            return {
              data: [
                { work_duration_minutes: 480 },
                { work_duration_minutes: 450 },
              ],
              error: null,
            }
          }

          if (table === 'attendance_records' && columns.includes('id,status,attendance_date')) {
            const since = (filters['gte:attendance_date'] as string) ?? '2025-09-01'
            return {
              data: [
                { id: '1', status: 'present', attendance_date: since, work_duration_minutes: 480 },
                { id: '2', status: 'late', attendance_date: '2025-09-05', work_duration_minutes: 450 },
              ],
              error: null,
            }
          }

          if (table === 'attendance_records' && columns.includes('actual_check_in')) {
            return {
              data: [
                {
                  actual_check_in: '2025-09-10T08:30:00Z',
                  actual_check_out: '2025-09-10T17:15:00Z',
                  work_duration_minutes: 525,
                },
                {
                  actual_check_in: '08:45',
                  actual_check_out: '17:05',
                  work_duration_minutes: 500,
                },
              ],
              error: null,
            }
          }

          return { data: [], error: null }
        }

        return createQueryBuilder(handler)
      },
    }),
  }),
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
