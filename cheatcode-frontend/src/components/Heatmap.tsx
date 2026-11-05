import { useEffect, useRef, useState } from 'react'
import { plural } from '../lib/format'

// Sequential single-hue ramp (blue), validated as an ordinal ramp against the
// dark card surface. Zero is a neutral cell so "no activity" doesn't read as a value.
const LEVELS = ['#27272a', '#184f95', '#256abf', '#3987e5', '#86b6ef']
const levelFor = (count: number) => (count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4)
const LEVEL_LABELS = ['No activity', '1 activity', '2–3', '4–5', '6+']

const CELL = 10
const GAP = 3
const weekdayOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay()
const formatDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

interface Hover {
  date: string
  count: number
  left: number
  top: number
}

/** Activity calendar: one cell per day, columns are weeks, newest on the right. */
export function Heatmap({ days }: { days: { date: string; count: number }[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)

  useEffect(() => {
    // On narrow screens start scrolled to the most recent weeks.
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth
  }, [days])

  if (days.length === 0) return null

  const cells: ({ date: string; count: number } | null)[] = [
    ...Array<null>(weekdayOf(days[0].date)).fill(null),
    ...days,
  ]
  const weeks: (typeof cells)[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const monthLabels = weeks.map((week, index) => {
    const first = week.find((cell) => cell && cell.date.endsWith('-01')) ?? (index === 0 ? week.find(Boolean) : null)
    return first ? new Date(`${first.date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' }) : ''
  })

  const activeDays = days.filter((day) => day.count > 0).length
  const total = days.reduce((sum, day) => sum + day.count, 0)

  return (
    <div className="relative">
      <div ref={scroller} className="overflow-x-auto pb-1">
        <div
          role="img"
          aria-label={`Activity over the last ${Math.round(days.length / 7)} weeks: ${plural(activeDays, 'active day')}, ${plural(total, 'activity', 'activities')} in total.`}
          className="relative inline-flex flex-col"
          onMouseLeave={() => setHover(null)}
        >
          <div className="mb-1 flex text-[10px] text-zinc-500" style={{ gap: GAP }} aria-hidden="true">
            {monthLabels.map((label, index) => (
              <span key={index} className="overflow-visible whitespace-nowrap" style={{ width: CELL }}>
                {label}
              </span>
            ))}
          </div>
          <div className="flex" style={{ gap: GAP }}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col" style={{ gap: GAP }}>
                {week.map((cell, dayIndex) =>
                  cell ? (
                    <div
                      key={cell.date}
                      onMouseEnter={(event) => {
                        const target = event.currentTarget
                        setHover({
                          ...cell,
                          left: target.offsetLeft + CELL / 2 - (scroller.current?.scrollLeft ?? 0),
                          top: target.offsetTop,
                        })
                      }}
                      className="rounded-[3px] ring-white/70 hover:ring-1"
                      style={{ width: CELL, height: CELL, background: LEVELS[levelFor(cell.count)] }}
                    />
                  ) : (
                    <div key={`pad-${dayIndex}`} style={{ width: CELL, height: CELL }} />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg"
          style={{ left: hover.left, top: hover.top - 6 }}
        >
          <span className="font-semibold text-zinc-100">
            {hover.count === 0 ? 'No activity' : plural(hover.count, 'activity', 'activities')}
          </span>
          <span className="text-zinc-400"> · {formatDay(hover.date)}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-zinc-500">
        <span>Less</span>
        {LEVELS.map((color, index) => (
          <span
            key={color}
            title={LEVEL_LABELS[index]}
            className="inline-block rounded-[3px]"
            style={{ width: CELL, height: CELL, background: color }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
