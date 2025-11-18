import { formatInTimeZone } from "date-fns-tz";

export function formatLocalTime(
  utcString: string | null | undefined,
  timezone: string,
  timeFormat: '12h' | '24h' = '24h',
  includeDate: boolean = false
) {
  // Return early for null, undefined, empty string, or "-"
  if (!utcString || utcString === "-" || typeof utcString !== 'string' || utcString.trim() === "") {
    return "-";
  }

  // Create date and validate BEFORE any operations
  const date = new Date(utcString);
  
  // Check if date is valid - return immediately if not
  if (!date || isNaN(date.getTime()) || date.getTime() === 0) {
    return "-";
  }

  try {
    let formatStr: string;
    
    if (includeDate) {
      formatStr = timeFormat === '12h' ? 'dd MMM yyyy, hh:mm a' : 'dd MMM yyyy, HH:mm';
    } else {
      formatStr = timeFormat === '12h' ? 'hh:mm a' : 'HH:mm';
    }
    
    const formatted = formatInTimeZone(date, timezone, formatStr);
    return formatted;
  } catch {
    // Silently return "-" for any formatting errors
    return "-";
  }
}
