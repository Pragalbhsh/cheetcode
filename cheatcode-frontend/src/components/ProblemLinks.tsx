import { leetcodeUrl, videoUrl } from '../lib/format'
import type { Problem } from '../lib/types'
import { ExternalIcon, PlayIcon } from './icons'

const linkClass =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-800'

/** LeetCode link, free alternative for premium problems, and the NeetCode explanation video. */
export function ProblemLinks({ problem, compact = false }: { problem: Problem; compact?: boolean }) {
  return (
    <div className="-ml-2.5 flex flex-wrap items-center gap-1">
      {problem.leetcodeSlug && (
        <a href={leetcodeUrl(problem.leetcodeSlug)} target="_blank" rel="noreferrer" className={`${linkClass} text-indigo-300`}>
          <ExternalIcon size={15} />
          {compact ? 'LeetCode' : problem.premium ? 'LeetCode (Premium)' : 'Open on LeetCode'}
        </a>
      )}
      {problem.premium && problem.freeLink && (
        <a href={problem.freeLink} target="_blank" rel="noreferrer" className={`${linkClass} text-sky-300`}>
          <ExternalIcon size={15} />
          {compact ? 'Free' : 'Free version'}
        </a>
      )}
      {problem.videoId && (
        <a href={videoUrl(problem.videoId)} target="_blank" rel="noreferrer" className={`${linkClass} text-zinc-300`}>
          <PlayIcon size={14} />
          {compact ? 'Video' : 'Watch explanation'}
        </a>
      )}
    </div>
  )
}
