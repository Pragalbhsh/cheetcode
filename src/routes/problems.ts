import { Router } from 'express'
import { badRequest, optionalString, requireParam, requireUserId } from '../lib/http.js'
import { daysUntil } from '../lib/time.js'
import prisma from '../prisma.js'
import {
  importPreviouslySolved,
  problemSelect,
  resetProblem,
  saveNotes,
  skipProblem,
  solveProblem,
} from '../services/progress.js'

const router = Router()

/** Every topic with every problem and the user's status on it: powers the Roadmap page. */
router.get('/roadmap', async (req, res) => {
  const userId = requireUserId(req)
  const now = new Date()
  const [user, topics, progress, schedules] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currentTopicId: true } }),
    prisma.topic.findMany({
      orderBy: { orderIndex: 'asc' },
      include: { problems: { orderBy: { orderIndex: 'asc' }, select: problemSelect } },
    }),
    prisma.userProgress.findMany({
      where: { userId },
      select: { problemId: true, status: true, notes: true, solvedAt: true },
    }),
    prisma.revisionSchedule.findMany({
      where: { userId },
      select: { problemId: true, nextReviewDate: true, intervalDays: true },
    }),
  ])

  const progressById = new Map(progress.map((row) => [row.problemId, row]))
  const scheduleById = new Map(schedules.map((row) => [row.problemId, row]))

  res.json({
    currentTopicId: user.currentTopicId,
    topics: topics.map((topic) => {
      const problems = topic.problems.map((problem) => {
        const p = progressById.get(problem.id)
        const s = scheduleById.get(problem.id)
        return {
          ...problem,
          status: p?.status ?? null,
          notes: p?.notes ?? null,
          solvedAt: p?.solvedAt ?? null,
          nextReviewDate: s?.nextReviewDate ?? null,
          intervalDays: s?.intervalDays ?? null,
          dueInDays: s ? daysUntil(s.nextReviewDate, now, req.timeZone) : null,
        }
      })
      return {
        id: topic.id,
        name: topic.name,
        orderIndex: topic.orderIndex,
        total: problems.length,
        solved: problems.filter((problem) => problem.status === 'SOLVED').length,
        problems,
      }
    }),
  })
})

/** Mark problems you solved before joining (by id and/or whole topics). Reviews are spread out. */
router.post('/import', async (req, res) => {
  const userId = requireUserId(req)
  const problemIds: unknown = req.body?.problemIds ?? []
  const topicIds: unknown = req.body?.topicIds ?? []
  const isIdList = (value: unknown): value is string[] =>
    Array.isArray(value) && value.length <= 500 && value.every((id) => typeof id === 'string')
  if (!isIdList(problemIds) || !isIdList(topicIds)) throw badRequest('problemIds and topicIds must be lists of ids')

  const fromTopics = topicIds.length
    ? await prisma.problem.findMany({ where: { topicId: { in: topicIds } }, select: { id: true } })
    : []
  res.json(await importPreviouslySolved(userId, [...problemIds, ...fromTopics.map((p) => p.id)]))
})

router.post('/:problemId/solve', async (req, res) => {
  res.json(await solveProblem(requireUserId(req), requireParam(req, 'problemId')))
})

router.post('/:problemId/skip', async (req, res) => {
  res.json(await skipProblem(requireUserId(req), requireParam(req, 'problemId')))
})

router.delete('/:problemId/progress', async (req, res) => {
  await resetProblem(requireUserId(req), requireParam(req, 'problemId'))
  res.json({ message: 'Progress reset' })
})

router.put('/:problemId/notes', async (req, res) => {
  const notes = optionalString(req.body?.notes, 'Notes', 2000) ?? null
  res.json(await saveNotes(requireUserId(req), requireParam(req, 'problemId'), notes))
})

export default router
