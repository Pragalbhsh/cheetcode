import prisma from '../prisma.js'
import { hash } from '../lib/hash.js'
import { addDays } from '../lib/sm2.js'
import { notFound } from '../lib/http.js'

/** Fields of a problem that the frontend needs everywhere. */
export const problemSelect = {
  id: true,
  title: true,
  difficulty: true,
  leetcodeSlug: true,
  videoId: true,
  freeLink: true,
  premium: true,
  blind75: true,
  topicId: true,
  orderIndex: true,
} as const

const SPREAD_DAYS = 14

async function assertProblemExists(problemId: string) {
  const problem = await prisma.problem.findUnique({ where: { id: problemId }, select: { id: true } })
  if (!problem) throw notFound('Problem not found')
}

/**
 * The user solved a problem today. First time → status SOLVED, first review
 * tomorrow. Already solved → logged as practice (still counts for the streak).
 */
export async function solveProblem(userId: string, problemId: string, now = new Date()) {
  await assertProblemExists(problemId)

  return prisma.$transaction(async (tx) => {
    const existing = await tx.userProgress.findUnique({ where: { userId_problemId: { userId, problemId } } })

    if (existing?.status === 'SOLVED') {
      await tx.activity.create({ data: { userId, problemId, type: 'PRACTICED', createdAt: now } })
      const schedule = await tx.revisionSchedule.findUnique({ where: { userId_problemId: { userId, problemId } } })
      return { firstSolve: false, nextReviewDate: schedule?.nextReviewDate ?? null }
    }

    await tx.userProgress.upsert({
      where: { userId_problemId: { userId, problemId } },
      update: { status: 'SOLVED', solvedAt: now, autoImported: false },
      create: { userId, problemId, status: 'SOLVED', solvedAt: now },
    })
    const schedule = await tx.revisionSchedule.upsert({
      where: { userId_problemId: { userId, problemId } },
      update: {},
      create: { userId, problemId, nextReviewDate: addDays(now, 1), intervalDays: 1 },
    })
    await tx.activity.create({ data: { userId, problemId, type: 'SOLVED', createdAt: now } })
    return { firstSolve: true, nextReviewDate: schedule.nextReviewDate }
  })
}

/**
 * Bulk-mark problems the user solved *before* using Cheatcode. First reviews
 * are spread over the next two weeks so the user doesn't wake up to 80 reviews.
 */
export async function importPreviouslySolved(userId: string, problemIds: string[], now = new Date()) {
  const unique = [...new Set(problemIds)]
  if (unique.length === 0) return { imported: 0 }

  const [problems, alreadySolved] = await Promise.all([
    prisma.problem.findMany({
      where: { id: { in: unique } },
      select: { id: true },
      orderBy: [{ topic: { orderIndex: 'asc' } }, { orderIndex: 'asc' }],
    }),
    prisma.userProgress.findMany({
      where: { userId, problemId: { in: unique }, status: 'SOLVED' },
      select: { problemId: true },
    }),
  ])
  const skip = new Set(alreadySolved.map((row) => row.problemId))
  const toImport = problems.filter((problem) => !skip.has(problem.id))
  // Consecutive days from a pseudo-random start, so importing one problem at a
  // time (Roadmap) spreads out just like importing a whole topic does.
  const start = toImport.length ? hash(userId + toImport[0].id) % SPREAD_DAYS : 0

  await prisma.$transaction(
    toImport.flatMap((problem, index) => [
      prisma.userProgress.upsert({
        where: { userId_problemId: { userId, problemId: problem.id } },
        update: { status: 'SOLVED', solvedAt: now, autoImported: true },
        create: { userId, problemId: problem.id, status: 'SOLVED', solvedAt: now, autoImported: true },
      }),
      prisma.revisionSchedule.upsert({
        where: { userId_problemId: { userId, problemId: problem.id } },
        update: {},
        create: { userId, problemId: problem.id, nextReviewDate: addDays(now, 1 + ((start + index) % SPREAD_DAYS)), intervalDays: 1 },
      }),
    ]),
  )
  return { imported: toImport.length }
}

export async function skipProblem(userId: string, problemId: string) {
  await assertProblemExists(problemId)
  const existing = await prisma.userProgress.findUnique({ where: { userId_problemId: { userId, problemId } } })
  if (existing?.status === 'SOLVED') return { skipped: false }
  await prisma.userProgress.upsert({
    where: { userId_problemId: { userId, problemId } },
    update: { status: 'SKIPPED' },
    create: { userId, problemId, status: 'SKIPPED' },
  })
  return { skipped: true }
}

/** Undo: back to "not started". Notes are kept; activity history is kept. */
export async function resetProblem(userId: string, problemId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.revisionSchedule.deleteMany({ where: { userId, problemId } })
    const progress = await tx.userProgress.findUnique({ where: { userId_problemId: { userId, problemId } } })
    if (!progress) return
    if (progress.notes) {
      await tx.userProgress.update({
        where: { id: progress.id },
        data: { status: 'ATTEMPTED', solvedAt: null, autoImported: false },
      })
    } else {
      await tx.userProgress.delete({ where: { id: progress.id } })
    }
  })
}

export async function saveNotes(userId: string, problemId: string, notes: string | null) {
  await assertProblemExists(problemId)
  const progress = await prisma.userProgress.upsert({
    where: { userId_problemId: { userId, problemId } },
    update: { notes },
    create: { userId, problemId, status: 'ATTEMPTED', notes },
  })
  return { notes: progress.notes }
}
