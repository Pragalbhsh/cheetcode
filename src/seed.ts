import fs from 'node:fs'
import path from 'node:path'
import prisma from './prisma.js'

// Problem data is bundled in prisma/data/neetcode150.json (snapshot of
// https://github.com/neetcode-gh/leetcode .problemSiteData.json), so seeding
// works offline and doesn't break if the upstream file changes shape.
const DATA_FILE = path.resolve(__dirname, '..', 'prisma', 'data', 'neetcode150.json')

interface SeedProblem {
  title: string
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  leetcodeSlug: string
  videoId: string | null
  freeLink: string | null
  premium: boolean
  blind75: boolean
}

interface SeedData {
  topics: string[]
  problems: SeedProblem[]
}

function loadData(): SeedData {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as SeedData
}

/** Idempotent: creates missing topics/problems and refreshes problem metadata. */
export async function seedProblems(log: (message: string) => void = console.log) {
  const data = loadData()

  const topicIds = new Map<string, string>()
  for (const [index, name] of data.topics.entries()) {
    const topic = await prisma.topic.upsert({
      where: { name },
      update: {},
      create: { name, orderIndex: index + 1 },
    })
    topicIds.set(name, topic.id)
  }
  log(`Topics ready: ${topicIds.size}`)

  const counters = new Map<string, number>()
  const upserts = data.problems.map((problem) => {
    const topicId = topicIds.get(problem.topic)
    if (!topicId) throw new Error(`Unknown topic "${problem.topic}" for "${problem.title}"`)
    const orderIndex = (counters.get(topicId) ?? 0) + 1
    counters.set(topicId, orderIndex)

    const details = {
      difficulty: problem.difficulty,
      leetcodeSlug: problem.leetcodeSlug,
      videoId: problem.videoId,
      freeLink: problem.freeLink,
      premium: problem.premium,
      blind75: problem.blind75,
      orderIndex,
    }
    return prisma.problem.upsert({
      where: { title_topicId: { title: problem.title, topicId } },
      update: details,
      create: { ...details, title: problem.title, topicId, platform: 'LEETCODE', sheet: 'NEETCODE_150' },
    })
  })
  await prisma.$transaction(upserts)
  log(`Problems ready: ${upserts.length}`)
}

/** Called on server start: seeds an empty database or enriches one seeded by an older version. */
export async function ensureSeeded() {
  const expected = loadData().problems.length
  const complete = await prisma.problem.count({ where: { videoId: { not: null } } })
  if (complete >= expected) return
  console.log('Seeding NeetCode 150 problem data…')
  await seedProblems()
}

if (require.main === module) {
  seedProblems()
    .then(() => console.log('Done seeding!'))
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}
