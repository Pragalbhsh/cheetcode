import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calculateNextReview, MAX_INTERVAL_DAYS, MIN_EASE, nextState, previewIntervals, RATINGS } from '../src/lib/sm2'
import { computeStreaks } from '../src/lib/streak'
import { dayKey, daysUntil, endOfDay, resolveTimeZone, shiftDayKey } from '../src/lib/time'
import { fetchRecentAccepted } from '../src/services/leetcode'

const fresh = { repetitions: 0, easeFactor: 2.5, intervalDays: 1 }

describe('SM-2 scheduling', () => {
  it('FORGOT resets to tomorrow and lowers ease', () => {
    const next = nextState({ ...fresh, repetitions: 4, intervalDays: 30, rating: 'FORGOT' })
    assert.deepEqual(next, { intervalDays: 1, repetitions: 0, easeFactor: 2.3 })
  })

  it('ease never drops below the minimum', () => {
    let state = { ...fresh }
    for (let i = 0; i < 20; i++) state = nextState({ ...state, rating: 'FORGOT' })
    assert.equal(state.easeFactor, MIN_EASE)
  })

  it('OKAY every time grows 3 → 7 → 18 → 45 days', () => {
    const intervals: number[] = []
    let state = { ...fresh }
    for (let i = 0; i < 4; i++) {
      state = nextState({ ...state, rating: 'OKAY' })
      intervals.push(state.intervalDays)
    }
    assert.deepEqual(intervals, [3, 7, 18, 45])
  })

  it('ratings are ordered: FORGOT < HARD < OKAY < EASY at every stage', () => {
    for (const state of [fresh, { repetitions: 1, easeFactor: 2.5, intervalDays: 3 }, { repetitions: 3, easeFactor: 1.3, intervalDays: 10 }]) {
      const p = previewIntervals(state)
      assert.ok(p.FORGOT < p.HARD && p.HARD < p.OKAY && p.OKAY < p.EASY, JSON.stringify({ state, p }))
    }
  })

  it('a successful review always moves the interval forward and is capped', () => {
    for (const rating of RATINGS.filter((r) => r !== 'FORGOT')) {
      const next = nextState({ repetitions: 5, easeFactor: 1.3, intervalDays: 2, rating })
      assert.ok(next.intervalDays >= 3)
      assert.equal(nextState({ repetitions: 9, easeFactor: 3, intervalDays: 340, rating }).intervalDays, MAX_INTERVAL_DAYS)
    }
  })

  it('handles junk stored values without NaN', () => {
    const next = nextState({ repetitions: NaN, easeFactor: NaN, intervalDays: 0, rating: 'OKAY' })
    assert.ok(Number.isFinite(next.intervalDays) && Number.isFinite(next.easeFactor))
  })

  it('computes the review date from now', () => {
    const now = new Date('2026-01-01T10:00:00Z')
    const result = calculateNextReview({ ...fresh, rating: 'OKAY' }, now)
    assert.equal(result.nextReviewDate.toISOString(), '2026-01-04T10:00:00.000Z')
  })
})

describe('time zones', () => {
  it('falls back to UTC for invalid zones', () => {
    assert.equal(resolveTimeZone('Not/AZone'), 'UTC')
    assert.equal(resolveTimeZone(undefined), 'UTC')
    assert.equal(resolveTimeZone('Asia/Kolkata'), 'Asia/Kolkata')
  })

  it('computes the local calendar day', () => {
    const instant = new Date('2026-03-10T20:00:00Z') // 01:30 next day in India
    assert.equal(dayKey(instant, 'UTC'), '2026-03-10')
    assert.equal(dayKey(instant, 'Asia/Kolkata'), '2026-03-11')
    assert.equal(dayKey(instant, 'America/Los_Angeles'), '2026-03-10')
  })

  it('end of day is the last millisecond of the local day', () => {
    const now = new Date('2026-03-10T20:00:00Z')
    assert.equal(endOfDay(now, 'UTC').toISOString(), '2026-03-10T23:59:59.999Z')
    assert.equal(endOfDay(now, 'Asia/Kolkata').toISOString(), '2026-03-11T18:29:59.999Z')
  })

  it('counts whole calendar days', () => {
    const now = new Date('2026-03-10T23:00:00Z')
    assert.equal(daysUntil(new Date('2026-03-11T01:00:00Z'), now, 'UTC'), 1)
    assert.equal(daysUntil(new Date('2026-03-09T01:00:00Z'), now, 'UTC'), -1)
    assert.equal(shiftDayKey('2026-02-28', 1), '2026-03-01')
    assert.equal(shiftDayKey('2026-01-01', -1), '2025-12-31')
  })
})

describe('streaks', () => {
  it('counts consecutive days including today', () => {
    assert.deepEqual(computeStreaks(['2026-05-03', '2026-05-04', '2026-05-05'], '2026-05-05'), {
      current: 3,
      longest: 3,
      activeToday: true,
    })
  })

  it('keeps a streak alive until the day is over', () => {
    const streak = computeStreaks(['2026-05-03', '2026-05-04'], '2026-05-05')
    assert.equal(streak.current, 2)
    assert.equal(streak.activeToday, false)
  })

  it('breaks after a missed day but remembers the longest', () => {
    const streak = computeStreaks(['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04', '2026-05-03'], '2026-05-05')
    assert.equal(streak.current, 0)
    assert.equal(streak.longest, 4)
  })

  it('handles no activity', () => {
    assert.deepEqual(computeStreaks([], '2026-05-05'), { current: 0, longest: 0, activeToday: false })
  })
})

describe('LeetCode sync parsing', () => {
  const respond = (body: unknown, status = 200) =>
    (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

  it('parses recent accepted submissions', async () => {
    const result = await fetchRecentAccepted(
      'someone',
      respond({
        data: {
          matchedUser: { username: 'someone' },
          recentAcSubmissionList: [{ title: 'Two Sum', titleSlug: 'two-sum', timestamp: '1767225600' }],
        },
      }),
    )
    assert.deepEqual(result, [{ title: 'Two Sum', titleSlug: 'two-sum', timestamp: 1767225600000 }])
  })

  it('reports unknown users clearly', async () => {
    await assert.rejects(
      fetchRecentAccepted('ghost', respond({ data: { matchedUser: null, recentAcSubmissionList: null } })),
      /was not found/,
    )
  })

  it('reports LeetCode outages clearly', async () => {
    await assert.rejects(fetchRecentAccepted('someone', respond({}, 503)), /status 503/)
    const failing = (async () => {
      throw new Error('network down')
    }) as unknown as typeof fetch
    await assert.rejects(fetchRecentAccepted('someone', failing), /Couldn't reach LeetCode/)
  })
})
