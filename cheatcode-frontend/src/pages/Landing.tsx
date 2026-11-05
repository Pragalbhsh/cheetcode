import { Link } from 'react-router-dom'
import { BrainIcon, CheckIcon, FlameIcon, MapIcon, NoteIcon, PlayIcon, RepeatIcon, ShieldIcon, SyncIcon } from '../components/icons'
import { Logo } from '../components/Logo'

const features = [
  {
    icon: BrainIcon,
    title: 'Spaced repetition',
    body: 'Every solved problem comes back right before you would forget it: after 1, 3, 7, 18, 45 days… You rate how it went and the schedule adapts.',
  },
  {
    icon: RepeatIcon,
    title: 'A daily session, not a to-do list',
    body: 'Open the app and know exactly what to do: one revision, one new problem in your current topic, and an optional quick win.',
  },
  {
    icon: NoteIcon,
    title: 'Notes for future you',
    body: 'Write the one-line insight ("monotonic stack, pop while smaller"). It shows up every time the problem comes back.',
  },
  {
    icon: MapIcon,
    title: 'The full NeetCode 150 roadmap',
    body: '18 topics in the proven order, from Arrays & Hashing to Bit Manipulation. Blind 75 tagged. Finish a topic and you move on automatically.',
  },
  {
    icon: PlayIcon,
    title: 'Stuck? Watch the explanation',
    body: 'Every problem links to its NeetCode video walkthrough, and premium-only problems link to a free version you can practise on.',
  },
  {
    icon: SyncIcon,
    title: 'LeetCode sync',
    body: 'Add your LeetCode username and your recent accepted solutions are imported automatically. Already done whole topics? Tick them off in one click.',
  },
]

const steps = [
  { title: 'Tell us where you are', body: 'Start from scratch, or tick off the topics you already know.' },
  { title: 'Do today’s session', body: 'About 30–45 minutes: revise one problem, learn one new one.' },
  { title: 'Rate your recall', body: 'Forgot, Hard, Okay or Easy: we schedule the next review for you.' },
]

function PreviewCard({ tag, tagClass, title, meta, children }: { tag: string; tagClass: string; title: string; meta: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 text-left shadow-xl">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tagClass}`}>{tag}</span>
      <p className="mt-2.5 font-semibold text-zinc-100">{title}</p>
      <p className="text-xs text-zinc-500">{meta}</p>
      {children}
    </div>
  )
}

function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_60%)]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition hover:text-white">
            Log in
          </Link>
          <Link to="/register" className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">
            Get started
          </Link>
        </div>
      </nav>

      <header className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-12 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-200">
            NeetCode 150 · spaced repetition · free
          </span>
          <h1 className="mt-6 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-6xl">
            Stop forgetting what <span className="text-indigo-400">you already solved.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-zinc-400">
            You solved Two Sum. Three weeks later, in the interview, it's gone. Cheatcode gives you one focused session a
            day and brings every problem back right before you'd forget it, so what you practise actually sticks.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="rounded-2xl bg-indigo-500 px-7 py-4 text-center text-base font-semibold text-white shadow-lg shadow-indigo-950 transition hover:bg-indigo-400"
            >
              Start revising, it's free →
            </Link>
            <Link
              to="/login"
              className="rounded-2xl border border-zinc-700 px-7 py-4 text-center text-base font-semibold text-zinc-200 transition hover:bg-zinc-900"
            >
              I have an account
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-sm flex-col gap-3" aria-hidden="true">
          <div className="mb-1 flex items-center justify-between px-1 text-sm">
            <span className="font-semibold">Today's session</span>
            <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-0.5 text-orange-300">
              <FlameIcon size={14} /> 12 days
            </span>
          </div>
          <PreviewCard tag="Revision" tagClass="bg-indigo-500/15 text-indigo-300" title="Longest Consecutive Sequence" meta="Medium · last seen 7 days ago">
            <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[11px]">
              {['Forgot', 'Hard', 'Okay', 'Easy'].map((label, i) => (
                <span key={label} className="rounded-lg border border-zinc-700/70 bg-zinc-800/60 py-1.5 text-zinc-300">
                  {label}
                  <span className="block text-zinc-500">{['1d', '8d', '18d', '23d'][i]}</span>
                </span>
              ))}
            </div>
          </PreviewCard>
          <PreviewCard tag="New · Two Pointers" tagClass="bg-violet-500/15 text-violet-300" title="3Sum" meta="Medium · Blind 75" />
          <PreviewCard tag="Streak protector" tagClass="bg-orange-500/15 text-orange-300" title="Valid Palindrome" meta="Easy · quick win for a busy day">
            <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300">
              <CheckIcon size={14} /> Done
            </p>
          </PreviewCard>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <h2 className="mb-8 text-center text-sm font-semibold tracking-widest text-zinc-500 uppercase">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-300">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Everything you need to actually remember</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <Icon size={22} className="text-indigo-300" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 to-zinc-900 p-8 text-center sm:p-12">
          <ShieldIcon size={28} className="mx-auto text-indigo-300" />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">30 minutes a day. Interview-ready memory.</h2>
          <p className="mx-auto mt-3 max-w-lg text-zinc-400">Free, no credit card, works on your phone.</p>
          <Link
            to="/register"
            className="mt-8 inline-block rounded-2xl bg-indigo-500 px-7 py-4 font-semibold text-white transition hover:bg-indigo-400"
          >
            Create your free account
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-5 py-8 text-center text-xs text-zinc-600">
        Problem list and video explanations from NeetCode. Cheatcode is not affiliated with LeetCode or NeetCode.
      </footer>
    </div>
  )
}

export default Landing
