import { Router } from 'express'
import { requireUserId } from '../lib/http.js'
import { endOfDay, shiftDayKey } from '../lib/time.js'
import prisma from '../prisma.js'
import { loadActivity } from '../services/activity.js'

const router = Router()
const HEATMAP_DAYS = 53 * 7
const MASTERED_INTERVAL_DAYS = 21

router.get('/', async (req, res) => {
  const userId = requireUserId(req)
  const now = new Date()

  const [activity, problems, solved, schedules, activityByType] = await Promise.all([
    loadActivity(userId, req.timeZone, now),
    prisma.problem.findMany({
      select: { id: true, difficulty: true, blind75: true, topic: { select: { id: true, name: true, orderIndex: true } } },
    }),
    prisma.userProgress.findMany({ where: { userId, status: 'SOLVED' }, select: { problemId: true } }),
    prisma.revisionSchedule.findMany({ where: { userId }, select: { intervalDays: true, nextReviewDate: true } }),
    prisma.activity.groupBy({ by: ['type'], where: { userId }, _count: { _all: true } }),
  ])

  const solvedIds = new Set(solved.map((row) => row.problemId))
  const tally = () => ({ solved: 0, total: 0 })
  const byDifficulty = { EASY: tally(), MEDIUM: tally(), HARD: tally() }
  const blind75 = tally()
  const topics = new Map<string, { id: string; name: string; orderIndex: number; solved: number; total: number }>()

  for (const problem of problems) {
    const isSolved = solvedIds.has(problem.id)
    const bump = (bucket: { solved: number; total: number }) => {
      bucket.total++
      if (isSolved) bucket.solved++
    }
    bump(byDifficulty[problem.difficulty])
    if (problem.blind75) bump(blind75)
    if (!topics.has(problem.topic.id)) topics.set(problem.topic.id, { ...problem.topic, solved: 0, total: 0 })
    bump(topics.get(problem.topic.id)!)
  }

  const heatmap = Array.from({ length: HEATMAP_DAYS }, (_, i) => {
    const date = shiftDayKey(activity.today, i - (HEATMAP_DAYS - 1))
    return { date, count: activity.perDay.get(date) ?? 0 }
  })

  const dueBefore = endOfDay(now, req.timeZone)
  const countOf = (type: string) => activityByType.find((row) => row.type === type)?._count._all ?? 0

  res.json({
    today: activity.today,
    streak: activity.streak,
    todayCounts: activity.todayCounts,
    activeDays: activity.perDay.size,
    totals: { solved: solvedIds.size, total: problems.length, byDifficulty, blind75 },
    topics: [...topics.values()].sort((a, b) => a.orderIndex - b.orderIndex),
    reviews: {
      scheduled: schedules.length,
      due: schedules.filter((s) => s.nextReviewDate <= dueBefore).length,
      mastered: schedules.filter((s) => s.intervalDays >= MASTERED_INTERVAL_DAYS).length,
      totalReviews: countOf('REVIEWED'),
    },
    heatmap,
  })
})

export default router
