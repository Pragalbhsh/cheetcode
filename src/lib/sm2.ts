// Spaced repetition scheduling, based on SM-2 (the algorithm behind Anki/SuperMemo).
//
// When a problem is first solved it is scheduled for review tomorrow
// (repetitions = 0). Every review is rated:
//   FORGOT → start over: review again tomorrow, ease drops
//   HARD   → small step forward, ease drops
//   OKAY   → normal step forward
//   EASY   → big step forward, ease grows
//
// With default ease (2.5) and "OKAY" every time a problem comes back after
// 1 → 3 → 7 → 18 → 45 → 113 days, so long-term memory is built with only a
// handful of reviews per problem.

export const RATINGS = ['FORGOT', 'HARD', 'OKAY', 'EASY'] as const
export type Rating = (typeof RATINGS)[number]

export const MIN_EASE = 1.3
export const MAX_EASE = 3.0
export const MAX_INTERVAL_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

export interface ScheduleState {
  repetitions: number
  easeFactor: number
  intervalDays: number
}

export interface SM2Input extends ScheduleState {
  rating: Rating
}

export interface SM2Output extends ScheduleState {
  nextReviewDate: Date
}

export function isRating(value: unknown): value is Rating {
  return typeof value === 'string' && (RATINGS as readonly string[]).includes(value)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Pure scheduling step: what the schedule looks like after one rated review. */
export function nextState(input: SM2Input): ScheduleState {
  const { rating } = input
  const repetitions = Math.max(0, Math.floor(input.repetitions || 0))
  const easeFactor = clamp(Number.isFinite(input.easeFactor) ? input.easeFactor : 2.5, MIN_EASE, MAX_EASE)
  const previousInterval = Math.max(1, Math.round(input.intervalDays || 1))

  if (rating === 'FORGOT') {
    return { intervalDays: 1, repetitions: 0, easeFactor: clamp(easeFactor - 0.2, MIN_EASE, MAX_EASE) }
  }

  let interval: number
  if (repetitions === 0) {
    interval = { HARD: 2, OKAY: 3, EASY: 4 }[rating]
  } else if (repetitions === 1) {
    interval = { HARD: 4, OKAY: 7, EASY: 10 }[rating]
  } else {
    const multiplier = { HARD: 1.2, OKAY: easeFactor, EASY: easeFactor * 1.3 }[rating]
    // Always move forward by at least one day after a successful review.
    interval = Math.max(previousInterval + 1, Math.round(previousInterval * multiplier))
  }

  const easeDelta = { HARD: -0.15, OKAY: 0, EASY: 0.15 }[rating]

  return {
    intervalDays: Math.min(MAX_INTERVAL_DAYS, interval),
    repetitions: repetitions + 1,
    easeFactor: clamp(easeFactor + easeDelta, MIN_EASE, MAX_EASE),
  }
}

export function calculateNextReview(input: SM2Input, now: Date = new Date()): SM2Output {
  const state = nextState(input)
  return { ...state, nextReviewDate: new Date(now.getTime() + state.intervalDays * DAY_MS) }
}

/** How many days each rating would push the problem out: shown on the rating buttons. */
export function previewIntervals(state: ScheduleState): Record<Rating, number> {
  return Object.fromEntries(RATINGS.map((rating) => [rating, nextState({ ...state, rating }).intervalDays])) as Record<
    Rating,
    number
  >
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}
