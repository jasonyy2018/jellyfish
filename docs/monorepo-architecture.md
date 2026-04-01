# Jellyfish Monorepo Architecture

## Apps

- `apps/web`: official website and landing pages.
- `apps/dashboard`: operator console (nodes, tasks, logs, metrics, skills).
- `apps/api`: backend API service with Next.js Route Handlers.

## Packages

- `packages/db`: Prisma models and database client.
- `packages/types`: shared TypeScript domain types.
- `packages/ui`: shared React UI primitives.

## Services

- `services/agent`: node runtime agent.
- `services/installer`: OpenClaw install script.
- `services/review`: review scoring engine.

## Runtime Ports

- Dashboard: 3000
- Web: 3001
- API: 3002
