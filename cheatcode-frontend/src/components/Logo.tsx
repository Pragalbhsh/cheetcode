import { Link } from 'react-router-dom'

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
      <img src="/favicon.svg" alt="" width={28} height={28} className="rounded-lg" />
      Cheatcode
    </Link>
  )
}
