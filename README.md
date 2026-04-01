# Jellyfish Monorepo

Jellyfish = OpenClaw hosting + monitoring + skill + review platform.

## Repo Structure

```txt
apps/
  web/        # Official website (Next.js)
  dashboard/  # Admin dashboard (Next.js)
  api/        # API service (Next.js Route Handlers)
packages/
  db/         # Prisma schema + client
  types/      # Shared TypeScript types
  ui/         # Shared UI components
services/
  agent/      # Node agent
  installer/  # OpenClaw installer script
  review/     # Review engine
```

## Locked Stack

- Next.js 16.2.1
- React 19.2.4
- TypeScript 6.0.2
- Prisma 7.6.0
- PostgreSQL 15
- Redis 7
- Socket.IO 4.8.3
- Docker + Compose

## Development

```bash
npm install
npm run prisma:generate
npm run dev:api
npm run dev:dashboard
npm run dev:web
```

## Production Environment Setup

1. Copy `.env.production.example` to `.env.production`
2. Replace all placeholder secrets (`JWT_SECRET`, `JELLYFISH_ADMIN_TOKEN`, DB password, API keys)
3. Start services with docker compose:

```bash
docker compose --env-file .env.production up -d
```

Do not commit `.env.production`.

## Services and Ports

- Dashboard: `http://localhost:3000`
- Web: `http://localhost:3001`
- API: `http://localhost:3002`

## Agent

```bash
JELLYFISH_BASE_URL=http://localhost:3002 \
JELLYFISH_API_KEY=<user_api_key> \
npm run agent:dev
```

## Realtime + Skills + Review

- Realtime stream uses Socket.IO on API service (`/socket.io`).
- Socket.IO requires auth (`apiKey` or JWT token) and supports user/node rooms.
- Dashboard home page includes live event panel for node/metric/log/task/review/skill channels.
- Skills API:
  - `GET /api/skills`
  - `POST /api/skills/run`
- Dashboard `/skills` now supports:
  - select node
  - select skill
  - submit JSON args
  - inspect recent skill tasks
- Review API (`POST /api/review/run`) now invokes `openclaw run --prompt ... --json` directly.

## Security and Reliability

- API write endpoints enforce API-key based node ownership checks.
- Built-in in-memory rate limiting (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`).
- Task state machine tracks attempts/locks/timeouts and supports retries.
- Admin-protected maintenance endpoint: `POST /api/system/maintenance` with `x-admin-token`.
- Data cleanup script: `npm run cleanup:data`.

## CI and Tests

- Run tests: `npm run test`
- CI workflow runs Prisma generate, build, and tests on push/PR.