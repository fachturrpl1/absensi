import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

export function formatLocalTime(
  utcString: string | null | undefined,
  timezoneArg: string,
  timeFormat: "12h" | "24h" = "24h",
  includeDate: boolean = false
) {
  if (!utcString || utcString === "-" || typeof utcString !== "string" || utcString.trim() === "") {
    return "-"
  }

  let normalized = utcString.trim().replace(" ", "T")
  
  if (normalized.endsWith("+00")) {
    normalized = normalized.slice(0, -3) + "+00:00"
  }

  const dateObj = dayjs.utc(normalized)

  if (!dateObj.isValid()) {
    return "-"
  }

  try {
    let formatStr = ""
    
    if (includeDate) {
      formatStr = timeFormat === "12h" ? "DD MMM YYYY, hh:mm A" : "DD MMM YYYY, HH:mm"
    } else {
      formatStr = timeFormat === "12h" ? "hh:mm A" : "HH:mm"
    }

    return dateObj.tz(timezoneArg).format(formatStr)
  } catch {
    return "-"
  }
}