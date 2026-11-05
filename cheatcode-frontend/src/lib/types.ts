export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type Rating = 'FORGOT' | 'HARD' | 'OKAY' | 'EASY'
export type SolveStatus = 'SOLVED' | 'ATTEMPTED' | 'SKIPPED'

export interface Problem {
  id: string
  title: string
  difficulty: Difficulty
  leetcodeSlug: string | null
  videoId: string | null
  freeLink: string | null
  premium: boolean
  blind75: boolean
  topicId: string
  orderIndex: number
  notes?: string | null
}

export interface User {
  id: string
  email: string
  username: string
  leetcodeUsername: string | null
  streakProtector: boolean
  currentTopicId: string | null
  currentTopic?: { id: string; name: string } | null
  lastSyncedAt: string | null
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Topic {
  id: string
  name: string
  orderIndex: number
  problemCount: number
}

export interface Streak {
  current: number
  longest: number
  activeToday: boolean
}

export interface TodayCounts {
  solved: number
  reviewed: number
  practiced: number
}

export interface RevisionCard {
  problem: Problem
  intervalDays: number
  repetitions: number
  lastRating: Rating | null
  nextReviewDate: string
  overdueDays: number
  previews: Record<Rating, number>
}

export type DailySession =
  | { needsOnboarding: true }
  | {
      needsOnboarding: false
      date: string
      username: string
      leetcodeUsername: string | null
      topic: { id: string; name: string; orderIndex: number; solved: number; total: number }
      finishedTopic: string | null
      newProblem: Problem | null
      allTopicsComplete: boolean
      revision: RevisionCard | null
      dueCount: number
      nextReviewDate: string | null
      streakProtector: { problem: Problem; done: boolean } | null
      today: TodayCounts
      streak: Streak
      totals: { solved: number; total: number }
    }

export interface RoadmapProblem extends Problem {
  status: SolveStatus | null
  notes: string | null
  solvedAt: string | null
  nextReviewDate: string | null
  intervalDays: number | null
  dueInDays: number | null
}

export interface RoadmapTopic {
  id: string
  name: string
  orderIndex: number
  total: number
  solved: number
  problems: RoadmapProblem[]
}

export interface Roadmap {
  currentTopicId: string | null
  topics: RoadmapTopic[]
}

export interface QueueItem {
  problem: Problem & { topicName: string }
  nextReviewDate: string
  dueInDays: number
  intervalDays: number
  repetitions: number
  lastRating: Rating | null
  previews: Record<Rating, number>
}

export interface RevisionQueue {
  due: QueueItem[]
  upcoming: QueueItem[]
}

export interface Tally {
  solved: number
  total: number
}

export interface Stats {
  today: string
  streak: Streak
  todayCounts: TodayCounts
  activeDays: number
  totals: Tally & { byDifficulty: Record<Difficulty, Tally>; blind75: Tally }
  topics: (Tally & { id: string; name: string; orderIndex: number })[]
  reviews: { scheduled: number; due: number; mastered: number; totalReviews: number }
  heatmap: { date: string; count: number }[]
}

export interface SyncResult {
  checked: number
  matched: number
  imported: { id: string; title: string }[]
  syncedAt: string
}
