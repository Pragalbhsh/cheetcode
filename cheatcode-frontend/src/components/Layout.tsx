import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearSession, getUsername } from '../lib/auth'
import { cx } from '../lib/cx'
import { ChartIcon, LogoutIcon, MapIcon, RepeatIcon, SettingsIcon, TodayIcon } from './icons'
import { Logo } from './Logo'

const links = [
  { to: '/daily', label: 'Today', icon: TodayIcon },
  { to: '/review', label: 'Review', icon: RepeatIcon },
  { to: '/roadmap', label: 'Roadmap', icon: MapIcon },
  { to: '/progress', label: 'Progress', icon: ChartIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function Layout() {
  const navigate = useNavigate()
  const username = getUsername()

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 text-zinc-100 sm:pb-10">
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo to="/daily" />
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cx(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {username && <span className="hidden text-sm text-zinc-500 md:inline">@{username}</span>}
            <button
              type="button"
              onClick={() => {
                clearSession()
                navigate('/login')
              }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              <LogoutIcon size={17} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-10">
        <Outlet />
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                isActive ? 'text-indigo-300' : 'text-zinc-500',
              )
            }
          >
            <Icon size={21} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
