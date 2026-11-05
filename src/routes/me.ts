import { Router } from 'express'
import bcrypt from 'bcrypt'
import type { Prisma } from '@prisma/client'
import { HttpError, badRequest, optionalString, requireUserId } from '../lib/http.js'
import prisma from '../prisma.js'
import { LEETCODE_USERNAME_PATTERN, syncLeetCode } from '../services/leetcode.js'
import { publicUser, validatePassword } from './auth.js'

const router = Router()

router.get('/', async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: requireUserId(req) },
    include: { currentTopic: true },
  })
  res.json({
    ...publicUser(user),
    currentTopic: user.currentTopic ? { id: user.currentTopic.id, name: user.currentTopic.name } : null,
  })
})

router.patch('/', async (req, res) => {
  const userId = requireUserId(req)
  const body = req.body ?? {}
  const data: Prisma.UserUncheckedUpdateInput = {}

  if (body.currentTopicId !== undefined) {
    if (typeof body.currentTopicId !== 'string') throw badRequest('currentTopicId must be a topic id')
    const topic = await prisma.topic.findUnique({ where: { id: body.currentTopicId }, select: { id: true } })
    if (!topic) throw badRequest('That topic does not exist')
    data.currentTopicId = topic.id
  }

  if (body.streakProtector !== undefined) {
    if (typeof body.streakProtector !== 'boolean') throw badRequest('streakProtector must be true or false')
    data.streakProtector = body.streakProtector
  }

  const leetcodeUsername = optionalString(body.leetcodeUsername, 'LeetCode username', 40)
  if (leetcodeUsername !== undefined) {
    if (leetcodeUsername !== null && !LEETCODE_USERNAME_PATTERN.test(leetcodeUsername)) {
      throw badRequest('That does not look like a LeetCode username')
    }
    data.leetcodeUsername = leetcodeUsername
    data.lastSyncedAt = null
  }

  const user = await prisma.user.update({ where: { id: userId }, data })
  res.json(publicUser(user))
})

router.post('/password', async (req, res) => {
  const userId = requireUserId(req)
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const current = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
  if (!(await bcrypt.compare(current, user.passwordHash))) throw badRequest('Current password is incorrect')
  const next = validatePassword(req.body?.newPassword)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(next, 10) } })
  res.json({ message: 'Password updated' })
})

router.delete('/', async (req, res) => {
  const userId = requireUserId(req)
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!(await bcrypt.compare(password, user.passwordHash))) throw badRequest('Password is incorrect')
  await prisma.user.delete({ where: { id: userId } })
  res.json({ message: 'Account deleted' })
})

router.post('/sync/leetcode', async (req, res) => {
  const userId = requireUserId(req)
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { lastSyncedAt: true } })
  if (user.lastSyncedAt && Date.now() - user.lastSyncedAt.getTime() < 30_000) {
    throw new HttpError(429, 'Just synced. Give it 30 seconds before syncing again.')
  }
  res.json(await syncLeetCode(userId))
})

export default router
