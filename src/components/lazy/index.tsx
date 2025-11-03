/**
 * Lazy Loading Component Registry
 * 
 * This file provides centralized lazy-loaded components to improve initial page load time.
 * Components are loaded on-demand when they are actually needed.
 */

import dynamic from 'next/dynamic'
import { ComponentType, ReactElement } from 'react'

// Loading fallback component
const LoadingFallback = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  )
}

// ============================================================================
// FORMS - Large form components (lazy loaded to reduce initial bundle)
// ============================================================================

export const LazyAccountForm = dynamic(
  () => import('@/components/form/account-form').then(m => ({ default: m.AccountForm })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyAttendanceForm = dynamic(
  () => import('@/components/form/attendance-form').then(m => ({ default: m.AttendanceForm })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyAttendanceFormBatch = dynamic(
  () => import('@/components/form/attendance-form-batch').then(m => ({ default: m.AttendanceFormBatch })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyAttendanceFormClean = dynamic(
  () => import('@/components/form/attendance-form-clean').then(m => ({ default: m.AttendanceFormClean })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyAttendanceFormV2 = dynamic(
  () => import('@/components/form/attendance-form-v2').then(m => ({ default: m.AttendanceFormV2 })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyMembersForm = dynamic(
  () => import('@/components/form/members-form'),
  { loading: LoadingFallback, ssr: false }
)

export const LazyOrganizationForm = dynamic(
  () => import('@/components/form/organization-form'),
  { loading: LoadingFallback, ssr: false }
)

// ============================================================================
// CHARTS - Heavy visualization components
// ============================================================================

export const LazyGroupChart = dynamic(
  () => import('@/components/bar-chart').then(mod => ({ default: mod.GroupChart })),
  { loading: LoadingFallback }
)

export const LazyChartLineDots = dynamic(
  () => import('@/components/line-chart').then(mod => ({ default: mod.ChartLineDots })),
  { loading: LoadingFallback }
)

export const LazyMemberStatusChart = dynamic(
  () => import('@/components/pie-chart').then(mod => ({ default: mod.MemberStatusChart })),
  { loading: LoadingFallback }
)

export const LazyMonthlyTrendChart = dynamic(
  () => import('@/components/charts/monthly-trend-chart').then(mod => ({ default: mod.MonthlyTrendChart })),
  { loading: LoadingFallback }
)

export const LazyMemberPerformanceRadar = dynamic(
  () => import('@/components/charts/member-performance-radar'),
  { loading: LoadingFallback }
)

// ============================================================================
// TABLES - Data-heavy table components
// ============================================================================

export const LazyAttendanceByGroupTable = dynamic(
  () => import('@/components/attendance-by-group-table/attendance-by-group-table').then(mod => ({ default: mod.AttendanceByGroupTable })),
  { loading: LoadingFallback }
)

export const LazyDataTable = dynamic(
  () => import('@/components/data-table').then(m => ({ default: m.DataTable })),
  { loading: LoadingFallback }
)

export const LazyMemberList = dynamic(
  () => import('@/components/member-list').then(m => ({ default: m.MembersList })),
  { loading: LoadingFallback }
)

// ============================================================================
// IMAGE COMPONENTS - Heavy image processing components
// ============================================================================

export const LazyImageCompressionUpload = dynamic(
  () => import('@/components/image-compression-upload').then(m => ({ default: m.ImageCompressionUpload })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyChangeFoto = dynamic(
  () => import('@/components/change-foto'),
  { loading: LoadingFallback, ssr: false }
)

export const LazyPhotoUploadDialog = dynamic(
  () => import('@/components/photo-upload-dialog').then(m => ({ default: m.PhotoUploadDialog })),
  { loading: LoadingFallback, ssr: false }
)

// ============================================================================
// DASHBOARD COMPONENTS - Dashboard-specific heavy components
// ============================================================================

export const LazyDepartmentComparison = dynamic(
  () => import('@/components/dashboard/department-comparison').then(mod => ({ default: mod.DepartmentComparison })),
  { loading: LoadingFallback }
)

export const LazyRecentActivityFeed = dynamic(
  () => import('@/components/dashboard/recent-activity-feed').then(mod => ({ default: mod.RecentActivityFeed })),
  { loading: LoadingFallback }
)

export const LazyTodaySummaryHero = dynamic(
  () => import('@/components/dashboard/today-summary-hero').then(mod => ({ default: mod.TodaySummaryHero })),
  { loading: LoadingFallback }
)

// ============================================================================
// CLIENT COMPONENTS - Heavy client-side components
// ============================================================================

// LazyMembersClient removed - members-client.tsx has been merged into page.tsx

export const LazyAttendanceClient = dynamic(
  () => import('@/app/attendance/attendance-client'),
  { loading: LoadingFallback, ssr: false }
)

// ============================================================================
// MEMBER PROFILE - Heavy profile component
// ============================================================================

export const LazyMemberProfile = dynamic(
  () => import('@/components/members/member-profile'),
  { loading: LoadingFallback }
)

// ============================================================================
// UTILITY: Create lazy component with custom loading
// ============================================================================

export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T } | T>,
  options?: {
    loading?: () => ReactElement
    ssr?: boolean
  }
) {
  return dynamic(
    async () => {
      const mod = await importFunc()
      return 'default' in mod ? mod : { default: mod as T }
    },
    {
      loading: options?.loading,
      ssr: options?.ssr ?? true,
    }
  )
}
