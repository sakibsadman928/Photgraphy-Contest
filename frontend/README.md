# Photography Competition Platform — Frontend

Next.js (App Router, latest) + TypeScript + Tailwind CSS + Redux Toolkit
(auth + notifications only). Talks to the Express backend entirely over
REST with `credentials: 'include'` so the httpOnly auth cookie is sent.

> **Note:** This frontend targets the **single competitive round** backend
> (no Round 1 / Final split). Contests go through registration → submissions →
> judging → results, and only the top 3 submissions are awarded — Winner,
> 2nd, 3rd.

## Local setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your backend's URL
npm run dev                  # http://localhost:3000
```

The backend must be running and its `CLIENT_URL` must exactly match wherever
this app is served from (`http://localhost:3000` locally).

## Environment variables

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the deployed Express backend, including `/api`, no trailing slash. |

That's the only variable this app needs — everything else (design tokens,
route structure) is baked into the code, not configuration.

## Deployment

Deploys cleanly to Vercel, Netlify, or any Node host that supports Next.js.

1. Set `NEXT_PUBLIC_API_URL` in your hosting platform's environment variables
   to the backend's deployed URL (e.g. `https://api.yourapp.com/api`).
2. Build and start:
   ```bash
   npm run build
   npm start
   ```
3. On the backend, set `CLIENT_URL` to this app's deployed origin (exactly,
   no trailing slash) and `NODE_ENV=production`.

### Why there's no auth middleware.ts

You might expect a Next.js `middleware.ts` to redirect logged-out users away
from protected routes at the edge. This app deliberately doesn't do that:
the auth cookie is set by the **backend's** domain, not the frontend's. If
frontend and backend are deployed on unrelated domains (the normal case —
e.g. a Vercel frontend + a Render backend), the browser never sends that
cookie to the frontend server, so edge middleware would see "no cookie" for
every request and incorrectly redirect logged-in users to `/login` on every
page load.

Instead, auth state is resolved client-side: `AuthProvider` calls `/auth/me`
(a real browser fetch to the backend, which *does* correctly carry the
cookie) on mount, and `RequireRole` gates protected pages once that resolves
— with a brief loading state in between. This is the correct approach for
the cross-origin-cookie setup this project uses; only reach for edge
middleware here if you specifically deploy frontend and backend as
subdomains of one shared parent domain **and** set the backend's
`COOKIE_DOMAIN` accordingly.

## Project structure

```
src/
├── app/                  Next.js App Router pages
│   ├── page.tsx                    home
│   ├── login/, register/
│   ├── contests/                   browse, details, submit, leaderboard
│   ├── dashboard/                  participant dashboard
│   ├── profile/                    participant profile edit
│   ├── judge/                      judge dashboard, change-password, scoring screen
│   └── admin/                      dashboard, judges, contest creation & lifecycle management
├── components/           shared UI (Button, Card, StatusBadge, Nav, RequireRole, ...)
├── store/                Redux Toolkit: authSlice, notificationsSlice, store config, typed hooks
├── hooks/                useNotificationsPolling
├── lib/api.ts            fetch wrapper (credentials: 'include' on every call)
└── types/                shared TypeScript types matching the backend's domain model
```

### Routes touching a contest (single round, no `[round]` segment)

| Route | Who | Purpose |
|---|---|---|
| `/contests/:id` | everyone | Contest details, join, entry status |
| `/contests/:id/submit` | participant | One-shot photo upload |
| `/contests/:id/leaderboard` | everyone (once completed) | Final ranked results |
| `/judge/contests/:id` | judge | Blind scoring screen |
| `/admin/contests/:id` | admin | Lifecycle actions, judge progress, tie resolution |

## Design notes

- **Palette/type**: a cool "light table" theme (paper/ink/hairline + a
  safelight-red accent) for browsing and admin screens; a separate dark
  "darkroom" theme for the judge's blind-scoring screen specifically, since
  anonymous review maps naturally to a private screening-room moment.
- **State**: only `auth` and `notifications` live in Redux. Everything else
  (contests, submissions, scores, leaderboards) is fetched per-page with
  plain `fetch` and local component state — no caching library, per the
  project's deliberate simplicity tradeoff.
- **Live updates**: notifications poll every 20s. No WebSockets.
- **Tie-breaking**: unchanged from the two-round design — Creativity →
  Theme Relevance → admin manual resolution — now only ever checked at the
  1st/2nd/3rd award boundaries.
