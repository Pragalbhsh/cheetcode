import prisma from '../prisma.js'
import { HttpError, badRequest } from '../lib/http.js'
import { addDays } from '../lib/sm2.js'

// LeetCode's public GraphQL API exposes a user's most recent accepted
// submissions (up to 20) without logging in. That is enough to keep
// Cheatcode in sync day-to-day: solve on LeetCode, it shows up here.

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql'
export const LEETCODE_USERNAME_PATTERN = /^[A-Za-z0-9_.-]{1,40}$/

const QUERY = `
  query cheatcodeSync($username: String!, $limit: Int!) {
    matchedUser(username: $username) { username }
    recentAcSubmissionList(username: $username, limit: $limit) { title titleSlug timestamp }
  }
`

export interface AcceptedSubmission {
  title: string
  titleSlug: string
  timestamp: number
}

type FetchLike = typeof fetch

export async function fetchRecentAccepted(username: string, fetchImpl: FetchLike = fetch): Promise<AcceptedSubmission[]> {
  let response: Response
  try {
    response = await fetchImpl(LEETCODE_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: `https://leetcode.com/u/${encodeURIComponent(username)}/`,
        'User-Agent': 'Mozilla/5.0 (compatible; CheatcodeSync/1.0)',
      },
      body: JSON.stringify({ query: QUERY, variables: { username, limit: 20 } }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new HttpError(502, "Couldn't reach LeetCode right now. Try again in a bit.")
  }
  if (!response.ok) throw new HttpError(502, `LeetCode didn't respond properly (status ${response.status}). Try again later.`)

  const json = (await response.json().catch(() => null)) as {
    data?: { matchedUser: { username: string } | null; recentAcSubmissionList: unknown[] | null }
    errors?: { message: string }[]
  } | null

  if (!json?.data?.matchedUser) throw new HttpError(404, `LeetCode user "${username}" was not found`)

  const list = Array.isArray(json.data.recentAcSubmissionList) ? json.data.recentAcSubmissionList : []
  return list
    .map((item) => item as Record<string, unknown>)
    .filter((item) => typeof item.titleSlug === 'string')
    .map((item) => ({
      title: String(item.title ?? item.titleSlug),
      titleSlug: String(item.titleSlug),
      timestamp: Number(item.timestamp) * 1000,
    }))
    .filter((item) => Number.isFinite(item.timestamp))
}

/**
 * Imports recent LeetCode accepted submissions that match NeetCode 150
 * problems: they become "solved" (with the real solve time, so they count
 * toward your streak) and enter the revision schedule.
 */
export async function syncLeetCode(userId: string, options: { fetchImpl?: FetchLike; now?: Date } = {}) {
  const now = options.now ?? new Date()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new HttpError(404, 'User not found')
  if (!user.leetcodeUsername) throw badRequest('Add your LeetCode username in Settings first')

  await prisma.user.update({ where: { id: userId }, data: { lastSyncedAt: now } })
  const submissions = await fetchRecentAccepted(user.leetcodeUsername, options.fetchImpl)

  // Keep the most recent accepted submission per problem.
  const latest = new Map<string, AcceptedSubmission>()
  for (const submission of submissions) {
    const previous = latest.get(submission.titleSlug)
    if (!previous || previous.timestamp < submission.timestamp) latest.set(submission.titleSlug, submission)
  }

  const problems = await prisma.problem.findMany({
    where: { leetcodeSlug: { in: [...latest.keys()] } },
    select: { id: true, title: true, leetcodeSlug: true, userProgress: { where: { userId }, select: { status: true } } },
  })

  const imported: { id: string; title: string }[] = []
  for (const problem of problems) {
    if (problem.userProgress[0]?.status === 'SOLVED') continue
    const submission = latest.get(problem.leetcodeSlug!)!
    const solvedAt = new Date(Math.min(submission.timestamp, now.getTime()))
    await prisma.$transaction([
      prisma.userProgress.upsert({
        where: { userId_problemId: { userId, problemId: problem.id } },
        update: { status: 'SOLVED', solvedAt, autoImported: true },
        create: { userId, problemId: problem.id, status: 'SOLVED', solvedAt, autoImported: true },
      }),
      prisma.revisionSchedule.upsert({
        where: { userId_problemId: { userId, problemId: problem.id } },
        update: {},
        create: { userId, problemId: problem.id, nextReviewDate: addDays(solvedAt, 1), intervalDays: 1 },
      }),
      prisma.activity.create({ data: { userId, problemId: problem.id, type: 'SOLVED', createdAt: solvedAt } }),
    ])
    imported.push({ id: problem.id, title: problem.title })
  }

  return { checked: submissions.length, matched: problems.length, imported, syncedAt: now }
}

const AUTO_SYNC_EVERY_MS = 6 * 60 * 60 * 1000

/** Fire-and-forget background sync, at most every 6 hours per user. */
export function maybeAutoSync(user: { id: string; leetcodeUsername: string | null; lastSyncedAt: Date | null }) {
  if (!user.leetcodeUsername) return
  if (user.lastSyncedAt && Date.now() - user.lastSyncedAt.getTime() < AUTO_SYNC_EVERY_MS) return
  syncLeetCode(user.id).catch((error) => {
    console.warn(`LeetCode auto-sync failed for ${user.id}: ${error instanceof Error ? error.message : error}`)
  })
}
