import 'dotenv/config'

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER)

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (secret) return secret
  if (isProduction) {
    // Refuse to boot instead of silently signing tokens with a public, guessable secret.
    throw new Error(
      'JWT_SECRET is not set. Add a long random JWT_SECRET environment variable before starting the server.',
    )
  }
  console.warn('⚠️  JWT_SECRET is not set: using an insecure development secret. Never do this in production.')
  return 'dev-only-insecure-secret'
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  isProduction,
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: '30d' as const,
  corsOrigins: (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
}
