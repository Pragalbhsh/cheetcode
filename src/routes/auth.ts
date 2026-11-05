import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Prisma, type User } from '@prisma/client'
import { config } from '../config.js'
import { HttpError, badRequest } from '../lib/http.js'
import { rateLimit } from '../middleware.js'
import prisma from '../prisma.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many attempts. Please wait a few minutes and try again.',
})

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/
export const MIN_PASSWORD_LENGTH = 8
// Used so that "unknown email" and "wrong password" take the same time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10)

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    leetcodeUsername: user.leetcodeUsername,
    streakProtector: user.streakProtector,
    currentTopicId: user.currentTopicId,
    lastSyncedAt: user.lastSyncedAt,
    createdAt: user.createdAt,
  }
}

function sessionFor(user: User) {
  const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
  // userId/username kept at the top level for older clients.
  return { token, userId: user.id, username: user.username, user: publicUser(user) }
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw badRequest(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
  if (password.length > 72) throw badRequest('Password must be at most 72 characters')
  return password
}

router.post('/register', authLimiter, async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const username = String(req.body?.username ?? '').trim()

  if (!email || !username || !req.body?.password) throw badRequest('Email, username and password are required')
  if (!EMAIL_PATTERN.test(email) || email.length > 254) throw badRequest('Please enter a valid email address')
  if (!USERNAME_PATTERN.test(username)) {
    throw badRequest('Username must be 3–20 characters: letters, numbers or underscores')
  }
  const password = validatePassword(req.body.password)

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        { username: { equals: username, mode: 'insensitive' } },
      ],
    },
    select: { email: true },
  })
  if (existing) {
    throw new HttpError(
      409,
      existing.email.toLowerCase() === email ? 'An account with this email already exists' : 'That username is taken',
    )
  }

  try {
    const user = await prisma.user.create({
      data: { email, username, passwordHash: await bcrypt.hash(password, 10) },
    })
    res.status(201).json(sessionFor(user))
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'Email or username already taken')
    }
    throw error
  }
})

router.post('/login', authLimiter, async (req, res) => {
  // `email` is accepted for older clients; it may contain a username too.
  const identifier = String(req.body?.identifier ?? req.body?.email ?? '').trim()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!identifier || !password) throw badRequest('Enter your email (or username) and password')

  const field = identifier.includes('@') ? 'email' : 'username'
  const user =
    (await prisma.user.findFirst({ where: { [field]: identifier } })) ??
    (await prisma.user.findFirst({ where: { [field]: { equals: identifier, mode: 'insensitive' } } }))

  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !valid) throw badRequest('Incorrect email/username or password')

  res.json(sessionFor(user))
})

export default router
