# Cheatcode 🔥

**Stop forgetting what you already solved.** Cheatcode turns the NeetCode 150 into one focused daily
session and uses spaced repetition (SM-2) to bring every problem back right before you'd forget it.

## What it does

| | |
|---|---|
| **Daily session** | Every day: one **revision** (most overdue first), one **new problem** from your current topic, and an optional **streak protector** (a quick Easy for busy days). |
| **Spaced repetition** | Rate each revision *Forgot / Hard / Okay / Easy*. Buttons show when it comes back (e.g. "in 7d"). "Okay" every time gives roughly 1 → 3 → 7 → 18 → 45 days. |
| **Notes for future you** | Write the one-line insight for a problem. It is shown every time the problem comes back. |
| **Roadmap** | All 150 problems in 18 topics, in NeetCode order. Search, filter by difficulty/status/Blind 75, tick problems as solved *today* or *before*, mark whole topics as known, choose what to learn next. Finishing a topic moves you on automatically. |
| **Review queue** | Everything due today plus a timeline of upcoming reviews. |
| **Progress** | Current/longest streak, 12-month activity heatmap, progress by difficulty, Blind 75 and topic, revision health. |
| **LeetCode sync** | Add your LeetCode username: recent accepted solutions (LeetCode exposes the last 20 publicly) are imported automatically every few hours. |
| **Learning help** | Every problem links to LeetCode, the NeetCode video explanation and, for premium-only problems, a free version (LintCode). |
| **Time zones** | "Today", streaks and due dates follow *your* local day (the browser sends its time zone). |

## Project layout

```
.                      → API (Express 5 + Prisma 5 + PostgreSQL, TypeScript)
├── src/
│   ├── app.ts         → routes wiring
│   ├── routes/        → auth, me (settings), problems, revision, stats
│   ├── services/      → daily session, progress, activity/streaks, LeetCode sync
│   ├── lib/           → SM-2, time-zone helpers, streaks
│   └── seed.ts        → loads prisma/data/neetcode150.json
├── prisma/            → schema + migrations + bundled problem data
├── test/              → unit tests (npm test)
└── cheatcode-frontend → React 19 + Vite + Tailwind 4
```

## Run it locally

You need Node 20+ and a PostgreSQL database.

```bash
# 1. API
cp .env.example .env          # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate deploy     # create tables
npm run dev                   # http://localhost:3000 (seeds the 150 problems on first start)

# 2. Frontend (new terminal)
cd cheatcode-frontend
npm install
npm run dev                   # http://localhost:5173 (talks to http://localhost:3000 by default)
```

Run the tests with `npm test` (API logic) and `npm run lint` in `cheatcode-frontend`.

## Deploying

### API (e.g. Render web service)

| Setting | Value |
|---|---|
| Build command | `npm install && npm run build` |
| Start command | `npm start` (applies pending database migrations, then starts the server) |
| `DATABASE_URL` | your Postgres connection string |
| `JWT_SECRET` | **required**, a long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CORS_ORIGIN` | optional, e.g. `https://your-frontend.vercel.app` |

The server refuses to start in production without `JWT_SECRET`, so tokens can never be signed with a
guessable default. If your start command is still `node dist/index.js`, either switch it to `npm start`
or run `npx prisma migrate deploy` once after deploying.

On startup the API seeds the problem list if it's missing and fills in the video, Blind 75 and
free-link data for databases seeded by older versions. Nothing to run by hand.

### Frontend (e.g. Vercel / Netlify / Render static site)

| Setting | Value |
|---|---|
| Root directory | `cheatcode-frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |
| `VITE_API_URL` | your API URL (defaults to `https://cheetcode-api.onrender.com`) |

`vercel.json` and `public/_redirects` are included so refreshing on `/daily`, `/roadmap`, etc. works.

> Deploy the API and the frontend together: the new frontend talks to the new, authenticated endpoints.

## API overview

All endpoints except `/`, `/health`, `/topics` and `/auth/*` need `Authorization: Bearer <token>`.
Send `X-Timezone: <IANA zone>` (e.g. `Asia/Kolkata`) so "today" matches the user's day.

| Method | Path | |
|---|---|---|
| POST | `/auth/register` | `{ email, username, password }` → `{ token, user }` |
| POST | `/auth/login` | `{ identifier (email or username), password }` → `{ token, user }` |
| GET | `/topics` | topics with problem counts |
| GET | `/daily` | today's session (or `{ needsOnboarding: true }`) |
| GET / PATCH / DELETE | `/me` | profile; update `currentTopicId`, `streakProtector`, `leetcodeUsername`; delete account (`{ password }`) |
| POST | `/me/password` | `{ currentPassword, newPassword }` |
| POST | `/me/sync/leetcode` | import recent LeetCode solves |
| GET | `/problems/roadmap` | all topics + problems with your status |
| POST | `/problems/:id/solve` | solved today (first review tomorrow) |
| POST | `/problems/:id/skip` | skip for now |
| DELETE | `/problems/:id/progress` | mark as not solved |
| PUT | `/problems/:id/notes` | `{ notes }` |
| POST | `/problems/import` | `{ problemIds?, topicIds? }`: solved before joining (reviews spread over 2 weeks) |
| GET | `/revision` | `{ due, upcoming }` |
| POST | `/revision/:problemId/rate` | `{ rating: FORGOT \| HARD \| OKAY \| EASY }` |
| GET | `/stats` | streaks, heatmap, totals |

## Credits

Problem list and video explanations: [NeetCode](https://neetcode.io) (data from
[neetcode-gh/leetcode](https://github.com/neetcode-gh/leetcode)). Not affiliated with LeetCode or NeetCode.
