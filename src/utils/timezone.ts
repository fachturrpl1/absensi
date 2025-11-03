import { formatInTimeZone } from "date-fns-tz";

import { logger } from '@/lib/logger';
export function formatLocalTime(
  utcString: string | null | undefined,
  timezone: string,
  timeFormat: '12h' | '24h' = '24h'
) {
  if (!utcString) return "-";

  try {
    const date = new Date(utcString);
    const formatStr = timeFormat === '12h' ? 'hh:mm a' : 'HH:mm';
    const formatted = formatInTimeZone(date, timezone, formatStr);
    return formatted;
  } catch (err) {
    logger.error("Error formatting time:", err);
    return "-";
  }
}
