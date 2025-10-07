import { formatInTimeZone } from "date-fns-tz";

export function formatLocalTime(
  utcString: string | null | undefined,
  timezone: string,
  formatStr = "HH:mm"
) {
  if (!utcString) return "-";

  try {
    const date = new Date(utcString);
    const formatted = formatInTimeZone(date, timezone, formatStr);
    return formatted;
  } catch (err) {
    console.error("Error formatting time:", err);
    return "-";
  }
}
