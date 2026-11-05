import { Link } from 'react-router-dom'
import { isLoggedIn } from '../lib/auth'

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center text-zinc-100">
      <p className="font-mono text-6xl font-bold text-indigo-400">404</p>
      <h1 className="text-xl font-semibold">This page doesn't exist</h1>
      <p className="text-zinc-400">Maybe it got lost in a recursion without a base case.</p>
      <Link to={isLoggedIn() ? '/daily' : '/'} className="mt-2 rounded-xl bg-indigo-500 px-5 py-2.5 font-semibold text-white hover:bg-indigo-400">
        Take me home
      </Link>
    </div>
  )
}

export default NotFound
