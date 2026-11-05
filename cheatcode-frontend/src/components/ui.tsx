import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import type { Difficulty } from '../lib/types'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-sm shadow-indigo-950',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/60',
  ghost: 'text-zinc-300 hover:bg-zinc-800 hover:text-white',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
  danger: 'bg-rose-600/90 text-white hover:bg-rose-500',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3.5 text-base',
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6', className)}>{children}</div>
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
      style={{ width: size, height: size }}
    />
  )
}

/** Full-area loader. The API runs on a free host that sleeps, so explain slow first loads. */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-zinc-400">
      <Spinner size={28} />
      <p>{label}</p>
      {slow && (
        <p className="max-w-sm text-center text-sm text-zinc-500">
          The server is waking up. This can take up to a minute on the first visit of the day.
        </p>
      )}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-md text-center">
      <p className="mb-1 text-lg font-semibold">Couldn't load this</p>
      <p className="mb-5 text-sm text-zinc-400">{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </Card>
  )
}

const difficultyStyles: Record<Difficulty, string> = {
  EASY: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  MEDIUM: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  HARD: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
}
const difficultyLabel: Record<Difficulty, string> = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' }

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', difficultyStyles[difficulty])}>
      {difficultyLabel[difficulty]}
    </span>
  )
}

export function Tag({ children, tone = 'zinc' }: { children: ReactNode; tone?: 'zinc' | 'indigo' | 'sky' | 'orange' }) {
  const tones = {
    zinc: 'bg-zinc-800 text-zinc-300',
    indigo: 'bg-indigo-500/15 text-indigo-300',
    sky: 'bg-sky-500/15 text-sky-300',
    orange: 'bg-orange-500/15 text-orange-300',
  }
  return <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>
}

/**
 * Part-of-whole meter. One blue ramp (validated for the dark surface): the fill
 * is step 400, the track a deeper step of the same hue so the whole bar reads.
 */
export function Meter({ value, max, label, thin = false }: { value: number; max: number; label: string; thin?: boolean }) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100)
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cx('w-full overflow-hidden rounded-full bg-[#0d366b]/60', thin ? 'h-1.5' : 'h-2')}
    >
      <div className="h-full rounded-full bg-[#3987e5] transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      {children}
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-zinc-700/70 bg-zinc-800/70 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30'

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60',
        checked ? 'bg-indigo-500' : 'bg-zinc-700',
      )}
    >
      <span
        className={cx(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
