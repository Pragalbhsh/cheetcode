import prisma from '../prisma.js'
import { computeStreaks } from '../lib/streak.js'
import { dayKey } from '../lib/time.js'

/** Per-day activity counts for a user, keyed by YYYY-MM-DD in the user's time zone. */
export async function loadActivity(userId: string, timeZone: string, now = new Date()) {
  const rows = await prisma.activity.findMany({
    where: { userId },
    select: { createdAt: true, type: true, problemId: true },
  })

  const today = dayKey(now, timeZone)
  const perDay = new Map<string, number>()
  const todayCounts = { solved: 0, reviewed: 0, practiced: 0 }
  const todayProblemIds = new Set<string>()

  for (const row of rows) {
    const key = dayKey(row.createdAt, timeZone)
    perDay.set(key, (perDay.get(key) ?? 0) + 1)
    if (key === today) {
      if (row.type === 'SOLVED') todayCounts.solved++
      else if (row.type === 'REVIEWED') todayCounts.reviewed++
      else todayCounts.practiced++
      if (row.problemId) todayProblemIds.add(row.problemId)
    }
  }

  return {
    today,
    perDay,
    todayCounts,
    todayProblemIds,
    streak: computeStreaks(perDay.keys(), today),
    totalActivities: rows.length,
  }
}
