import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SyncIcon } from '../components/icons'
import { PasswordInput } from '../components/PasswordInput'
import { useToast } from '../components/toast-context'
import { Button, Card, ErrorState, Field, PageLoader, Toggle, inputClass } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import { api, errorMessage } from '../lib/api'
import { clearSession } from '../lib/auth'
import { formatDate, plural } from '../lib/format'
import type { SyncResult, Topic, User } from '../lib/types'

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  )
}

function LeetCodeSection({ user, onUpdated }: { user: User; onUpdated: (user: User) => void }) {
  const toast = useToast()
  const [username, setUsername] = useState(user.leetcodeUsername ?? '')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const updated = await api<User>('/me', { method: 'PATCH', body: { leetcodeUsername: username.trim() || null } })
      onUpdated(updated)
      toast.show(updated.leetcodeUsername ? 'LeetCode username saved' : 'LeetCode disconnected')
    } catch (error) {
      toast.show(errorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const sync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const synced = await api<SyncResult>('/me/sync/leetcode', { method: 'POST' })
      setResult(synced)
      onUpdated({ ...user, lastSyncedAt: synced.syncedAt })
      toast.show(
        synced.imported.length
          ? `Imported ${plural(synced.imported.length, 'problem')} from LeetCode`
          : 'Synced: no new NeetCode 150 problems found',
      )
    } catch (error) {
      toast.show(errorMessage(error), 'error')
    } finally {
      setSyncing(false)
    }
  }

  const dirty = (user.leetcodeUsername ?? '') !== username.trim()

  return (
    <Section
      title="LeetCode sync"
      description="Problems you solve on LeetCode are imported automatically (every few hours, when you open Today). LeetCode only shares your 20 most recent accepted solutions publicly. For older ones, use the Roadmap."
    >
      <form onSubmit={save} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="LeetCode username">
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="your-leetcode-handle"
              autoComplete="off"
              className={inputClass}
            />
          </Field>
        </div>
        <Button type="submit" variant="secondary" loading={saving} disabled={!dirty} className="sm:mb-0.5">
          Save
        </Button>
      </form>
      {user.leetcodeUsername && !dirty && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={sync} loading={syncing}>
            {!syncing && <SyncIcon size={16} />} Sync now
          </Button>
          <span className="text-xs text-zinc-500">
            {user.lastSyncedAt ? `Last synced ${formatDate(user.lastSyncedAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'Not synced yet'}
          </span>
        </div>
      )}
      {result && (
        <div className="mt-4 rounded-xl bg-zinc-800/50 px-4 py-3 text-sm text-zinc-300">
          Checked {plural(result.checked, 'recent solve')}, {result.matched} in the NeetCode 150.
          {result.imported.length > 0 && <> New: {result.imported.map((p) => p.title).join(', ')}.</>}
        </div>
      )}
    </Section>
  )
}

function PasswordSection() {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (next.length < 8) {
      toast.show('New password must be at least 8 characters', 'error')
      return
    }
    setSaving(true)
    try {
      await api('/me/password', { method: 'POST', body: { currentPassword: current, newPassword: next } })
      toast.show('Password updated')
      setCurrent('')
      setNext('')
    } catch (error) {
      toast.show(errorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title="Change password">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Current password">
          <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </Field>
        <Field label="New password" hint="At least 8 characters">
          <PasswordInput value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
        </Field>
        <div>
          <Button type="submit" variant="secondary" loading={saving}>
            Update password
          </Button>
        </div>
      </form>
    </Section>
  )
}

function DangerZone() {
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)

  const remove = async (event: FormEvent) => {
    event.preventDefault()
    setDeleting(true)
    try {
      await api('/me', { method: 'DELETE', body: { password } })
      clearSession()
      navigate('/', { replace: true })
    } catch (error) {
      toast.show(errorMessage(error), 'error')
      setDeleting(false)
    }
  }

  return (
    <Card className="border-rose-500/20">
      <h2 className="font-semibold text-rose-200">Delete account</h2>
      <p className="mt-1 text-sm text-zinc-400">Permanently deletes your account, progress, notes and history.</p>
      {!open ? (
        <Button variant="ghost" className="mt-4 text-rose-300!" onClick={() => setOpen(true)}>
          Delete my account…
        </Button>
      ) : (
        <form onSubmit={remove} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Confirm with your password">
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
          </div>
          <Button type="submit" variant="danger" loading={deleting}>
            Delete forever
          </Button>
        </form>
      )}
    </Card>
  )
}

function Settings() {
  const toast = useToast()
  const { data: user, error, retry, mutate } = useApiData<User>('/me')
  const { data: topics } = useApiData<Topic[]>('/topics')
  const [savingStreak, setSavingStreak] = useState(false)

  if (error && !user) return <ErrorState message={error} onRetry={retry} />
  if (!user) return <PageLoader label="Loading settings…" />

  const update = (next: Partial<User>) => mutate((current) => ({ ...current, ...next }))

  const toggleStreak = async (value: boolean) => {
    setSavingStreak(true)
    update({ streakProtector: value })
    try {
      await api('/me', { method: 'PATCH', body: { streakProtector: value } })
      toast.show(value ? 'Streak protector on: a quick Easy will appear on Today' : 'Streak protector off')
    } catch (err) {
      update({ streakProtector: !value })
      toast.show(errorMessage(err), 'error')
    } finally {
      setSavingStreak(false)
    }
  }

  const changeTopic = async (topicId: string) => {
    const previous = user.currentTopicId
    update({ currentTopicId: topicId })
    try {
      await api('/me', { method: 'PATCH', body: { currentTopicId: topicId } })
      toast.show(`New problems will come from ${topics?.find((t) => t.id === topicId)?.name ?? 'that topic'}`)
    } catch (err) {
      update({ currentTopicId: previous })
      toast.show(errorMessage(err), 'error')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-zinc-400">
          @{user.username} · {user.email} · joined {formatDate(user.createdAt, { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <Section title="Daily session">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">🛡️ Streak protector</p>
              <p className="mt-1 text-sm text-zinc-400">
                Adds one quick Easy problem to each day: a fast win for busy days that keeps your streak alive.
              </p>
            </div>
            <Toggle checked={user.streakProtector} onChange={toggleStreak} disabled={savingStreak} label="Streak protector" />
          </div>
          <Field label="Current topic" hint="New problems come from this topic. When you finish it you move on automatically.">
            <select
              value={user.currentTopicId ?? ''}
              onChange={(event) => changeTopic(event.target.value)}
              className={inputClass}
              disabled={!topics}
            >
              {!user.currentTopicId && <option value="">Choose a topic…</option>}
              {topics?.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.orderIndex}. {topic.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <LeetCodeSection user={user} onUpdated={(next) => mutate(() => next)} />
      <PasswordSection />
      <DangerZone />
    </div>
  )
}

export default Settings
