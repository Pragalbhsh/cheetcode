import cors from 'cors'
import express from 'express'
import authRouter from './auth.js'
import { getDailySession } from './daily.js'
import prisma from './prisma.js'
import { calculateNextReview } from './sm2.js'

const app = express()
const PORT = 3000

app.use(express.json())
app.use(cors())

app.use('/auth', authRouter)

app.get('/', (req, res) => {
  res.json({ message: 'Cheatcode API is live' })
})

app.get('/daily/:userId', async (req, res) => {
  const { userId } = req.params
  const session = await getDailySession(userId)
  res.json(session)
})

app.post('/user/topic', async (req, res) => {
  const { userId, topicId } = req.body

  const user = await prisma.user.update({
    where: { id: userId },
    data: { currentTopicId: topicId }
  })

  res.json({ message: 'Topic updated', currentTopicId: user.currentTopicId })
})

app.get('/topics', async (req, res) => {
  const topics = await prisma.topic.findMany({
    orderBy: { orderIndex: 'asc' }
  })
  res.json(topics)
})

app.post('/revision/rate', async (req, res) => {
  const { userId, problemId, rating } = req.body

  // get current schedule for this problem
  const schedule = await prisma.revisionSchedule.findUnique({
    where: { userId_problemId: { userId, problemId } }
  })

  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' })
  }

  // run SM-2
  const result = calculateNextReview({
    rating,
    repetitions: schedule.repetitions,
    easeFactor: schedule.easeFactor,
    intervalDays: schedule.intervalDays
  })

  // update schedule in database
  const updated = await prisma.revisionSchedule.update({
    where: { userId_problemId: { userId, problemId } },
    data: {
      nextReviewDate: result.nextReviewDate,
      intervalDays: result.intervalDays,
      easeFactor: result.easeFactor,
      repetitions: result.repetitions,
      lastRating: rating
    }
  })

  res.json({ message: 'Schedule updated', nextReviewDate: updated.nextReviewDate })
})

app.post('/problem/solve', async (req, res) => {
  const { userId, problemId } = req.body

  // mark problem as solved in user_progress
  await prisma.userProgress.upsert({
    where: { userId_problemId: { userId, problemId } },
    update: { status: 'SOLVED', solvedAt: new Date() },
    create: { userId, problemId, status: 'SOLVED', solvedAt: new Date() }
  })

  // create revision schedule entry for SM-2
  await prisma.revisionSchedule.upsert({
    where: { userId_problemId: { userId, problemId } },
    update: {},
    create: { userId, problemId }
  })

  res.json({ message: 'Problem marked as solved, revision scheduled' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})