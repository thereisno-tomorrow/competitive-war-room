# Competitive War Room — Progress Log

## Project Overview

Competitive intelligence dashboard for Finmo (treasury/payments fintech). Monitors competitors, generates weekly/monthly intelligence pulses via AI, and provides battlecards for sales teams.

**Repo:** https://github.com/thereisno-tomorrow/competitive-war-room
**Stack:** Next.js 16.1.6, React 19, Prisma 7, TanStack Query 5, Tailwind v4, shadcn/ui, Vitest

## Current Status: MVP Complete (Phase 1-7 done)

All 39 tasks from the implementation plan are complete. The app builds, all tests pass, and it's running locally with seeded data.

### What's Working

- **Nav + Claims Strip** — Dark zinc-950 nav bar, 3 positioning claim indicators
- **Home Page** — Latest pulse with signal alerts, loading/empty/error states
- **Pulse Archive** — All/Weekly/Monthly tabs, expandable pulse entries, pagination
- **Battlecards** — Grid view + detail pages for Kyriba and Airwallex (Tier 1)
- **Intel Feed** — Bloomberg-terminal-style feed with 4 filter dropdowns, pagination
- **Admin** — Reframe editing with save/success feedback
- **API Routes** — All CRUD endpoints for pulse, claims, battlecards, intel, alerts, cron
- **Cron Endpoints** — `/api/cron/ingest` and `/api/cron/generate` (daily via Vercel cron)
- **Tests** — 164 tests passing across 20+ test files, 0 type errors, 0 lint warnings

### What Needs Attention

1. **Anthropic API credits** — The generation pipeline (`/api/cron/generate`) needs a funded API key. Currently using mock pulse data inserted via `prisma/seed-pulses.ts`. Top up at console.anthropic.com/settings/plans
2. **Vercel deployment** — Repo is pushed to GitHub. Vercel project was started but not completed (needs Postgres database + env vars). See deployment steps below.
3. **Ingestion pipeline** — `/api/cron/ingest` adapters (website, changelog, RSS, status page) exist but haven't been tested against live competitor sites

### Local Dev Setup

```bash
# Prerequisites: Docker Desktop running
docker run -d --name warroom-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=warroom -p 5432:5432 postgres:16

# .env needs:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/warroom?schema=public"
# ANTHROPIC_API_KEY=sk-ant-...
# CRON_SECRET=warroom-local-dev

npx prisma db push                           # Create tables
npx tsx -r dotenv/config prisma/seed.ts       # Seed competitors, claims, intel, battlecards
npx tsx -r dotenv/config prisma/seed-pulses.ts # Seed mock weekly pulse + signal alerts
npm run dev                                    # Start on localhost:3000
```

### Vercel Deployment (Not Yet Done)

1. Import `competitive-war-room` repo at vercel.com/new
2. Add Postgres database from Storage tab (Neon, free tier)
3. Add env vars: `ANTHROPIC_API_KEY`, `CRON_SECRET`
4. Deploy — `vercel.json` already configures daily crons

### Key Architecture Decisions

- **Prisma 7** uses `@prisma/adapter-pg` driver adapter — types import from `@/generated/prisma/client` (not `@prisma/client`)
- **Tailwind v4** uses `@import "tailwindcss"` in CSS (no tailwind.config.js)
- **Next.js 16** async params — dynamic routes use `React.use(params)` to unwrap the Promise
- **Server Components** by default, `"use client"` only when hooks are needed
- **Reframes are hero content** on battlecard pages (above the fold, placed first)
- **LLM calls** use Sonnet 4.5 for generation, Haiku 4.5 for lighter classification tasks

### Git History

```
de45639 fix: handle empty pulse state gracefully, add mock pulse seed
5093a57 chore: fix lint warnings — remove unused imports and directives
323c091 test: add smoke test for pipeline validation
5e33cee chore: add Vercel cron config for daily ingestion and generation
e332a60 feat: add admin page for battlecard reframe editing
a39abb3 feat: add intel feed page with filters
7956f4e feat: add battlecard grid and detail pages with evidence tier badges
d0cd7b8 feat: add pulse archive page with type filter
00be8b9 feat: add home page with latest pulse and signal alerts
593b166 feat: add root layout with nav and positioning claims strip
1e485c5 feat: add shared UI components (badges, indicators, nav)
239328b feat: add TanStack Query provider and data hooks
... (Phases 1-5 from earlier sessions)
```

### Files Modified This Session

- `src/lib/hooks/use-latest-pulse.ts` — Handle 404 as empty state (not error)
- `prisma/seed-pulses.ts` — Mock weekly pulse + 2 signal alerts for demo
- `.env` — Added DATABASE_URL, ANTHROPIC_API_KEY, CRON_SECRET (gitignored)

### Plan File

Full implementation plan: `docs/plans/2026-02-12-competitive-war-room-mvp.md` (39 tasks, 7 phases, all complete)
