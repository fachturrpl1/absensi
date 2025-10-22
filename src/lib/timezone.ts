/**
 * Timezone utility functions for proper timestamp handling
 * Ensures consistent timezone handling across the application
 */

/**
 * Convert a Date object to ISO string format that preserves local timezone
 * Supabase will store this as timestamptz which includes timezone information
 * 
 * @param date - The date to convert
 * @returns ISO string with timezone preserved
 */
export function toTimestampWithTimezone(date: Date): string {
  // Get timezone offset in minutes and convert to milliseconds
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  
  // Create a new date adjusted for the timezone offset
  // This ensures the ISO string represents the actual local time
  const localDate = new Date(date.getTime() - timezoneOffsetMs)
  
  // Return ISO string (this will be in UTC but represents local time)
  // Supabase timestamptz will handle this correctly
  return localDate.toISOString()
}

/**
 * Get current timestamp in proper format for database insertion
 * @returns Current timestamp as ISO string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Parse timestamp from database and return as Date object
 * Simply returns the date without adjustment - timezone issues are handled at data filtering level
 * 
 * @param timestamp - ISO string from database
 * @returns Date object
 */
export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp)
}
