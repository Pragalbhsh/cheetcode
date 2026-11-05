import { clearSession, getToken } from './auth'

// Set VITE_API_URL in .env (see .env.example) to point at your backend.
export const API_URL = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3000' : 'https://cheetcode-api.onrender.com')
).replace(/\/$/, '')

const timeZone = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
})()

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export async function api<T>(path: string, options: { method?: Method; body?: unknown } = {}): Promise<T> {
  const token = getToken()
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Timezone': timeZone,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError("Can't reach the server. Check your internet connection and try again.", 0)
  }

  const data = (await response.json().catch(() => null)) as (T & { error?: string }) | null

  if (response.status === 401 && token) {
    // Token expired or account gone: back to login, remembering where we were.
    clearSession()
    const next = encodeURIComponent(window.location.pathname)
    window.location.assign(`/login?expired=1&next=${next}`)
  }

  if (!response.ok) {
    throw new ApiError(data?.error ?? `Something went wrong (error ${response.status}).`, response.status)
  }
  return data as T
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
