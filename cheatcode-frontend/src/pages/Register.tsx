import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PasswordInput } from '../components/PasswordInput'
import { Button, Field, inputClass } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { saveSession } from '../lib/auth'
import type { AuthResponse } from '../lib/types'
import { AuthShell } from './AuthShell'

function validate(username: string, email: string, password: string): string | null {
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return 'Username must be 3–20 characters: letters, numbers or underscores.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  return null
}

function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const problem = validate(username.trim(), email.trim(), password)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setLoading(true)
    try {
      const session = await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { username: username.trim(), email: email.trim(), password },
      })
      saveSession(session)
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create your account 🚀" subtitle="Free forever. Takes 20 seconds.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Username" hint="3–20 letters, numbers or underscores">
          <input
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
            placeholder="ada_codes"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <PasswordInput
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" loading={loading} className="mt-1">
          Create account
        </Button>
        <p className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-300 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default Register
