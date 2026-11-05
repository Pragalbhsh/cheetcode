import type { ErrorRequestHandler, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import { config } from './config.js'
import { HttpError, unauthorized } from './lib/http.js'
import { resolveTimeZone } from './lib/time.js'
import prisma from './prisma.js'

export const timeZone: RequestHandler = (req, _res, next) => {
  req.timeZone = resolveTimeZone(req.get('x-timezone'))
  next()
}

/** Verifies the Bearer token and sets req.userId. The user id is never trusted from the request body. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) throw unauthorized('Please log in to continue')

  let userId: unknown
  try {
    userId = (jwt.verify(token, config.jwtSecret) as jwt.JwtPayload).userId
  } catch {
    throw unauthorized('Your session has expired. Please log in again')
  }
  if (typeof userId !== 'string') throw unauthorized()

  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!exists) throw unauthorized('Account not found. Please log in again')

  req.userId = userId
  next()
}

/** Tiny in-memory rate limiter: good enough for a single instance (e.g. Render free tier). */
export function rateLimit({ windowMs, max, message }: { windowMs: number; max: number; message: string }): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return (req, res, next) => {
    const now = Date.now()
    if (hits.size > 10_000) {
      for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key)
    }
    const key = req.ip ?? 'unknown'
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }
    entry.count++
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
      throw new HttpError(429, message)
    }
    next()
  }
}

export const notFoundHandler: RequestHandler = (req) => {
  throw new HttpError(404, `No route for ${req.method} ${req.path}`)
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  // Malformed JSON body
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Request body is not valid JSON' })
    return
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body is too large' })
    return
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Not found' })
      return
    }
    if (err.code === 'P2003') {
      res.status(400).json({ error: 'Referenced item does not exist' })
      return
    }
  }
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
}
