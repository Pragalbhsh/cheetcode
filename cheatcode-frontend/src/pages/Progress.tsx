import type { ReactNode } from 'react'
import { Heatmap } from '../components/Heatmap'
import { FlameIcon } from '../components/icons'
import { Card, ErrorState, Meter, PageLoader } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import { percent, plural } from '../lib/format'
import type { Stats } from '../lib/types'

function StatTile({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-2xl font-semibold tracking-tight text-zinc-50">
        {icon}
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

function MeterRow({ label, solved, total }: { label: string; solved: number; total: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-zinc-200">{label}</span>
        <span className="text-zinc-400 tabular-nums">
          {solved}/{total}
          <span className="ml-2 inline-block w-9 text-right text-zinc-500">{percent(solved, total)}%</span>
        </span>
      </div>
      <Meter value={solved} max={total} label={`${label}: ${solved} of ${total}`} />
    </div>
  )
}

function Progress() {
  const { data, error, retry } = useApiData<Stats>('/stats')

  if (error && !data) return <ErrorState message={error} onRetry={retry} />
  if (!data) return <PageLoader label="Crunching your stats…" />

  const { streak, totals, reviews } = data

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Progress</h1>
        <p className="mt-1 text-zinc-400">
          {totals.solved === 0
            ? 'Your stats will fill up as you solve and review problems.'
            : `${percent(totals.solved, totals.total)}% of the NeetCode 150 done. Consistency beats intensity.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Current streak"
          value={plural(streak.current, 'day')}
          icon={<FlameIcon size={20} className={streak.current > 0 ? 'text-orange-400' : 'text-zinc-600'} />}
          sub={streak.activeToday ? 'Done today' : streak.current > 0 ? 'Do one today to keep it' : undefined}
        />
        <StatTile label="Longest streak" value={plural(streak.longest, 'day')} sub={`${plural(data.activeDays, 'active day')} total`} />
        <StatTile label="Problems solved" value={`${totals.solved}`} sub={`of ${totals.total}`} />
        <StatTile label="Reviews done" value={`${reviews.totalReviews}`} sub={`${reviews.mastered} mastered (21+ day gap)`} />
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Activity · last 12 months</h2>
        <Heatmap days={data.heatmap} />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">By difficulty</h2>
          <div className="flex flex-col gap-4">
            <MeterRow label="Easy" {...totals.byDifficulty.EASY} />
            <MeterRow label="Medium" {...totals.byDifficulty.MEDIUM} />
            <MeterRow label="Hard" {...totals.byDifficulty.HARD} />
            <div className="border-t border-zinc-800 pt-4">
              <MeterRow label="Blind 75" {...totals.blind75} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Revision health</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[
              ['In schedule', reviews.scheduled, 'problems you will see again'],
              ['Due today', reviews.due, 'waiting in Review'],
              ['Mastered', reviews.mastered, 'next review 3+ weeks out'],
              ['Learning', reviews.scheduled - reviews.mastered, 'still building memory'],
            ].map(([label, value, hint]) => (
              <div key={label as string}>
                <dt className="text-sm text-zinc-400">{label}</dt>
                <dd className="text-2xl font-semibold text-zinc-50 tabular-nums">{value}</dd>
                <dd className="text-xs text-zinc-500">{hint}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">By topic</h2>
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {data.topics.map((topic) => (
            <MeterRow key={topic.id} label={`${topic.orderIndex}. ${topic.name}`} solved={topic.solved} total={topic.total} />
          ))}
        </div>
      </Card>
    </div>
  )
}

export default Progress
