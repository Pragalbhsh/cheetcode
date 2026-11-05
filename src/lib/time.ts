// "Today" depends on where the user is. The frontend sends its IANA time zone
// (e.g. "Asia/Kolkata") in the X-Timezone header and all day-based logic
// (what is due today, streaks, heatmap) is computed in that zone.

const DAY_MS = 24 * 60 * 60 * 1000
const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    formatters.set(timeZone, formatter)
  }
  return formatter
}

export function resolveTimeZone(input: unknown): string {
  if (typeof input !== 'string' || input.length === 0 || input.length > 64) return 'UTC'
  try {
    formatterFor(input)
    return input
  } catch {
    return 'UTC'
  }
}

function zonedParts(date: Date, timeZone: string) {
  const parts: Record<string, string> = {}
  for (const part of formatterFor(timeZone).formatToParts(date)) parts[part.type] = part.value
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

/** Calendar day (YYYY-MM-DD) of `date` in `timeZone`. */
export function dayKey(date: Date, timeZone: string): string {
  const { year, month, day } = zonedParts(date, timeZone)
  return `${year}-${month}-${day}`
}

/** Shift a YYYY-MM-DD key by whole days. */
export function shiftDayKey(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Last millisecond of the current day in `timeZone` (DST edge cases are off by at most an hour). */
export function endOfDay(now: Date, timeZone: string): Date {
  const { hour, minute, second } = zonedParts(now, timeZone)
  const elapsedMs = ((hour * 60 + minute) * 60 + second) * 1000 + now.getMilliseconds()
  return new Date(now.getTime() - elapsedMs + DAY_MS - 1)
}

/** Whole days from today until `date` (0 = today, negative = overdue). */
export function daysUntil(date: Date, now: Date, timeZone: string): number {
  const from = Date.parse(`${dayKey(now, timeZone)}T00:00:00Z`)
  const to = Date.parse(`${dayKey(date, timeZone)}T00:00:00Z`)
  return Math.round((to - from) / DAY_MS)
}
