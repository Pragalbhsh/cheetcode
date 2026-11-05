import type { ReactNode } from 'react'
import { Logo } from '../components/Logo'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 mb-7 text-zinc-400">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
