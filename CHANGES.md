# What changed in v2

## Fixed

**Security**
- Login tokens were issued but never checked, and every endpoint trusted a `userId` sent by the browser, so
  anyone could read or change anyone's data. Every endpoint now verifies the token and the user id comes only
  from it.
- `JWT_SECRET` no longer falls back to `"supersecret"`: the server refuses to start in production without it.
  Tokens now expire after 30 days.
- Passwords need at least 8 characters, emails are validated and stored lowercase, and duplicate checks are
  case-insensitive. Auth endpoints are rate-limited.

**Broken flows**
- "Get Started" and "Start Revising Free" buttons did nothing.
- A user who logged in before picking a topic got a blank page. They are now sent to onboarding.
- A problem marked solved was due for revision immediately. Its first review is now tomorrow.
- Finishing a topic left you with no new problem. You now move on to the next topic automatically.
- The streak protector could not be turned on and changed on every refresh. It now has a setting and is
  picked once per day.
- "Due today" used server time (UTC), so reviews appeared at the wrong hour. It now follows your local day.
- `alert()` popups are replaced with toasts, and every page has loading and error states.

**Deploy and config**
- The port is read from `PORT`.
- The API URL is configurable via `VITE_API_URL` instead of being hardcoded 10 times.
- `prisma.config.*` files (incompatible with the installed Prisma 5) and the committed `dist/` folder are removed.
- Problem data is bundled, so seeding doesn't depend on a network fetch.
- SPA rewrites are included, so refreshing `/daily` doesn't 404.

## New
- SM-2 tuned: Hard gives shorter gaps, Easy gives a bonus, gaps never shrink after a success, and the rating
  buttons show when the problem comes back.
- Notes per problem, shown when it comes back for revision.
- Streaks, a 12-month activity heatmap, and progress by difficulty, Blind 75 and topic.
- Roadmap with search and filters, tick-to-solve, "I solved it before" mode, "I already know this topic", and
  "learn this topic next".
- Review queue page.
- Onboarding where experienced users mark the topics they know. Their reviews are spread over 2 weeks.
- LeetCode sync of recent accepted solutions (manual and automatic).
- NeetCode video links, Blind 75 tags, and free alternatives for premium problems.
- Settings: streak protector, current topic, LeetCode, change password, delete account.
- Mobile layout with a bottom tab bar.

## Database migration
`20261105151822_streaks_notes_metadata` is additive (new columns plus an `Activity` table) and backfills activity
history from existing solves, so current users keep their data. `npm start` applies it automatically.
