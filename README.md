# BearTV

A production-ready random video chat platform built with Next.js 15, WebRTC, Socket.io, and PostgreSQL.

![BearTV](public/favicon.svg)

## Features

- **Random Video Chat** — Peer-to-peer HD video/audio via WebRTC
- **Instant Matching** — Redis-powered matchmaking queue with interest scoring
- **Text Chat** — Real-time messaging with typing indicators
- **Safety** — Report, rate limiting, CAPTCHA, moderation tools
- **Filters** — Country and gender preferences, interest tag matching
- **Admin Panel** — Report review, ban management, moderation logs
- **Dark Theme** — Glassmorphism UI with Bear Brown & Gold branding
- **Mobile Friendly** — Fully responsive design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| Real-time | Socket.io, WebRTC |
| Database | PostgreSQL + Prisma ORM |
| Cache/Queue | Redis (ioredis) |
| Auth | Auth.js (NextAuth v5) |
| Anti-bot | Cloudflare Turnstile |
| TURN/STUN | Coturn (optional) |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Clone and install
git clone <repo-url> beartv
cd beartv
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Database setup
npx prisma db push
npx tsx prisma/seed.ts

# Start development (Next.js + Socket server)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default admin: `admin@beartv.com` / `admin123!`

### Docker

```bash
# Start all services
docker compose up -d

# With TURN server
docker compose --profile turn up -d
```

## Project Structure

```
beartv/
├── src/
│   ├── app/                  # Next.js App Router pages & API
│   │   ├── api/              # REST API endpoints
│   │   ├── chat/             # Video chat interface
│   │   ├── admin/            # Admin dashboard
│   │   ├── profile/          # User settings
│   │   └── login/            # Authentication
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── chat/             # Chat-specific components
│   │   ├── landing/          # Landing page sections
│   │   └── layout/           # Header, Footer
│   ├── hooks/                # useWebRTC, useSocket, useMediaDevices
│   ├── contexts/             # Theme, Session providers
│   ├── services/             # Rate limiting, spam detection, Turnstile
│   ├── lib/                  # Prisma, Redis, Auth, utilities
│   └── types/                # Shared TypeScript types
├── server/                   # Socket.io signaling server
│   ├── index.ts              # Main socket server
│   ├── matchmaking.ts        # Queue matching algorithm
│   └── redis.ts              # Redis client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data
├── coturn/                   # TURN server config
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## Environment Variables

See [`.env.example`](.env.example) for all configuration options.

Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `AUTH_SECRET` | Auth.js secret (generate with `openssl rand -base64 32`) |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret |
| `ADMIN_EMAILS` | Comma-separated admin email addresses |

## Chat Flow

1. User visits landing page → accepts Terms
2. CAPTCHA verification (Cloudflare Turnstile)
3. Camera/microphone permission request
4. Join Redis matchmaking queue
5. Matched with another user via scoring algorithm
6. WebRTC peer connection established via Socket.io signaling
7. Video chat with text messaging, skip, stop, and report controls
8. On skip → disconnect → re-enter queue

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/users` | Register new user |
| GET | `/api/users` | Get current user profile |
| POST | `/api/reports` | Submit a report |
| GET | `/api/reports` | Get user's report history |
| PATCH | `/api/reports/review` | Review report (moderator) |
| POST | `/api/bans` | Issue a ban (moderator) |
| PATCH | `/api/settings` | Update user settings |
| POST | `/api/turnstile` | Verify CAPTCHA token |
| GET | `/api/admin/stats` | Admin dashboard stats |

## Deployment

### Vercel (Frontend)

Deploy the Next.js app to Vercel. Run the Socket.io server separately on Railway or Fly.io.

```bash
vercel deploy
```

### Railway / Fly.io (Socket Server)

Deploy `server/index.ts` as a standalone Node.js service pointing to the same Redis and PostgreSQL instances.

### Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma migrate deploy  # production
```

## Security

- Rate limiting on all API endpoints
- Cloudflare Turnstile CAPTCHA before chatting
- Spam detection on text messages
- IP-based abuse prevention
- Temporary and permanent ban system
- Moderation logs for audit trail
- WebRTC peer-to-peer (no video recording)
- Auth-protected routes via middleware

## License

MIT
