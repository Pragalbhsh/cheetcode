import type { Prisma, Topic, User } from '@prisma/client'
import prisma from '../prisma.js'
import { hash } from '../lib/hash.js'
import { notFound } from '../lib/http.js'
import { previewIntervals } from '../lib/sm2.js'
import { daysUntil, endOfDay } from '../lib/time.js'
import { loadActivity } from './activity.js'
import { problemSelect } from './progress.js'

/** Problems the user still has to do (attempted-with-notes still counts as "to do"). */
export const remainingFor = (userId: string): Prisma.ProblemWhereInput => ({
  userProgress: { none: { userId, status: { in: ['SOLVED', 'SKIPPED'] } } },
})

async function nextProblemInTopic(userId: string, topicId: string) {
  return prisma.problem.findFirst({
    where: { topicId, ...remainingFor(userId) },
    orderBy: { orderIndex: 'asc' },
    select: problemSelect,
  })
}

/**
 * Returns the user's current topic and the next problem in it. When a topic is
 * finished the user automatically moves on to the next unfinished topic.
 */
async function resolveCurrentTopic(user: User & { currentTopic: Topic | null }) {
  let topic = user.currentTopic!
  let problem = await nextProblemInTopic(user.id, topic.id)
  let finishedTopic: string | null = null

  if (!problem) {
    const topics = await prisma.topic.findMany({
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        name: true,
        orderIndex: true,
        createdAt: true,
        _count: { select: { problems: { where: remainingFor(user.id) } } },
      },
    })
    const next =
      topics.find((t) => t.orderIndex > topic.orderIndex && t._count.problems > 0) ??
      topics.find((t) => t._count.problems > 0)

    if (next) {
      finishedTopic = topic.name
      await prisma.user.update({ where: { id: user.id }, data: { currentTopicId: next.id } })
      topic = { id: next.id, name: next.name, orderIndex: next.orderIndex, createdAt: next.createdAt }
      problem = await nextProblemInTopic(user.id, topic.id)
    }
  }

  return { topic, problem, finishedTopic }
}

/**
 * Busy day? The streak protector is one quick Easy problem: preferably one you
 * have already solved (a fast win that also refreshes memory), otherwise an
 * Easy from the topics you've reached. Picked once per day and kept stable.
 */
async function pickStreakProblem(userId: string, topicOrder: number, exclude: string[], seed: string) {
  const base: Prisma.ProblemWhereInput = { difficulty: 'EASY', id: { notIn: exclude } }
  const orderBy: Prisma.ProblemOrderByWithRelationInput[] = [{ topic: { orderIndex: 'asc' } }, { orderIndex: 'asc' }]
  const tiers: Prisma.ProblemWhereInput[] = [
    { ...base, userProgress: { some: { userId, status: 'SOLVED' } } },
    { ...base, topic: { orderIndex: { lte: topicOrder } } },
    base,
  ]
  for (const where of tiers) {
    const candidates = await prisma.problem.findMany({ where, orderBy, select: { id: true } })
    if (candidates.length > 0) return candidates[hash(seed) % candidates.length].id
  }
  return null
}

export async function getDailySession(userId: string, timeZone: string, now = new Date()) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { currentTopic: true } })
  if (!user) throw notFound('User not found')
  if (!user.currentTopic) return { needsOnboarding: true as const }

  const { topic, problem: newProblem, finishedTopic } = await resolveCurrentTopic(user)
  const dueBefore = endOfDay(now, timeZone)
  const dueWhere: Prisma.RevisionScheduleWhereInput = { userId, nextReviewDate: { lte: dueBefore } }

  const [activity, dueCount, dueSchedule, nextUpcoming, topicTotal, topicSolved, totalProblems, totalSolved] =
    await Promise.all([
      loadActivity(userId, timeZone, now),
      prisma.revisionSchedule.count({ where: dueWhere }),
      prisma.revisionSchedule.findFirst({
        where: dueWhere,
        orderBy: { nextReviewDate: 'asc' },
        include: { problem: { select: problemSelect } },
      }),
      prisma.revisionSchedule.findFirst({
        where: { userId, nextReviewDate: { gt: dueBefore } },
        orderBy: { nextReviewDate: 'asc' },
        select: { nextReviewDate: true },
      }),
      prisma.problem.count({ where: { topicId: topic.id } }),
      prisma.userProgress.count({ where: { userId, status: 'SOLVED', problem: { topicId: topic.id } } }),
      prisma.problem.count(),
      prisma.userProgress.count({ where: { userId, status: 'SOLVED' } }),
    ])

  const notesFor = async (problemIds: string[]) => {
    const rows = await prisma.userProgress.findMany({
      where: { userId, problemId: { in: problemIds }, notes: { not: null } },
      select: { problemId: true, notes: true },
    })
    return new Map(rows.map((row) => [row.problemId, row.notes]))
  }

  // Streak protector (opt-in)
  let streakProtector: { problem: unknown; done: boolean } | null = null
  if (user.streakProtector) {
    let pickId = user.streakProblemDay === activity.today ? user.streakProblemId : null
    let pick = pickId ? await prisma.problem.findUnique({ where: { id: pickId }, select: problemSelect }) : null
    if (!pick) {
      const exclude = [newProblem?.id, dueSchedule?.problemId].filter((id): id is string => Boolean(id))
      pickId = await pickStreakProblem(userId, topic.orderIndex, exclude, `${userId}:${activity.today}`)
      if (pickId) {
        pick = await prisma.problem.findUnique({ where: { id: pickId }, select: problemSelect })
        await prisma.user.update({
          where: { id: userId },
          data: { streakProblemId: pickId, streakProblemDay: activity.today },
        })
      }
    }
    if (pick) streakProtector = { problem: pick, done: activity.todayProblemIds.has(pick.id) }
  }

  const notes = await notesFor([newProblem?.id, dueSchedule?.problemId].filter((id): id is string => Boolean(id)))

  return {
    needsOnboarding: false as const,
    date: activity.today,
    username: user.username,
    leetcodeUsername: user.leetcodeUsername,
    topic: { id: topic.id, name: topic.name, orderIndex: topic.orderIndex, solved: topicSolved, total: topicTotal },
    finishedTopic,
    newProblem: newProblem ? { ...newProblem, notes: notes.get(newProblem.id) ?? null } : null,
    allTopicsComplete: !newProblem,
    revision: dueSchedule
      ? {
          problem: { ...dueSchedule.problem, notes: notes.get(dueSchedule.problemId) ?? null },
          intervalDays: dueSchedule.intervalDays,
          repetitions: dueSchedule.repetitions,
          lastRating: dueSchedule.lastRating,
          nextReviewDate: dueSchedule.nextReviewDate,
          overdueDays: Math.max(0, -daysUntil(dueSchedule.nextReviewDate, now, timeZone)),
          previews: previewIntervals(dueSchedule),
        }
      : null,
    dueCount,
    nextReviewDate: nextUpcoming?.nextReviewDate ?? null,
    streakProtector,
    today: activity.todayCounts,
    streak: activity.streak,
    totals: { solved: totalSolved, total: totalProblems },
  }
}
