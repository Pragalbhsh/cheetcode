import express from 'express'
import authRouter from './auth.js'
import { getDailySession } from './daily.js'
import prisma from './prisma.js'

const app = express()
const PORT = 3000

app.use(express.json())

app.use('/auth', authRouter)

app.get('/', (req, res) => {
  res.json({ message: 'Cheatcode API is live 🔥' })
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})