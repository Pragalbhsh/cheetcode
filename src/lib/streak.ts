import { shiftDayKey } from './time.js'

export interface StreakInfo {
  /** Consecutive active days ending today (or yesterday, if today isn't done yet). */
  current: number
  longest: number
  activeToday: boolean
}

export function computeStreaks(activeDays: Iterable<string>, today: string): StreakInfo {
  const days = new Set([...activeDays].filter((day) => day <= today))
  const activeToday = days.has(today)

  // A streak is still alive if you were active yesterday and haven't done today yet.
  let current = 0
  let cursor = activeToday ? today : shiftDayKey(today, -1)
  while (days.has(cursor)) {
    current++
    cursor = shiftDayKey(cursor, -1)
  }

  let longest = 0
  let run = 0
  let previous: string | null = null
  for (const day of [...days].sort()) {
    run = previous !== null && shiftDayKey(previous, 1) === day ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = day
  }

  return { current, longest: Math.max(longest, current), activeToday }
}
