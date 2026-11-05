import { Router } from 'express'
import { badRequest, notFound, requireParam, requireUserId } from '../lib/http.js'
import { calculateNextReview, isRating, previewIntervals } from '../lib/sm2.js'
import { daysUntil, endOfDay } from '../lib/time.js'
import prisma from '../prisma.js'
import { problemSelect } from '../services/progress.js'

const router = Router()

/** Everything in the user's revision schedule: what's due today and what's coming up. */
router.get('/', async (req, res) => {
  const userId = requireUserId(req)
  const now = new Date()
  const dueBefore = endOfDay(now, req.timeZone)

  const schedules = await prisma.revisionSchedule.findMany({
    where: { userId },
    orderBy: { nextReviewDate: 'asc' },
    include: {
      problem: {
        select: { ...problemSelect, topic: { select: { name: true } }, userProgress: { where: { userId }, select: { notes: true } } },
      },
    },
  })

  const items = schedules.map(({ problem: { userProgress, topic, ...problem }, ...schedule }) => ({
    problem: { ...problem, topicName: topic.name, notes: userProgress[0]?.notes ?? null },
    nextReviewDate: schedule.nextReviewDate,
    dueInDays: daysUntil(schedule.nextReviewDate, now, req.timeZone),
    intervalDays: schedule.intervalDays,
    repetitions: schedule.repetitions,
    lastRating: schedule.lastRating,
    previews: previewIntervals(schedule),
  }))

  res.json({
    due: items.filter((item) => item.nextReviewDate <= dueBefore),
    upcoming: items.filter((item) => item.nextReviewDate > dueBefore),
  })
})

router.post('/:problemId/rate', async (req, res) => {
  const userId = requireUserId(req)
  const problemId = requireParam(req, 'problemId')
  const rating = req.body?.rating
  if (!isRating(rating)) throw badRequest('Rating must be one of FORGOT, HARD, OKAY, EASY')

  const schedule = await prisma.revisionSchedule.findUnique({ where: { userId_problemId: { userId, problemId } } })
  if (!schedule) throw notFound('This problem is not in your revision schedule yet. Mark it as solved first.')

  const now = new Date()
  const next = calculateNextReview({ rating, ...schedule }, now)

  const [updated] = await prisma.$transaction([
    prisma.revisionSchedule.update({
      where: { id: schedule.id },
      data: { ...next, lastRating: rating },
    }),
    prisma.activity.create({ data: { userId, problemId, type: 'REVIEWED', rating, createdAt: now } }),
  ])

  res.json({
    message: 'Schedule updated',
    nextReviewDate: updated.nextReviewDate,
    intervalDays: updated.intervalDays,
    dueInDays: daysUntil(updated.nextReviewDate, now, req.timeZone),
  })
})

export default router
