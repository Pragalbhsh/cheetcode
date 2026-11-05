import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PasswordInput } from '../components/PasswordInput'
import { Button, Field, inputClass } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { saveSession } from '../lib/auth'
import type { AuthResponse } from '../lib/types'
import { AuthShell } from './AuthShell'

function safeNext(value: string | null) {
  // Only allow in-app paths (no open redirects).
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/daily'
}

function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { identifier: identifier.trim(), password },
      })
      saveSession(session)
      navigate(safeNext(params.get('next')), { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back 👋" subtitle="Log in to continue your streak">
      {params.get('expired') && (
        <p className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Your session expired. Please log in again.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email or username">
          <input
            autoFocus
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" loading={loading} className="mt-1">
          Log in
        </Button>
        <p className="text-center text-sm text-zinc-400">
          New here?{' '}
          <Link to="/register" className="font-medium text-indigo-300 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default Login
