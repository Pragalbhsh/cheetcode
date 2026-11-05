import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronIcon } from '../components/icons'
import { NotesEditor } from '../components/NotesEditor'
import { ProblemLinks } from '../components/ProblemLinks'
import { RatingButtons } from '../components/RatingButtons'
import { useToast } from '../components/toast-context'
import { Card, DifficultyBadge, ErrorState, PageLoader } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import { api, errorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import { formatDate, plural, relativeDays } from '../lib/format'
import type { QueueItem, Rating, RevisionQueue } from '../lib/types'

function DueItem({ item, open, onToggle, onRated }: { item: QueueItem; open: boolean; onToggle: () => void; onRated: () => void }) {
  const toast = useToast()
  const { problem } = item

  const rate = async (rating: Rating) => {
    try {
      const result = await api<{ dueInDays: number }>(`/revision/${problem.id}/rate`, { method: 'POST', body: { rating } })
      toast.show(`${problem.title} comes back ${relativeDays(result.dueInDays)}.`)
      onRated()
    } catch (error) {
      toast.show(errorMessage(error), 'error')
    }
  }

  return (
    <li className={cx('rounded-2xl border bg-zinc-900 transition', open ? 'border-indigo-500/40' : 'border-zinc-800')}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{problem.title}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {problem.topicName}
            {item.dueInDays < 0 && <span className="text-amber-300"> · {plural(-item.dueInDays, 'day')} overdue</span>}
          </p>
        </div>
        <DifficultyBadge difficulty={problem.difficulty} />
        <ChevronIcon size={18} className={cx('text-zinc-500 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-zinc-800 px-4 pt-4 pb-5 sm:px-5">
          <ProblemLinks problem={problem} />
          <div className="my-4">
            <NotesEditor problemId={problem.id} initial={problem.notes} />
          </div>
          <RatingButtons previews={item.previews} onRate={rate} />
        </div>
      )}
    </li>
  )
}

function groupUpcoming(items: QueueItem[]) {
  const groups = new Map<string, QueueItem[]>()
  for (const item of items) {
    const label =
      item.dueInDays <= 1
        ? 'Tomorrow'
        : item.dueInDays <= 7
          ? formatDate(item.nextReviewDate, { weekday: 'long', month: 'short', day: 'numeric' })
          : item.dueInDays <= 30
            ? 'Later this month'
            : 'Further out'
    groups.set(label, [...(groups.get(label) ?? []), item])
  }
  return [...groups.entries()]
}

function Review() {
  const { data, error, retry, reload, mutate } = useApiData<RevisionQueue>('/revision')
  const [openId, setOpenId] = useState<string | null>(null)
  const [showHow, setShowHow] = useState(false)

  if (error && !data) return <ErrorState message={error} onRetry={retry} />
  if (!data) return <PageLoader label="Loading your review queue…" />

  const activeId = openId ?? data.due[0]?.problem.id ?? null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Review</h1>
        <p className="mt-1 text-zinc-400">
          {data.due.length > 0
            ? `${plural(data.due.length, 'problem')} due today. Re-solve each one, then rate how it went.`
            : data.upcoming.length > 0
              ? "You're all caught up. Come back when the next review is due."
              : 'Problems you solve will show up here for review.'}
        </p>
      </div>

      {data.due.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {data.due.map((item) => (
            <DueItem
              key={item.problem.id}
              item={item}
              open={activeId === item.problem.id}
              onToggle={() => setOpenId(activeId === item.problem.id ? '' : item.problem.id)}
              onRated={() => {
                mutate((queue) => ({ ...queue, due: queue.due.filter((d) => d.problem.id !== item.problem.id) }))
                setOpenId(null)
                reload()
              }}
            />
          ))}
        </ul>
      )}

      {data.due.length === 0 && data.upcoming.length === 0 && (
        <Card className="text-center">
          <p className="text-4xl">🧠</p>
          <p className="mt-3 font-semibold">Your review queue is empty</p>
          <p className="mt-1 text-sm text-zinc-400">
            Solve today's problem or tick problems you already know in the{' '}
            <Link to="/roadmap" className="text-indigo-300 hover:underline">
              Roadmap
            </Link>
            .
          </p>
        </Card>
      )}

      {data.upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Coming up · {data.upcoming.length}
          </h2>
          <div className="flex flex-col gap-4">
            {groupUpcoming(data.upcoming).map(([label, items]) => (
              <div key={label}>
                <p className="mb-1.5 text-sm font-medium text-zinc-300">{label}</p>
                <ul className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                  {items.map((item) => (
                    <li key={item.problem.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                      <span className="min-w-0 flex-1 truncate">{item.problem.title}</span>
                      <span className="hidden text-xs text-zinc-500 sm:inline">{item.problem.topicName}</span>
                      <span className="w-24 text-right text-xs text-zinc-400">{relativeDays(item.dueInDays)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <Card className="text-sm text-zinc-400">
        <button type="button" onClick={() => setShowHow((v) => !v)} className="flex w-full items-center justify-between font-semibold text-zinc-200">
          How does the schedule work?
          <ChevronIcon size={18} className={cx('transition', showHow && 'rotate-180')} />
        </button>
        {showHow && (
          <div className="mt-3 space-y-2 leading-relaxed">
            <p>
              Cheatcode uses spaced repetition (SM-2, the algorithm behind Anki). Each time you rate a problem it
              decides when you should see it again: just before you'd forget it.
            </p>
            <p>
              <span className="text-zinc-200">Okay</span> every time brings a problem back after about 1 → 3 → 7 → 18 → 45
              days. <span className="text-zinc-200">Easy</span> stretches the gaps, <span className="text-zinc-200">Hard</span>{' '}
              shortens them, and <span className="text-zinc-200">Forgot</span> starts over from tomorrow.
            </p>
            <p>Be honest with your ratings. The schedule is only as good as the feedback you give it.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Review
