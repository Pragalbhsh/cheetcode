import type { Request } from 'express'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export const badRequest = (message: string) => new HttpError(400, message)
export const unauthorized = (message = 'Please log in again') => new HttpError(401, message)
export const notFound = (message = 'Not found') => new HttpError(404, message)

export function requireUserId(req: Request): string {
  if (!req.userId) throw unauthorized()
  return req.userId
}

export function requireParam(req: Request, name: string): string {
  const value = req.params[name]
  if (typeof value !== 'string' || value.length === 0 || value.length > 100) throw badRequest(`Invalid ${name}`)
  return value
}

export function optionalString(value: unknown, field: string, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') throw badRequest(`${field} must be text`)
  const trimmed = value.trim()
  if (trimmed.length > maxLength) throw badRequest(`${field} must be at most ${maxLength} characters`)
  return trimmed.length === 0 ? null : trimmed
}
