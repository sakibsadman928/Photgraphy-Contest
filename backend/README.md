# Photography Competition Platform — Backend

Express.js + TypeScript + MongoDB API for the platform. Designed so moving from
local development to production is purely a matter of changing environment
variables — no code changes required.

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

All configuration lives in `.env` (see `.env.example` for the full list with
comments). The app validates required variables at startup and fails fast
with a clear message if one is missing — you'll never hit a confusing runtime
error from a missing config value.

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
   environment variable settings — **especially** `CLIENT_URL` (must exactly
   match your deployed frontend's origin, no trailing slash) and `NODE_ENV=production`
   (this switches cookies to `secure: true, sameSite: 'none'`, required for
   cross-origin cookies to work over HTTPS).
3. Build and start:
   ```bash
   npm run build
   npm start
   ```
4. Run the admin seed once against production data: `npm run seed:admin`.
5. Point the frontend's API base URL at this backend's deployed URL, and make
   sure its own requests use `credentials: 'include'` so the auth cookie is sent.

### Common gotcha

If login appears to succeed but the frontend immediately looks logged out,
it's almost always one of:
- `CLIENT_URL` doesn't exactly match the frontend's origin, or
- `NODE_ENV` isn't set to `production` (so cookies aren't marked `secure`/`sameSite=none`,
  and browsers silently drop them cross-origin over HTTPS), or
- the frontend's fetch/axios calls aren't sending `credentials: 'include'`.

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

## API overview

All routes are prefixed with `/api`.

**Auth** — `/auth`: register, login, logout, me, change-password, profile

**Judges** (admin) — `/judges`: create, list

**Contests** — `/contests`:
- Browsing: `GET /`, `GET /:id`, `GET /:id/leaderboard/:round`
- Admin lifecycle: `POST /`, `/:id/publish`, `/:id/close-registration`,
  `/:id/round1/{open,close,progress,publish-results,resolve-tie}`,
  `/:id/final/{open,close,progress,publish-winners,resolve-tie}`,
  `/:id/judges`, `/:id/judges/:judgeId/replace`
- Participant: `POST /:id/join`, `POST /:id/submissions/:round` (multipart, field name `photo`),
  `GET /:id/submissions/:round/mine`
- Judge: `GET /:id/submissions/:round/to-judge`

**Scores** (judge) — `POST /scores`

**Notifications** — `GET /`, `PATCH /read-all`, `PATCH /:id/read` (poll this from the frontend)

**Dashboards** — `/dashboard/participant`, `/dashboard/judge`, `/dashboard/admin`
