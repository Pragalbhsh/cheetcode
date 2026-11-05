import { useState } from 'react'
import { shortInterval } from '../lib/format'
import type { Rating } from '../lib/types'
import { cx } from '../lib/cx'

const options: { rating: Rating; label: string; hint: string; className: string }[] = [
  { rating: 'FORGOT', label: 'Forgot', hint: "Couldn't solve it", className: 'hover:border-rose-400/60 hover:bg-rose-500/10' },
  { rating: 'HARD', label: 'Hard', hint: 'Solved with a struggle', className: 'hover:border-amber-400/60 hover:bg-amber-500/10' },
  { rating: 'OKAY', label: 'Okay', hint: 'Solved it', className: 'hover:border-sky-400/60 hover:bg-sky-500/10' },
  { rating: 'EASY', label: 'Easy', hint: 'Instantly knew it', className: 'hover:border-emerald-400/60 hover:bg-emerald-500/10' },
]

/** "How did it go?": each button shows when the problem will come back. */
export function RatingButtons({
  previews,
  onRate,
}: {
  previews: Record<Rating, number>
  onRate: (rating: Rating) => Promise<void>
}) {
  const [pending, setPending] = useState<Rating | null>(null)

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-400">Re-solve it, then rate how it went:</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <button
            key={option.rating}
            type="button"
            title={option.hint}
            disabled={pending !== null}
            onClick={async () => {
              setPending(option.rating)
              try {
                await onRate(option.rating)
              } finally {
                setPending(null)
              }
            }}
            className={cx(
              'flex flex-col items-center rounded-xl border border-zinc-700/70 bg-zinc-800/60 px-3 py-2.5 transition disabled:opacity-60',
              option.className,
              pending === option.rating && 'animate-pulse',
            )}
          >
            <span className="text-sm font-semibold text-zinc-100">{option.label}</span>
            <span className="text-xs text-zinc-400">
              {previews[option.rating] === 1 ? 'tomorrow' : `in ${shortInterval(previews[option.rating])}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
