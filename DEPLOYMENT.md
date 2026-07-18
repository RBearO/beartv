# BearTV Production Deployment

## Architecture overview

BearTV is already split into two processes:

| Piece | Role | Recommended free host |
| --- | --- | --- |
| Next.js 15 App Router | UI + Auth.js + REST API routes | **Vercel Hobby** |
| Socket.io signaling (`server/index.ts`) | Matchmaking, presence, WebRTC signaling | **Render free Web Service** |
| PostgreSQL (Prisma) | Users, roles, reports, bans, settings | **Neon** |
| Redis | Matchmaking queue + online set | **Upstash** or Render Redis |
| STUN / optional TURN | WebRTC ICE | Public STUN + optional Coturn on NAS |

This split fits the codebase: Socket.io already runs outside Next.js and holds in-memory match state (`activeMatches`). Do **not** scale the socket service to multiple instances on the free tier without sticky sessions / shared match state.

**Redis is required** for the queue and online counters. Do not skip it.

Alternative: host everything on a NAS with `docker-compose.production.yml` (see [NAS self-hosting alternative](#nas-self-hosting-alternative)).

---

## Prerequisites

- Node.js 20+ (22 recommended)
- npm
- GitHub account
- Neon, Vercel, Render, and Redis (Upstash) accounts
- Optional: Cloudflare account or Tailscale for NAS tunnels
- Optional: Coturn on a NAS for reliable WebRTC across NATs

```bash
node -v
npm -v
```

---

## Push repository to GitHub

```bash
git init   # if needed
git add .
git commit -m "Prepare BearTV for production deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USER/bear.tv.git
git push -u origin main
```

Do **not** commit `.env`, `.env.production`, or real secrets.

---

## Create Neon database

1. Create a Neon project (PostgreSQL).
2. Copy the connection string with SSL, for example:

```text
postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

3. Prefer Neon’s **pooled** URL for Vercel serverless routes and the **direct** URL for migrations if Neon provides both.

---

## Configure production database

Locally (or in CI once):

```bash
cp .env.example .env
# Set DATABASE_URL to your Neon URL
npm ci
npm run db:generate
```

---

## Run Prisma migrations

On a **fresh** Neon database:

```bash
npm run db:migrate:deploy
npm run db:seed
```

`db:seed` creates interests and Rex’s admin account (`rexdancer@beartv.com`) with a temporary password that must be changed on first sign-in.

**Never run** `prisma migrate reset` against production.

If you already applied schema via `db push` locally, keep using migrate deploy only on environments that track `_prisma_migrations`.

---

## Deploy Socket.io server to Render

1. Connect the GitHub repo in Render (or use `render.yaml`).
2. Create a **Web Service**:
   - **Build command:** `npm ci && npm run db:generate`
   - **Start command:** `npm run start:socket`
   - **Health check path:** `/health`
   - **Node version:** `22` (or set `NODE_VERSION=22`)
3. Set environment variables in the Render dashboard (see [Configure environment variables](#configure-environment-variables)).
4. Confirm WebSockets are enabled (Render web services support them).

Free Render services **sleep after inactivity**. Cold starts can take 30–60+ seconds. The frontend polls `/health` with backoff and shows “Waking server…”.

---

## Deploy Next.js frontend to Vercel

1. Import the same GitHub repository into Vercel.
2. Framework preset: **Next.js**.
3. Build command: `npm run build` (default).
4. Install command: `npm ci` (or default `npm install`).
5. Set environment variables (below).
6. Deploy.

No `vercel.json` is required for the current app.

---

## Configure environment variables

### Vercel (Next.js)

| Variable | Example / notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled URL (`sslmode=require`) |
| `AUTH_SECRET` | `openssl rand -base64 32` (≥32 chars) |
| `AUTH_URL` | `https://YOUR-VERCEL-URL` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-VERCEL-URL` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://YOUR-RENDER-SOCKET-URL` |
| `ADMIN_EMAILS` | `rexdancer@beartv.com` (server-only) |
| `NEXT_PUBLIC_STUN_SERVERS` | `stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302` |
| `TURN_URL` / `TURNS_URL` | Optional Coturn URLs |
| `TURN_USERNAME` / `TURN_PASSWORD` | Server-only; served via `/api/ice` |
| `METERED_DOMAIN` | e.g. `yourapp.metered.live` (Open Relay / Metered) |
| `METERED_TURN_API_KEY` | Credential API key from Metered dashboard (server-only) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Server-only |
| OAuth `AUTH_GOOGLE_*` / `AUTH_GITHUB_*` | Optional |

### Render (Socket.io)

| Variable | Notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` / `SOCKET_PORT` | Render sets `PORT`; app binds `0.0.0.0` |
| `REDIS_URL` | **Required** |
| `DATABASE_URL` | Neon URL (optional for socket today; keep for future) |
| `AUTH_URL` | Same as frontend origin |
| `ALLOWED_ORIGINS` | `https://YOUR-VERCEL-URL` |
| `ADMIN_EMAILS` | Optional |

Never put database passwords, `AUTH_SECRET`, TURN passwords, or `ADMIN_EMAILS` in `NEXT_PUBLIC_*` variables.

See `.env.example` for the full template.

---

## Update authentication callback URLs

Set Auth.js / OAuth provider callbacks to the production frontend:

- App URL: `https://YOUR-VERCEL-URL`
- Auth.js callback: `https://YOUR-VERCEL-URL/api/auth/callback/google` (and GitHub if used)
- Google / GitHub console: add the same authorized redirect URIs

Credentials login uses email/password against Prisma and does not need OAuth callbacks.

---

## Grant Rex administrator access

Rex’s production login (seeded):

- **Email:** `rexdancer@beartv.com`
- **Temporary password:** `rexdancer123!`
- On first sign-in he is forced to **change password** (`mustChangePassword`).

### Preferred: database role

After Rex exists in the database (seed or first registration):

```bash
npm run admin:grant -- --email=rexdancer@beartv.com
```

The script:

- Normalizes the email
- Refuses to create a user if missing
- Sets `role` to `ADMIN` only
- Is idempotent
- Writes a moderation audit log entry
- Never prints password hashes

### Bootstrap allowlist

```env
ADMIN_EMAILS=rexdancer@beartv.com
```

On sign-in / JWT refresh, allowlisted emails are promoted to `ADMIN` in the database. Long-term authorization uses the DB `role` field (`USER` | `MODERATOR` | `ADMIN`). Admin APIs check the server-side role; hiding the Admin nav is not sufficient.

Rex should sign out and back in after a grant so the JWT refreshes (role is refreshed from the DB about every 30 seconds).

---

## Configure STUN/TURN

1. STUN (default public Google STUN) works for many same-network / easy-NAT cases.
2. **Cross-network video usually needs TURN.** Prefer Metered Open Relay free tier (API key required — no secrets in git):

```env
METERED_DOMAIN=yourapp.metered.live
METERED_TURN_API_KEY=REPLACE_WITH_DASHBOARD_KEY
```

   Sign up: https://www.metered.ca/tools/openrelay/ — free tier includes limited monthly relay bandwidth. Paid Metered or self-hosted Coturn is required for production-scale traffic.

3. Or run Coturn (e.g. on your NAS) and set:

```env
TURN_URL=turn:YOUR-TURN-HOST:3478
TURNS_URL=turns:YOUR-TURN-HOST:5349
TURN_USERNAME=REPLACE_ME
TURN_PASSWORD=REPLACE_ME
```

4. Authenticated clients fetch ICE servers from `GET /api/ice` (TURN credentials stay server-side). Confirm `turnConfigured: true` in the JSON response while signed in.

**Warning:** Without a working TURN server, peers on different NATs/mobile carriers often get matchmaking "Connected" with black/silent video. That is expected with STUN-only.

---

## Test WebRTC between two different networks

1. User A on home Wi‑Fi, User B on mobile data (or a second network).
2. Both sign in, accept terms/CAPTCHA, allow camera/mic.
3. Start chatting and confirm remote video/audio.
4. If it fails with STUN only, enable TURN and retest via `/api/ice`.

---

## Test mobile camera and microphone

1. Open the HTTPS frontend on iOS Safari / Android Chrome.
2. Grant camera and microphone permissions.
3. Confirm device dropdowns switch cameras/mics.
4. Verify layout on a narrow viewport.

---

## Test admin authorization

1. Sign in as a normal user → `/admin` redirects away; admin APIs return `403`.
2. Before granting ADMIN, Rex (if still `USER`) cannot access admin APIs.
3. After seed / `admin:grant` / `ADMIN_EMAILS`, Rex can open `/admin` and load stats/reports.
4. Confirm moderation actions write logs.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| “Waking server…” forever | Render asleep / Redis down | Check Render logs, `REDIS_URL`, `/health` |
| CORS errors on socket | Origin mismatch | Set `ALLOWED_ORIGINS` to exact Vercel URL |
| Auth redirect loop | Wrong `AUTH_URL` | Match production HTTPS URL; `AUTH_TRUST_HOST=true` |
| DB errors on Vercel | Missing SSL / wrong URL | Use Neon URL with `sslmode=require` |
| Migration failure | Incomplete history / wrong DB | Use `db:migrate:deploy` on fresh Neon; never `migrate reset` |
| No video across networks | No TURN | Configure Coturn + `TURN_*` |
| Duplicate queue entries | Stale sockets | Socket server removes on disconnect; restart Redis if corrupted |

---

## Free-tier limitations

- **Render free:** sleeps after inactivity; cold starts; single instance; no multi-region HA.
- **Vercel Hobby:** serverless timeouts/limits; fine for Next routes, not for Socket.io.
- **Neon free:** storage/compute caps; suspends inactive projects.
- **Upstash free:** command/bandwidth limits.
- **In-memory matches:** lost on socket restart; not multi-instance safe.
- **TURN on NAS:** home upload bandwidth limits relayed A/V.

---

## Moving to paid hosting later

1. Keep Vercel for Next.js or move to a larger Node host.
2. Upgrade Render (or Railway/Fly) so the socket service stays warm and can scale with shared Redis + sticky sessions.
3. Move Coturn to a VPS closer to users if NAS bandwidth becomes the bottleneck.
4. Add monitoring (uptime, Redis, DB connections) and automated Neon backups.

---

## NAS self-hosting alternative

Use Docker Compose on your NAS for a free always-on stack:

```bash
cp .env.production.example .env.production
# Fill secrets — never commit this file
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
```

Services: `web` (Next standalone), `socket`, `postgres`, `redis`. Optional Coturn: `--profile turn`.

### Security rules

- Do **not** port-forward the NAS admin UI, PostgreSQL, Redis, or the Docker socket.
- Expose **only** BearTV HTTP (and TURN ports if you intentionally run Coturn publicly) through a tunnel.

### No-domain HTTPS options

**Cloudflare Quick Tunnel** (temporary random HTTPS URL; may change on restart — good for testing):

```bash
cloudflared tunnel --url http://localhost:3000
```

Point a second tunnel or path strategy at the socket port if the UI and socket need separate public hostnames, then set `NEXT_PUBLIC_SOCKET_URL` / `ALLOWED_ORIGINS` accordingly. For a single hostname, put a reverse proxy in front of both services.

**Tailscale Funnel** (generated HTTPS hostname; currently beta — prefer friends/testing first):

```bash
tailscale funnel 3000
```

For your first test, invite only Rex over the NAS tunnel. For a wider public launch, Vercel + Render + Neon is usually easier; Coturn can stay on the NAS until traffic grows.

---

## Backup and restore procedure

### Neon

- Use Neon’s built-in backup / point-in-time recovery for the project.
- Optionally export:

```bash
pg_dump "$DATABASE_URL" -Fc -f beartv-$(date +%Y%m%d).dump
```

Restore:

```bash
pg_restore --clean --if-exists -d "$DATABASE_URL" beartv-YYYYMMDD.dump
```

### Docker / NAS Postgres

```bash
docker compose -f docker-compose.production.yml --env-file .env.production exec postgres \
  pg_dump -U beartv beartv -Fc > backup.dump
```

Schedule this with cron / NAS task scheduler. Keep backups off the NAS when possible.

---

## Production scripts reference

```bash
npm run build              # Next.js production build
npm run start:web          # Next only
npm run start:socket       # Socket.io only (Render)
npm run db:generate        # prisma generate
npm run db:migrate:deploy  # prisma migrate deploy
npm run db:seed            # seed interests + Rex admin
npm run admin:grant -- --email=rexdancer@beartv.com
npm run lint
npm run typecheck
npm test
```

---

## Production test checklist

- [ ] Public frontend loads over HTTPS
- [ ] Camera permission works
- [ ] Microphone permission works
- [ ] Device dropdowns work
- [ ] Two users on different networks can connect
- [ ] Socket.io reconnects after a temporary outage
- [ ] Next works
- [ ] Stop works
- [ ] Reports work
- [ ] Chat works
- [ ] Settings persist
- [ ] Admin pages reject normal users
- [ ] Rex can access admin after role grant
- [ ] Rex cannot access admin before role grant
- [ ] Database migrations work
- [ ] No development URLs remain in production env
- [ ] No secrets appear in browser source
- [ ] CORS rejects unknown origins
- [ ] Mobile layout works
- [ ] Service recovers after restart
- [ ] Privacy / Terms / Guidelines visible before public invite
