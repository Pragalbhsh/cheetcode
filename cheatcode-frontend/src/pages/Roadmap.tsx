import { useMemo, useState } from 'react'
import { CheckIcon, ChevronIcon, ExternalIcon, NoteIcon, PlayIcon, SearchIcon } from '../components/icons'
import { NotesEditor } from '../components/NotesEditor'
import { useToast } from '../components/toast-context'
import { Button, DifficultyBadge, ErrorState, Meter, PageLoader, Tag, inputClass } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import { api, errorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import { leetcodeUrl, plural, relativeDays, videoUrl } from '../lib/format'
import type { Difficulty, Roadmap as RoadmapData, RoadmapProblem, RoadmapTopic } from '../lib/types'

type TickMode = 'today' | 'before'
type StatusFilter = 'all' | 'todo' | 'solved' | 'skipped'

function statusLine(problem: RoadmapProblem) {
  if (problem.status === 'SOLVED') {
    if (problem.dueInDays === null) return { text: 'Solved', className: 'text-emerald-300/80' }
    if (problem.dueInDays <= 0) return { text: 'Review due', className: 'text-indigo-300' }
    return { text: `Review ${relativeDays(problem.dueInDays)}`, className: 'text-zinc-500' }
  }
  if (problem.status === 'SKIPPED') return { text: 'Skipped', className: 'text-zinc-500' }
  if (problem.notes) return { text: 'Has notes', className: 'text-zinc-500' }
  return null
}

function ProblemRow({
  problem,
  onToggle,
  onNotesSaved,
}: {
  problem: RoadmapProblem
  onToggle: (problem: RoadmapProblem) => void
  onNotesSaved: (notes: string | null) => void
}) {
  const [showNotes, setShowNotes] = useState(false)
  const solved = problem.status === 'SOLVED'
  const status = statusLine(problem)

  return (
    <li className="border-t border-zinc-800/80">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <button
          type="button"
          role="checkbox"
          aria-checked={solved}
          aria-label={`${problem.title}: ${solved ? 'solved' : 'not solved'}`}
          onClick={() => onToggle(problem)}
          className={cx(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition',
            solved ? 'border-emerald-500 bg-emerald-500 text-zinc-950' : 'border-zinc-600 hover:border-emerald-400',
          )}
        >
          {solved && <CheckIcon size={15} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={cx('truncate text-sm font-medium', problem.status === 'SKIPPED' ? 'text-zinc-400' : 'text-zinc-100')}>
            {problem.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
            {status && <span className={status.className}>{status.text}</span>}
            {problem.blind75 && <span className="text-sky-300/80">Blind 75</span>}
            {problem.premium && <span className="text-zinc-500">Premium</span>}
          </div>
        </div>

        <span className="hidden sm:block">
          <DifficultyBadge difficulty={problem.difficulty} />
        </span>
        <span className={cx('h-2 w-2 shrink-0 rounded-full sm:hidden', {
          EASY: 'bg-emerald-400',
          MEDIUM: 'bg-amber-400',
          HARD: 'bg-rose-400',
        }[problem.difficulty])} title={problem.difficulty} />

        <div className="flex items-center">
          {problem.leetcodeSlug && (
            <a
              href={problem.premium && problem.freeLink ? problem.freeLink : leetcodeUrl(problem.leetcodeSlug)}
              target="_blank"
              rel="noreferrer"
              title={problem.premium && problem.freeLink ? 'Open free version' : 'Open on LeetCode'}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-indigo-300"
            >
              <ExternalIcon size={16} />
            </a>
          )}
          {problem.videoId && (
            <a
              href={videoUrl(problem.videoId)}
              target="_blank"
              rel="noreferrer"
              title="Watch explanation"
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <PlayIcon size={15} />
            </a>
          )}
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            title={problem.notes ? 'View notes' : 'Add notes'}
            aria-expanded={showNotes}
            className={cx(
              'rounded-lg p-2 hover:bg-zinc-800',
              problem.notes ? 'text-amber-300' : 'text-zinc-500 hover:text-zinc-200',
            )}
          >
            <NoteIcon size={16} />
          </button>
        </div>
      </div>
      {showNotes && (
        <div className="px-4 pb-4 sm:px-5 sm:pl-14">
          <NotesEditor problemId={problem.id} initial={problem.notes} defaultOpen onSaved={onNotesSaved} />
        </div>
      )}
    </li>
  )
}

function TopicSection({
  topic,
  problems,
  isCurrent,
  open,
  onToggleOpen,
  onToggleProblem,
  onNotesSaved,
  onSetCurrent,
  onImportTopic,
}: {
  topic: RoadmapTopic
  problems: RoadmapProblem[]
  isCurrent: boolean
  open: boolean
  onToggleOpen: () => void
  onToggleProblem: (problem: RoadmapProblem) => void
  onNotesSaved: (problemId: string, notes: string | null) => void
  onSetCurrent: () => void
  onImportTopic: () => void
}) {
  const complete = topic.solved === topic.total
  return (
    <section className={cx('overflow-hidden rounded-2xl border bg-zinc-900', isCurrent ? 'border-indigo-500/40' : 'border-zinc-800')}>
      <button type="button" onClick={onToggleOpen} aria-expanded={open} className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-zinc-800/40 sm:px-5">
        <span
          className={cx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            complete ? 'bg-emerald-500 text-zinc-950' : isCurrent ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400',
          )}
        >
          {complete ? <CheckIcon size={16} strokeWidth={3} /> : topic.orderIndex}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{topic.name}</span>
            {isCurrent && <Tag tone="indigo">Current</Tag>}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Meter value={topic.solved} max={topic.total} label={`${topic.name}: ${topic.solved} of ${topic.total} solved`} thin />
            <span className="text-xs whitespace-nowrap text-zinc-400">
              {topic.solved}/{topic.total}
            </span>
          </div>
        </div>
        <ChevronIcon size={18} className={cx('shrink-0 text-zinc-500 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div>
          <ul>
            {problems.map((problem) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                onToggle={onToggleProblem}
                onNotesSaved={(notes) => onNotesSaved(problem.id, notes)}
              />
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 border-t border-zinc-800/80 px-4 py-3 sm:px-5">
            {!isCurrent && !complete && (
              <Button size="sm" variant="secondary" onClick={onSetCurrent}>
                Learn this topic next
              </Button>
            )}
            {!complete && (
              <Button size="sm" variant="ghost" onClick={onImportTopic}>
                I already know this whole topic
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function Roadmap() {
  const toast = useToast()
  const { data, error, retry, reload, mutate } = useApiData<RoadmapData>('/problems/roadmap')
  const [openTopics, setOpenTopics] = useState<Set<string> | null>(null)
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty | 'ALL'>('ALL')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [blind75Only, setBlind75Only] = useState(false)
  const [tickMode, setTickMode] = useState<TickMode>('today')

  const filtering = query.trim() !== '' || difficulty !== 'ALL' || status !== 'all' || blind75Only

  const visible = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.topics
      .map((topic) => ({
        topic,
        problems: topic.problems.filter(
          (p) =>
            (!q || p.title.toLowerCase().includes(q)) &&
            (difficulty === 'ALL' || p.difficulty === difficulty) &&
            (!blind75Only || p.blind75) &&
            (status === 'all' ||
              (status === 'solved' && p.status === 'SOLVED') ||
              (status === 'skipped' && p.status === 'SKIPPED') ||
              (status === 'todo' && p.status !== 'SOLVED' && p.status !== 'SKIPPED')),
        ),
      }))
      .filter(({ problems }) => !filtering || problems.length > 0)
  }, [data, query, difficulty, status, blind75Only, filtering])

  if (error && !data) return <ErrorState message={error} onRetry={retry} />
  if (!data) return <PageLoader label="Loading the roadmap…" />

  const open = openTopics ?? new Set(data.currentTopicId ? [data.currentTopicId] : [])
  const totalSolved = data.topics.reduce((sum, t) => sum + t.solved, 0)
  const total = data.topics.reduce((sum, t) => sum + t.total, 0)

  const setProblem = (problemId: string, update: Partial<RoadmapProblem>) =>
    mutate((roadmap) => ({
      ...roadmap,
      topics: roadmap.topics.map((topic) => {
        const problems = topic.problems.map((p) => (p.id === problemId ? { ...p, ...update } : p))
        return { ...topic, problems, solved: problems.filter((p) => p.status === 'SOLVED').length }
      }),
    }))

  const toggleProblem = async (problem: RoadmapProblem) => {
    try {
      if (problem.status === 'SOLVED') {
        if (!window.confirm(`Mark "${problem.title}" as not solved? It will be removed from your revision schedule.`)) return
        setProblem(problem.id, { status: problem.notes ? 'ATTEMPTED' : null, dueInDays: null })
        await api(`/problems/${problem.id}/progress`, { method: 'DELETE' })
      } else if (tickMode === 'before') {
        setProblem(problem.id, { status: 'SOLVED' })
        await api('/problems/import', { method: 'POST', body: { problemIds: [problem.id] } })
        toast.show(`${problem.title} added to your revision schedule`)
      } else {
        setProblem(problem.id, { status: 'SOLVED', dueInDays: 1 })
        await api(`/problems/${problem.id}/solve`, { method: 'POST' })
        toast.show(`Nice! ${problem.title} comes back tomorrow for review.`)
      }
    } catch (err) {
      toast.show(errorMessage(err), 'error')
    }
    reload()
  }

  const setCurrent = async (topic: RoadmapTopic) => {
    try {
      await api('/me', { method: 'PATCH', body: { currentTopicId: topic.id } })
      mutate((roadmap) => ({ ...roadmap, currentTopicId: topic.id }))
      toast.show(`New problems will now come from ${topic.name}`)
    } catch (err) {
      toast.show(errorMessage(err), 'error')
    }
  }

  const importTopic = async (topic: RoadmapTopic) => {
    const remaining = topic.total - topic.solved
    if (!window.confirm(`Mark all ${remaining} remaining problems in ${topic.name} as already solved? Their reviews will be spread over the next two weeks.`)) return
    try {
      const result = await api<{ imported: number }>('/problems/import', { method: 'POST', body: { topicIds: [topic.id] } })
      toast.show(`${plural(result.imported, 'problem')} added to your revision schedule`)
      reload()
    } catch (err) {
      toast.show(errorMessage(err), 'error')
    }
  }

  const toggleOpen = (id: string) => {
    const next = new Set(open)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setOpenTopics(next)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Roadmap</h1>
        <p className="mt-1 text-zinc-400">The NeetCode 150, topic by topic, in the order that builds on itself.</p>
        <div className="mt-4 flex items-center gap-3">
          <Meter value={totalSolved} max={total} label={`${totalSolved} of ${total} solved`} />
          <span className="text-sm whitespace-nowrap text-zinc-300">
            <span className="font-semibold text-white">{totalSolved}</span> / {total} solved
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 sm:p-4">
        <div className="relative">
          <SearchIcon size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search problems…"
            aria-label="Search problems"
            className={`${inputClass} py-2.5 pl-10`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={difficulty === d}
              onClick={() => setDifficulty(d)}
              className={cx(
                'rounded-full px-3 py-1 text-sm transition',
                difficulty === d ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
              )}
            >
              {d === 'ALL' ? 'All' : d[0] + d.slice(1).toLowerCase()}
            </button>
          ))}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            aria-label="Filter by status"
            className="rounded-full border-0 bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
          >
            <option value="all">Any status</option>
            <option value="todo">To do</option>
            <option value="solved">Solved</option>
            <option value="skipped">Skipped</option>
          </select>
          <button
            type="button"
            aria-pressed={blind75Only}
            onClick={() => setBlind75Only((v) => !v)}
            className={cx(
              'rounded-full px-3 py-1 text-sm transition',
              blind75Only ? 'bg-sky-400 text-zinc-900' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
            )}
          >
            Blind 75
          </button>
        </div>
        <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3 text-sm sm:flex-row sm:items-center">
          <span className="text-zinc-400">Ticking a box means:</span>
          <div className="inline-flex rounded-xl bg-zinc-800 p-1" role="radiogroup" aria-label="What ticking a problem means">
            {(
              [
                ['today', 'I solved it today'],
                ['before', 'I solved it before'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={tickMode === mode}
                onClick={() => setTickMode(mode)}
                className={cx(
                  'rounded-lg px-3 py-1.5 font-medium transition',
                  tickMode === mode ? 'bg-zinc-950 text-white shadow' : 'text-zinc-400 hover:text-zinc-200',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 && <p className="py-10 text-center text-zinc-400">No problems match these filters.</p>}

      <div className="flex flex-col gap-3">
        {visible.map(({ topic, problems }) => (
          <TopicSection
            key={topic.id}
            topic={topic}
            problems={problems}
            isCurrent={topic.id === data.currentTopicId}
            open={filtering || open.has(topic.id)}
            onToggleOpen={() => toggleOpen(topic.id)}
            onToggleProblem={toggleProblem}
            onNotesSaved={(problemId, notes) =>
              setProblem(problemId, { notes, status: problems.find((p) => p.id === problemId)?.status ?? 'ATTEMPTED' })
            }
            onSetCurrent={() => setCurrent(topic)}
            onImportTopic={() => importTopic(topic)}
          />
        ))}
      </div>
    </div>
  )
}

export default Roadmap
