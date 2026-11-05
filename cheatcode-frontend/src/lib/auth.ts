import type { AuthResponse } from './types'

const TOKEN_KEY = 'token'
const USERNAME_KEY = 'username'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function isLoggedIn(): boolean {
  return Boolean(getToken())
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY)
}

export function saveSession(session: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, session.token)
  localStorage.setItem(USERNAME_KEY, session.user.username)
  // Left over from the first version, which trusted a userId from the browser.
  localStorage.removeItem('userId')
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem('userId')
}
