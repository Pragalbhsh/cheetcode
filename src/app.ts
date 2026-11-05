import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { requireUserId } from './lib/http.js'
import { errorHandler, notFoundHandler, requireAuth, timeZone } from './middleware.js'
import prisma from './prisma.js'
import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'
import problemsRouter from './routes/problems.js'
import revisionRouter from './routes/revision.js'
import statsRouter from './routes/stats.js'
import { getDailySession } from './services/daily.js'
import { maybeAutoSync } from './services/leetcode.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  // Render / Vercel / Railway sit behind one proxy: needed for correct client IPs (rate limiting).
  app.set('trust proxy', 1)

  app.use(
    cors({
      origin: config.corsOrigins.length
        ? (origin, callback) => callback(null, !origin || config.corsOrigins.includes(origin))
        : true,
    }),
  )
  app.use(express.json({ limit: '100kb' }))
  app.use(timeZone)

  app.get('/', (_req, res) => {
    res.json({ message: 'Cheatcode API is live' })
  })

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      res.json({ ok: true })
    } catch {
      res.status(503).json({ ok: false, error: 'Database unreachable' })
    }
  })

  app.get('/topics', async (_req, res) => {
    const topics = await prisma.topic.findMany({
      orderBy: { orderIndex: 'asc' },
      include: { _count: { select: { problems: true } } },
    })
    res.json(topics.map(({ _count, ...topic }) => ({ ...topic, problemCount: _count.problems })))
  })

  app.use('/auth', authRouter)
  app.use('/me', requireAuth, meRouter)
  app.use('/problems', requireAuth, problemsRouter)
  app.use('/revision', requireAuth, revisionRouter)
  app.use('/stats', requireAuth, statsRouter)

  app.get('/daily', requireAuth, async (req, res) => {
    const userId = requireUserId(req)
    res.json(await getDailySession(userId, req.timeZone))

    // After responding: quietly pull in recent LeetCode solves (at most every 6h).
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, leetcodeUsername: true, lastSyncedAt: true },
      })
      if (user) maybeAutoSync(user)
    } catch (error) {
      console.warn('Auto-sync check failed', error)
    }
  })

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
