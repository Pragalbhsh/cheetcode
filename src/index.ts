import express from 'express'
import { getDailySession } from './daily.js'

const app = express()
const PORT = 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Cheatcode API is live' })
})

app.get('/daily/:userId', async (req, res) => {
  const { userId } = req.params
  const session = await getDailySession(userId)
  res.json(session)
})


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
}) 