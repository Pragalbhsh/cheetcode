# Cheatcode frontend

React 19 + React Router 7 + Vite + Tailwind CSS 4.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run lint
```

The API URL comes from `VITE_API_URL` (see `.env.example`). Without it, dev builds use
`http://localhost:3000` and production builds use `https://cheetcode-api.onrender.com`.

| Path | Page |
|---|---|
| `/` | Landing |
| `/login`, `/register` | Auth |
| `/onboarding` | Pick a starting point and mark known topics |
| `/daily` | Today's session |
| `/review` | Revision queue |
| `/roadmap` | All 150 problems by topic |
| `/progress` | Streaks, heatmap, stats |
| `/settings` | Streak protector, topic, LeetCode sync, password, delete account |

See the main [README](../README.md) for the full setup and deployment guide.
