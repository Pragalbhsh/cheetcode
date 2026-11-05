import { useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CheckIcon, FlameIcon, ShieldIcon } from '../components/icons'
import { NotesEditor } from '../components/NotesEditor'
import { ProblemLinks } from '../components/ProblemLinks'
import { RatingButtons } from '../components/RatingButtons'
import { useToast } from '../components/toast-context'
import { Button, Card, DifficultyBadge, ErrorState, Meter, PageLoader, Tag } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import { api, errorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import { formatDate, greeting, plural, relativeDays } from '../lib/format'
import type { DailySession, Problem, Rating } from '../lib/types'

type Session = Extract<DailySession, { needsOnboarding: false }>

function SectionLabel({ children, tone }: { children: ReactNode; tone: 'indigo' | 'violet' | 'orange' }) {
  const tones = {
    indigo: 'bg-indigo-500/15 text-indigo-300',
    violet: 'bg-violet-500/15 text-violet-300',
    orange: 'bg-orange-500/15 text-orange-300',
  }
  return <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{children}</span>
}

function ProblemHeading({ problem }: { problem: Problem }) {
  return (
    <div className="mt-4 mb-3">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{problem.title}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
        {problem.blind75 && <Tag tone="sky">Blind 75</Tag>}
        {problem.premium && <Tag>LeetCode Premium</Tag>}
      </div>
    </div>
  )
}

function GoalChip({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm',
        done ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-zinc-700 text-zinc-400',
      )}
    >
      <span
        className={cx(
          'flex h-4 w-4 items-center justify-center rounded-full',
          done ? 'bg-emerald-500 text-zinc-950' : 'border border-zinc-600',
        )}
      >
        {done && <CheckIcon size={11} strokeWidth={3} />}
      </span>
      {children}
    </span>
  )
}

function RevisionCard({ session, onRated }: { session: Session; onRated: () => void }) {
  const toast = useToast()
  const { revision } = session

  if (!revision) {
    return (
      <Card>
        <SectionLabel tone="indigo">Revision</SectionLabel>
        {session.today.reviewed > 0 ? (
          <p className="mt-4 text-lg font-semibold">All caught up: {plural(session.today.reviewed, 'review')} done today ✨</p>
        ) : (
          <p className="mt-4 text-lg font-semibold">Nothing to revise today 🎉</p>
        )}
        <p className="mt-1 text-sm text-zinc-400">
          {session.nextReviewDate
            ? `Your next review is due ${formatDate(session.nextReviewDate, { weekday: 'long', month: 'short', day: 'numeric' })}.`
            : 'Problems you solve come back here for review, right before you would forget them.'}
        </p>
      </Card>
    )
  }

  const { problem } = revision
  const rate = async (rating: Rating) => {
    try {
      const result = await api<{ dueInDays: number }>(`/revision/${problem.id}/rate`, {
        method: 'POST',
        body: { rating },
      })
      toast.show(
        rating === 'FORGOT'
          ? "No worries, that's how learning works. It'll be back tomorrow."
          : `Nice! ${problem.title} comes back ${relativeDays(result.dueInDays)}.`,
      )
      onRated()
    } catch (error) {
      toast.show(errorMessage(error), 'error')
    }
  }

  return (
    <Card className="border-indigo-500/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel tone="indigo">Revision</SectionLabel>
        <span className="text-sm text-zinc-400">
          {session.dueCount > 1 ? `${session.dueCount} due · most overdue first` : '1 due'}
        </span>
      </div>
      <ProblemHeading problem={problem} />
      <p className="mb-3 text-sm text-zinc-400">
        {revision.repetitions === 0
          ? 'First review since you solved it.'
          : `Reviewed ${plural(revision.repetitions, 'time')} · last interval ${plural(revision.intervalDays, 'day')}`}
        {revision.overdueDays > 0 && <span className="text-amber-300"> · {plural(revision.overdueDays, 'day')} overdue</span>}
      </p>
      <ProblemLinks problem={problem} />
      <div className="my-5">
        <NotesEditor key={problem.id} problemId={problem.id} initial={problem.notes} />
      </div>
      <RatingButtons previews={revision.previews} onRate={rate} />
    </Card>
  )
}

