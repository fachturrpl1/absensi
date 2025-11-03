/**
 * Import optimization utilities
 * Helps reduce bundle size by providing optimized imports
 */

// Optimize Lucide React imports
// Instead of: import { Icon1, Icon2 } from 'lucide-react'
// Use: import Icon1 from 'lucide-react/dist/esm/icons/icon-1'

export * from 'lucide-react/dist/esm/icons/alert-circle';
export * from 'lucide-react/dist/esm/icons/arrow-left';
export * from 'lucide-react/dist/esm/icons/arrow-right';
export * from 'lucide-react/dist/esm/icons/calendar';
export * from 'lucide-react/dist/esm/icons/check';
export * from 'lucide-react/dist/esm/icons/chevron-down';
export * from 'lucide-react/dist/esm/icons/chevron-left';
export * from 'lucide-react/dist/esm/icons/chevron-right';
export * from 'lucide-react/dist/esm/icons/chevron-up';
export * from 'lucide-react/dist/esm/icons/clock';
export * from 'lucide-react/dist/esm/icons/copy';
export * from 'lucide-react/dist/esm/icons/download';
export * from 'lucide-react/dist/esm/icons/edit';
export * from 'lucide-react/dist/esm/icons/eye';
export * from 'lucide-react/dist/esm/icons/eye-off';
export * from 'lucide-react/dist/esm/icons/file';
export * from 'lucide-react/dist/esm/icons/filter';
export * from 'lucide-react/dist/esm/icons/home';
export * from 'lucide-react/dist/esm/icons/loader-2';
export * from 'lucide-react/dist/esm/icons/log-out';
export * from 'lucide-react/dist/esm/icons/menu';
export * from 'lucide-react/dist/esm/icons/more-horizontal';
export * from 'lucide-react/dist/esm/icons/more-vertical';
export * from 'lucide-react/dist/esm/icons/plus';
export * from 'lucide-react/dist/esm/icons/refresh-cw';
export * from 'lucide-react/dist/esm/icons/search';
export * from 'lucide-react/dist/esm/icons/settings';
export * from 'lucide-react/dist/esm/icons/trash';
export * from 'lucide-react/dist/esm/icons/upload';
export * from 'lucide-react/dist/esm/icons/user';
export * from 'lucide-react/dist/esm/icons/users';
export * from 'lucide-react/dist/esm/icons/x';

// Optimize date-fns imports
// Use specific function imports instead of importing the entire library
export { format } from 'date-fns/format';
export { parseISO } from 'date-fns/parseISO';
export { startOfDay } from 'date-fns/startOfDay';
export { endOfDay } from 'date-fns/endOfDay';
export { startOfWeek } from 'date-fns/startOfWeek';
export { endOfWeek } from 'date-fns/endOfWeek';
export { startOfMonth } from 'date-fns/startOfMonth';
export { endOfMonth } from 'date-fns/endOfMonth';
export { addDays } from 'date-fns/addDays';
export { subDays } from 'date-fns/subDays';
export { addMonths } from 'date-fns/addMonths';
export { subMonths } from 'date-fns/subMonths';
export { differenceInDays } from 'date-fns/differenceInDays';
export { differenceInHours } from 'date-fns/differenceInHours';
export { differenceInMinutes } from 'date-fns/differenceInMinutes';
export { isAfter } from 'date-fns/isAfter';
export { isBefore } from 'date-fns/isBefore';
export { isValid } from 'date-fns/isValid';
export { isToday } from 'date-fns/isToday';

// Optimize lodash imports (if used)
// Instead of: import _ from 'lodash'
// Use: import debounce from 'lodash/debounce'

// Bundle size optimization tips:
/**
 * 1. Use dynamic imports for heavy components
 * 2. Import only what you need from libraries
 * 3. Use tree-shaking friendly imports
 * 4. Lazy load routes and components
 * 5. Optimize images with next/image
 * 6. Use CSS modules or Tailwind instead of CSS-in-JS libraries
 * 7. Minimize the use of large third-party libraries
 * 8. Use production builds for testing bundle size
 * 9. Enable compression (gzip/brotli) in production
 * 10. Use next/font for optimized font loading
 */
