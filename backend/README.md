# Photography Competition Platform — Backend (Single Round)

Express.js + TypeScript + MongoDB API for the platform. Designed so moving from
local development to production is purely a matter of changing environment
variables — no code changes required.

> **Note:** This backend has been simplified to a **single competitive round**
> (no Round 1 / Final split, no finalist percentage). Submissions are judged
> once, and only the top 3 ranked submissions are awarded — Winner, 2nd, 3rd.
> Tie-breaking logic (Creativity → Theme Relevance → admin resolution) is
> unchanged from the two-round design.

## Stack

- Express.js + TypeScript
- MongoDB (Mongoose)
- JWT auth via httpOnly cookie
- Cloudinary for submission/profile photos

## Local setup

```bash
npm install
cp .env.example .env   # then fill in the values (see below)
npm run seed:admin     # creates the single admin account from ADMIN_EMAIL/ADMIN_PASSWORD
npm run dev            # starts on http://localhost:5000
```

## Environment variables

All configuration lives in `.env`. The app validates required variables at
startup and fails fast with a clear message if one is missing.

| Variable | Notes |
|---|---|
| `NODE_ENV` | `development` or `production`. Controls cookie `secure`/`sameSite` behavior. |
| `PORT` | Defaults to 5000. Most hosting platforms inject this automatically. |
| `MONGO_URI` | MongoDB Atlas (or any Mongo) connection string. |
| `JWT_SECRET` | Long random string — generate with `openssl rand -base64 48`. |
| `JWT_EXPIRES_IN` / `COOKIE_MAX_AGE_DAYS` | Keep these in sync (e.g. `7d` and `7`). |
| `COOKIE_DOMAIN` | Only needed if frontend/backend share a parent domain. Leave blank otherwise. |
| `CLIENT_URL` | Exact origin of the deployed Next.js frontend — used for CORS. |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by `npm run seed:admin`. |
| `CLOUDINARY_*` | From your Cloudinary dashboard. |

## Deployment checklist

This backend is stateless (no local file storage, no sessions in memory), so
it deploys cleanly to any Node host — Render, Railway, Fly.io, a VM, etc.

1. Provision MongoDB (e.g. MongoDB Atlas) and Cloudinary accounts.
2. Set every variable from `.env.example` in your hosting platform's
   environment variable settings — **especially** `CLIENT_URL` and
   `NODE_ENV=production`.
3. Build and start:
   ```bash
   npm run build
   npm start
   ```
4. Run the admin seed once against production data: `npm run seed:admin`.
5. Point the frontend's API base URL at this backend's deployed URL, and make
   sure its own requests use `credentials: 'include'` so the auth cookie is sent.

## Project structure

```
src/
├── config/       env validation, DB connection, Cloudinary setup
├── models/       Mongoose schemas
├── middleware/   auth guard, error handler, file upload
├── services/     competitionEngine (the core business logic), notifications
├── controllers/  request handlers, grouped by resource
├── routes/       Express routers, grouped by resource
├── types/        shared TypeScript types/enums
├── scripts/      one-off scripts (admin seeding)
├── app.ts        Express app (middleware, routes, error handling)
└── server.ts     entry point (connects DB, starts listening)
```

## Contest lifecycle (single round)

```
Draft
  │  [Publish Contest]
  ▼
Registration Open
  │  [Close Registration]  → validates ≥ 5 registered, else auto-Cancelled
  ▼
Registration Closed
  │  [Open Submissions]
  ▼
Submissions Open (uploads enabled)
  │  [Close Submissions]
  ▼
Submissions Closed → Judging
  │  [Publish Results]  ← hard-blocked until every assigned judge finishes
  ▼
Completed  (backend auto-computes winner / 2nd / 3rd)
```

As before, the two deadlines (registration, submission) independently and
automatically block the underlying participant action the instant they pass,
regardless of whether the admin has clicked the matching status-transition
button yet.

### Tie-breaking (unchanged)

Only the top 3 ranked submissions are awards, so only ties at the #1/#2/#3
boundaries can block **Publish Results**:
1. Higher Creativity total wins.
2. If still tied → higher Theme Relevance total.
3. If still tied → flagged for admin manual resolution via `resolve-tie`.

## API overview

All routes are prefixed with `/api`.

**Auth** — `/auth`: register, login, logout, me, change-password, profile

**Judges** (admin) — `/judges`: create, list

**Contests** — `/contests`:
- Browsing: `GET /`, `GET /:id`, `GET /:id/leaderboard`
- Admin lifecycle: `POST /`, `/:id/publish`, `/:id/close-registration`,
  `/:id/submissions/open`, `/:id/submissions/close`, `/:id/progress`,
  `/:id/publish-results`, `/:id/resolve-tie`,
  `/:id/judges`, `/:id/judges/:judgeId/replace`, `/:id/submissions/all`
- Participant: `POST /:id/join`, `POST /:id/submissions` (multipart, field name `photo`),
  `GET /:id/submissions/mine`, `GET /:id/participation`
- Judge: `GET /:id/submissions/to-judge`

**Scores** (judge) — `POST /scores`

**Notifications** — `GET /`, `PATCH /read-all`, `PATCH /:id/read` (poll this from the frontend)

**Dashboards** — `/dashboard/participant`, `/dashboard/judge`, `/dashboard/admin`