function NewProblemCard({ session, onChanged }: { session: Session; onChanged: () => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState<'solve' | 'skip' | null>(null)
  const [justSolved, setJustSolved] = useState<Problem | null>(null)
  const { newProblem: problem, topic } = session

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <SectionLabel tone="violet">New · {topic.name}</SectionLabel>
      <div className="flex min-w-36 items-center gap-2 text-xs text-zinc-400">
        <Meter value={topic.solved} max={topic.total} label={`${topic.name} progress`} thin />
        <span className="whitespace-nowrap">
          {topic.solved}/{topic.total}
        </span>
      </div>
    </div>
  )

  if (justSolved) {
    return (
      <Card className="pop-in border-emerald-500/30">
        {header}
        <p className="mt-5 flex items-center gap-2 text-lg font-semibold text-emerald-300">
          <CheckIcon size={20} /> Solved {justSolved.title}!
        </p>
        <p className="mt-1 mb-4 text-sm text-zinc-400">
          It's in your revision schedule and comes back tomorrow. Write the key insight while it's fresh: future you
          will thank you.
        </p>
        <NotesEditor problemId={justSolved.id} initial={justSolved.notes} defaultOpen onSaved={() => setJustSolved(null)} />
        <Button variant="secondary" className="mt-4" onClick={() => setJustSolved(null)}>
          {problem ? 'Next problem →' : 'Done'}
        </Button>
      </Card>
    )
  }

  if (!problem) {
    return (
      <Card className="text-center">
        <p className="text-4xl">🏆</p>
        <p className="mt-3 text-xl font-bold">You've worked through all {session.totals.total} problems!</p>
        <p className="mt-1 text-sm text-zinc-400">
          Keep up your revisions to stay interview-ready. Skipped problems can be picked up from the Roadmap.
        </p>
      </Card>
    )
  }

  const solve = async () => {
    setBusy('solve')
    try {
      await api(`/problems/${problem.id}/solve`, { method: 'POST' })
      setJustSolved(problem)
      onChanged()
    } catch (error) {
      toast.show(errorMessage(error), 'error')
    } finally {
      setBusy(null)
    }
  }

  const skip = async () => {
    setBusy('skip')
    try {
      await api(`/problems/${problem.id}/skip`, { method: 'POST' })
      toast.show(`Skipped ${problem.title}. You can come back to it from the Roadmap.`, 'info')
      onChanged()
    } catch (error) {
      toast.show(errorMessage(error), 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="border-violet-500/25">
      {header}
      {session.today.solved > 0 && (
        <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          ✓ Today's new problem is done. This one is a bonus if you have time.
        </p>
      )}
      <ProblemHeading problem={problem} />
      <ProblemLinks problem={problem} />
      <div className="my-5">
        <NotesEditor key={problem.id} problemId={problem.id} initial={problem.notes} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="success" size="lg" className="flex-1" onClick={solve} loading={busy === 'solve'} disabled={busy !== null}>
          <CheckIcon size={18} /> I solved it
        </Button>
        <Button variant="secondary" size="lg" onClick={skip} loading={busy === 'skip'} disabled={busy !== null}>
          Skip for now
        </Button>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Give it a real try (20–30 min). Stuck? Watch the explanation, then solve it yourself without looking.
      </p>
    </Card>
  )
}

function StreakProtectorCard({ session, onChanged }: { session: Session; onChanged: () => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const pick = session.streakProtector

  if (!pick) return null
  const { problem, done } = pick

  const markDone = async () => {
    setBusy(true)
    try {
      await api(`/problems/${problem.id}/solve`, { method: 'POST' })
      toast.show('Streak protected 🛡️')
      onChanged()
    } catch (error) {
      toast.show(errorMessage(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className={cx(done && 'opacity-80')}>
      <div className="flex items-center justify-between gap-2">
        <SectionLabel tone="orange">🛡️ Streak protector</SectionLabel>
        {done && (
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-300">
            <CheckIcon size={16} /> Done
          </span>
        )}
      </div>
      <ProblemHeading problem={problem} />
      <p className="mb-3 text-sm text-zinc-400">Busy day? A quick Easy keeps your streak alive.</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProblemLinks problem={problem} compact />
        {!done && (
          <Button variant="secondary" onClick={markDone} loading={busy}>
            <ShieldIcon size={16} /> Mark done
          </Button>
        )}
      </div>
    </Card>
  )
}

function Daily() {
  const { data, error, retry, reload } = useApiData<DailySession>('/daily')
  const [now] = useState(() => new Date())

  if (error && !data) return <ErrorState message={error} onRetry={retry} />
  if (!data) return <PageLoader label="Preparing today's session…" />
  if (data.needsOnboarding) return <Navigate to="/onboarding" replace />

  const session = data
  const revisionDone = session.revision === null
  const newDone = session.today.solved > 0 || session.allTopicsComplete
  const streakDone = !session.streakProtector || session.streakProtector.done
  const allDone = revisionDone && newDone && streakDone

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{formatDate(now, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting(now)}, {session.username}
          </h1>
        </div>
        <div
          className={cx(
            'flex items-center gap-2 rounded-2xl border px-4 py-2',
            session.streak.activeToday ? 'border-orange-400/40 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900',
          )}
          title={`Longest streak: ${plural(session.streak.longest, 'day')}`}
        >
          <FlameIcon size={22} className={session.streak.current > 0 ? 'text-orange-400' : 'text-zinc-600'} />
          <div className="leading-tight">
            <p className="text-lg font-bold">{plural(session.streak.current, 'day')}</p>
            <p className="text-xs text-zinc-400">
              {session.streak.activeToday ? 'streak · done today' : session.streak.current > 0 ? 'streak · do one today!' : 'start a streak today'}
            </p>
          </div>
        </div>
      </div>

      {session.finishedTopic && (
        <div className="pop-in rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
          <p className="font-semibold text-emerald-200">🎉 You finished {session.finishedTopic}!</p>
          <p className="text-sm text-emerald-100/70">On to {session.topic.name}. Those problems stay in your revision schedule.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <GoalChip done={revisionDone}>{session.dueCount > 1 ? `Revise (${session.dueCount} due)` : 'Revise'}</GoalChip>
        <GoalChip done={newDone}>Learn one new</GoalChip>
        {session.streakProtector && <GoalChip done={streakDone}>Quick win</GoalChip>}
      </div>

      {allDone && (
        <div className="pop-in rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/20 to-zinc-900 px-6 py-5">
          <p className="text-lg font-bold">Session complete. See you tomorrow! 🔥</p>
          <p className="mt-1 text-sm text-zinc-300">
            {session.totals.solved} of {session.totals.total} solved so far. Feeling good? There's a bonus problem below.
          </p>
        </div>
      )}

      <RevisionCard session={session} onRated={reload} />
      <NewProblemCard session={session} onChanged={reload} />
      <StreakProtectorCard session={session} onChanged={reload} />

      {session.totals.solved === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-400">
          💡 Already solved some of these before? Tick them in the{' '}
          <Link to="/roadmap" className="text-indigo-300 hover:underline">
            Roadmap
          </Link>{' '}
          or connect LeetCode in{' '}
          <Link to="/settings" className="text-indigo-300 hover:underline">
            Settings
          </Link>{' '}
          so they enter your revision schedule.
        </p>
      )}
      {!session.streakProtector && (
        <p className="text-center text-xs text-zinc-500">
          Want a quick daily Easy to protect your streak?{' '}
          <Link to="/settings" className="text-zinc-400 underline-offset-2 hover:underline">
            Turn on Streak protector
          </Link>
        </p>
      )}
    </div>
  )
}

export default Daily
