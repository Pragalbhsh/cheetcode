export function plural(count: number, word: string, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`
}

/** "today", "tomorrow", "in 5 days", "3 days ago" */
export function relativeDays(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days > 1) {
    if (days < 14) return `in ${days} days`
    if (days < 60) return `in ${Math.round(days / 7)} weeks`
    return `in ${Math.round(days / 30)} months`
  }
  return `${-days} days ago`
}

/** Compact interval used on rating buttons: 1d, 6d, 3w, 4mo */
export function shortInterval(days: number): string {
  if (days < 14) return `${days}d`
  if (days < 60) return `${Math.round(days / 7)}w`
  return `${Math.round(days / 30)}mo`
}

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Date(value).toLocaleDateString(undefined, options)
}

export function percent(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Up late'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const leetcodeUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`
export const videoUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`
