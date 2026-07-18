# BearTV Installation Guide

## Local Development

### 1. Install Prerequisites

**Windows:**
```powershell
# Install Node.js 20+ from https://nodejs.org
# Install PostgreSQL from https://www.postgresql.org/download/windows/
# Install Redis via WSL or Memurai (https://www.memurai.com/)
```

**macOS:**
```bash
brew install node postgresql redis
brew services start postgresql
brew services start redis
```

**Linux:**
```bash
sudo apt update
sudo apt install nodejs npm postgresql redis-server
sudo systemctl start postgresql redis
```

### 2. Clone & Install

```bash
cd beartv
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://beartv:beartv@localhost:5432/beartv?schema=public"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="your-secret-here"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
SOCKET_PORT=3001
```

Generate AUTH_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Database Setup

```bash
# Create database
createdb beartv

# Push schema
npx prisma db push

# Seed data (interests + admin user)
npx tsx prisma/seed.ts
```

### 5. Cloudflare Turnstile (Optional for Dev)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Turnstile
2. Create a widget, copy site key and secret key
3. Add to `.env`:
   ```
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
   TURNSTILE_SECRET_KEY=your-secret-key
   ```
4. Without Turnstile configured, dev mode auto-verifies CAPTCHA

### 6. OAuth Providers (Optional)

**Google:**
1. [Google Cloud Console](https://console.cloud.google.com/) → APIs → Credentials
2. Create OAuth 2.0 Client ID
3. Add redirect: `http://localhost:3000/api/auth/callback/google`

**GitHub:**
1. GitHub Settings → Developer Settings → OAuth Apps
2. Add callback: `http://localhost:3000/api/auth/callback/github`

### 7. Start Development

```bash
npm run dev
```

This starts:
- Next.js on http://localhost:3000
- Socket.io server on http://localhost:3001

### 8. Test

1. Open http://localhost:3000
2. Register or login with `admin@beartv.com` / `admin123!`
3. Navigate to /chat
4. Accept terms → CAPTCHA → allow camera → start chatting

---

## Docker Deployment

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f app

# Run migrations inside container
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts
```

### With TURN Server

For users behind strict NAT/firewalls:

```bash
docker compose --profile turn up -d
```

Update `.env`:
```env
NEXT_PUBLIC_TURN_URL=turn:your-server-ip:3478
NEXT_PUBLIC_TURN_USERNAME=beartv
NEXT_PUBLIC_TURN_CREDENTIAL=beartv_turn_secret
```

---

## Production Deployment

### Vercel + Railway

1. **Vercel** — Deploy Next.js frontend
   ```bash
   vercel --prod
   ```
   Set environment variables in Vercel dashboard.

2. **Railway** — Deploy Socket.io server
   - Create new service from `server/index.ts`
   - Add PostgreSQL and Redis plugins
   - Set `SOCKET_PORT` and `REDIS_URL`

3. **Database** — Use Railway PostgreSQL or Supabase
   ```bash
   npx prisma migrate deploy
   ```

### Fly.io

```bash
fly launch
fly postgres create
fly redis create
fly secrets set AUTH_SECRET=xxx DATABASE_URL=xxx REDIS_URL=xxx
fly deploy
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not working | Ensure HTTPS in production; check browser permissions |
| No matches found | Verify Redis is running; check socket server logs |
| WebRTC connection fails | Configure TURN server for NAT traversal |
| Auth errors | Verify AUTH_SECRET is set; check DATABASE_URL |
| CAPTCHA fails | Verify Turnstile keys; check domain whitelist |
