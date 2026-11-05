import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckIcon } from '../components/icons'
import { Logo } from '../components/Logo'
import { useToast } from '../components/toast-context'
import { Button, ErrorState, Field, PageLoader, Toggle, inputClass } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import { api, errorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import type { Topic } from '../lib/types'

type Step = 'level' | 'topics' | 'prefs'

function Onboarding() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: topics, error, retry } = useApiData<Topic[]>('/topics')
  const [step, setStep] = useState<Step>('level')
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [startTopicId, setStartTopicId] = useState<string | null>(null)
  const [streakProtector, setStreakProtector] = useState(true)
  const [leetcodeUsername, setLeetcodeUsername] = useState('')
  const [saving, setSaving] = useState(false)

  if (error) return <ErrorState message={error} onRetry={retry} />
  if (!topics) return <PageLoader label="Loading topics…" />

  const firstUnknown = topics.find((topic) => !known.has(topic.id)) ?? topics[0]
  const startTopic = topics.find((topic) => topic.id === startTopicId) ?? firstUnknown
  const knownProblems = topics.filter((t) => known.has(t.id)).reduce((sum, t) => sum + t.problemCount, 0)

  const toggleKnown = (id: string) => {
    setKnown((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setStartTopicId(null)
  }

  const finish = async () => {
    setSaving(true)
    try {
      if (known.size > 0) {
        await api('/problems/import', { method: 'POST', body: { topicIds: [...known] } })
      }
      await api('/me', {
        method: 'PATCH',
        body: {
          currentTopicId: startTopic.id,
          streakProtector,
          ...(leetcodeUsername.trim() ? { leetcodeUsername: leetcodeUsername.trim() } : {}),
        },
      })
      if (leetcodeUsername.trim()) {
        // Best effort: pull in recent LeetCode solves right away.
        api('/me/sync/leetcode', { method: 'POST' }).catch(() => {})
      }
      navigate('/daily', { replace: true })
    } catch (err) {
      toast.show(errorMessage(err), 'error')
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <Logo />
      <div className="mt-8 w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
        <div className="mb-6 flex gap-1.5" aria-hidden="true">
          {(['level', 'topics', 'prefs'] as Step[]).map((s, i) => (
            <span
              key={s}
              className={cx(
                'h-1 flex-1 rounded-full',
                i <= ['level', 'topics', 'prefs'].indexOf(step) ? 'bg-indigo-400' : 'bg-zinc-800',
              )}
            />
          ))}
        </div>

        {step === 'level' && (
          <div className="pop-in">
            <h1 className="text-2xl font-bold">Welcome to Cheatcode 🔥</h1>
            <p className="mt-1 mb-7 text-zinc-400">Where are you starting from?</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setKnown(new Set())
                  setStartTopicId(topics[0].id)
                  setStep('prefs')
                }}
                className="rounded-2xl border border-zinc-700 bg-zinc-800/50 p-5 text-left transition hover:border-indigo-400 hover:bg-indigo-500/10"
              >
                <p className="font-semibold">🌱 I'm new to DSA</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Start at the beginning with {topics[0].name}, one problem a day.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setStep('topics')}
                className="rounded-2xl border border-zinc-700 bg-zinc-800/50 p-5 text-left transition hover:border-indigo-400 hover:bg-indigo-500/10"
              >
                <p className="font-semibold">⚡ I've already solved some problems</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Tick the topics you know. They go into your revision schedule and you continue from there.
                </p>
              </button>
            </div>
          </div>
        )}

        {step === 'topics' && (
          <div className="pop-in">
            <h1 className="text-2xl font-bold">Which topics have you covered?</h1>
            <p className="mt-1 mb-5 text-sm text-zinc-400">
              Their problems are added to your revision schedule, spread over the next two weeks so you're not
              flooded. You can fine-tune individual problems later in the Roadmap.
            </p>
            <div className="grid max-h-[46vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {topics.map((topic) => {
                const selected = known.has(topic.id)
                return (
                  <button
                    key={topic.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleKnown(topic.id)}
                    className={cx(
                      'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition',
                      selected
                        ? 'border-indigo-400 bg-indigo-500/15 text-white'
                        : 'border-zinc-700/70 bg-zinc-800/40 text-zinc-300 hover:border-zinc-500',
                    )}
                  >
                    <span
                      className={cx(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                        selected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-zinc-600',
                      )}
                    >
                      {selected && <CheckIcon size={14} />}
                    </span>
                    <span className="flex-1">{topic.name}</span>
                    <span className="text-xs text-zinc-500">{topic.problemCount}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5">
              <Field label="Start learning new problems from">
                <select
                  value={startTopic.id}
                  onChange={(event) => setStartTopicId(event.target.value)}
                  className={inputClass}
                >
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.orderIndex}. {topic.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep('level')}>
                ← Back
              </Button>
              <div className="flex items-center gap-3">
                {known.size > 0 && <span className="hidden text-sm text-zinc-400 sm:inline">{knownProblems} problems</span>}
                <Button onClick={() => setStep('prefs')}>Continue</Button>
              </div>
            </div>
          </div>
        )}

        {step === 'prefs' && (
          <div className="pop-in">
            <h1 className="text-2xl font-bold">Two quick settings</h1>
            <p className="mt-1 mb-6 text-zinc-400">You can change these any time in Settings.</p>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <div>
                <p className="font-semibold">🛡️ Streak protector</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Adds one quick Easy problem to each day, perfect for busy days when you still want to keep your
                  streak (and your LeetCode streak) alive.
                </p>
              </div>
              <Toggle checked={streakProtector} onChange={setStreakProtector} label="Streak protector" />
            </div>

            <div className="mt-4">
              <Field
                label="LeetCode username (optional)"
                hint="We'll import problems you solve on LeetCode automatically, so you don't have to tick them here."
              >
                <input
                  value={leetcodeUsername}
                  onChange={(event) => setLeetcodeUsername(event.target.value)}
                  className={inputClass}
                  placeholder="your-leetcode-handle"
                  autoComplete="off"
                />
              </Field>
            </div>

            <div className="mt-6 rounded-xl bg-zinc-800/40 px-4 py-3 text-sm text-zinc-300">
              You'll start with <span className="font-semibold text-white">{startTopic.name}</span>
              {known.size > 0 && (
                <>
                  {' '}
                  and revise <span className="font-semibold text-white">{knownProblems} problems</span> you already know
                </>
              )}
              .
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(known.size > 0 || startTopicId !== topics[0].id ? 'topics' : 'level')}>
                ← Back
              </Button>
              <Button size="lg" onClick={finish} loading={saving}>
                Start my first session →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Onboarding
