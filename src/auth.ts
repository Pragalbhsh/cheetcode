import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from './prisma.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET ?? 'supersecret'

// REGISTER
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  })

  if (existing) {
    return res.status(400).json({ error: 'Email or username already taken' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, username, passwordHash }
  })

  const token = jwt.sign({ userId: user.id }, JWT_SECRET)

  res.json({ token, userId: user.id, username: user.username })
})

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)

  if (!valid) {
    return res.status(400).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET)

  res.json({ token, userId: user.id, username: user.username })
})

export default router