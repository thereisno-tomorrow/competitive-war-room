# Competitive War Room — Progress Log

## Project Overview

Competitive intelligence dashboard for Finmo (treasury/payments fintech). Monitors competitors, generates weekly/monthly intelligence pulses via AI, and provides battlecards for sales teams.

**Repo:** https://github.com/thereisno-tomorrow/competitive-war-room
**Stack:** Next.js 16.1.6, React 19, Prisma 7, TanStack Query 5, Tailwind v4, shadcn/ui, Vitest

## Current Status: Full Pipeline Live

All 39 MVP tasks complete. Live ingestion + generation pipeline operational. 14 real intel items, 1 monthly pulse, and signal alerts generated from live competitor data. All simulated seed data removed.

### What's Working

- **Nav + Claims Strip** — Dark zinc-950 nav bar, 3 positioning claim indicators
- **Home Page** — Latest pulse with signal alerts, loading/empty/error states
- **Pulse Archive** — All/Weekly/Monthly tabs, expandable pulse entries, pagination
- **Battlecards** — Grid view + detail pages for Kyriba and Airwallex (Tier 1)
- **Intel Feed** — Bloomberg-terminal-style feed with 4 filter dropdowns, real signals only (no simulated)
- **Admin** — Reframe editing with save/success feedback
- **API Routes** — All CRUD endpoints for pulse, claims, battlecards, intel, alerts, cron
- **Cron Endpoints** — `/api/cron/ingest` and `/api/cron/generate` (daily via Vercel cron)
- **Live Ingestion** — Fetches competitor URLs in parallel, classifies with Haiku 4.5, writes real IntelligenceItems
- **Live Generation** — Signal alerts + weekly/monthly pulses from real data via Sonnet 4.5
- **Force Generate** — `?force=true` param on generate endpoint bypasses schedule checks
- **Tests** — 168 tests passing across 21 test files, 0 type errors

### Pipeline Summary

**Ingestion** (`/api/cron/ingest`) — ~22s per run
1. Fetches all active DataSources in parallel (batches of 5, 15s timeout)
2. Diff-engine hashes content for change detection
3. Haiku 4.5 classifies changes → type, summary, finmoImplication, evidenceTier, affectedClaimIds
4. Creates `IntelligenceItem` with `simulated: false`, links positioning claims
5. Falls back to UNKNOWN tier if LLM fails

**Generation** (`/api/cron/generate`) — 3-5 min (see known issues)
1. Signal alerts: evaluates unprocessed items against alert thresholds, generates via Sonnet 4.5
2. Weekly pulse: Mondays (SGT), summarizes week's signals
3. Monthly pulse: days 1-5 (SGT), strategic analysis

**Cost:** Ingestion ~$0.04/run (Haiku). Generation ~$0.50-1.00/run (Sonnet). $5 budget covers weeks of daily runs.

**Trigger manually:**
```bash
# Ingestion only
curl -X POST http://localhost:3000/api/cron/ingest -H "Authorization: Bearer warroom-local-dev"

# Generation (respects schedule)
curl -X POST http://localhost:3000/api/cron/generate -H "Authorization: Bearer warroom-local-dev"

# Generation (force all — bypass day-of-week/month checks)
curl -X POST "http://localhost:3000/api/cron/generate?force=true" -H "Authorization: Bearer warroom-local-dev"
```

### What Needs Attention

1. **Generation speed** — Takes 3-5 min due to sequential Sonnet calls for signal alerts. `MAX_ALERTS_PER_WEEK: 3` exists in config but isn't enforced. Switching alerts to Haiku + enforcing cap would cut to <60s.
2. **RSS adapter errors** — 4 seeded PRESS_RSS sources are HTML pages, not RSS feeds. Need real feed URLs or type change to WEBSITE.
3. **Vercel deployment** — Repo on GitHub. Needs Postgres database + env vars on Vercel.
4. **Word limits** — Bumped from original (alerts 500→700, weekly 500→800, monthly 1000→1500) because Sonnet consistently overshoots. May need further tuning.

### Local Dev Setup

```bash
# Prerequisites: Docker Desktop running
docker run -d --name warroom-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=warroom -p 5432:5432 postgres:16

# .env needs:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/warroom?schema=public"
# ANTHROPIC_API_KEY=sk-ant-...
# CRON_SECRET=warroom-local-dev

npx prisma db push                           # Create tables
npx tsx -r dotenv/config prisma/seed.ts       # Seed competitors, claims, battlecards
npm run dev                                    # Start on localhost:3000

# Then trigger ingestion + generation:
curl -X POST http://localhost:3000/api/cron/ingest -H "Authorization: Bearer warroom-local-dev"
curl -X POST "http://localhost:3000/api/cron/generate?force=true" -H "Authorization: Bearer warroom-local-dev"
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
- **LLM calls** — Sonnet 4.5 for generation (pulses/alerts), Haiku 4.5 for classification (ingestion)
- **Ingestion runner** processes sources in parallel batches of 5, 15s fetch timeout per URL
- **LLM classification fallback** — if Haiku call fails, item still created with UNKNOWN tier
- **Force generate** — `?force=true` bypasses schedule checks on generate endpoint

### Files Modified (Live Pipeline Sessions)

- `src/lib/llm/prompts/classify-intel.ts` — **New** — Classification prompt for Haiku 4.5
- `src/lib/llm/provider.ts` — Added `classifyStructured<T>()` to interface
- `src/lib/llm/claude.ts` — Implemented `classifyStructured()` using Haiku 4.5
- `src/lib/ingestion/runner.ts` — LLM classification, DB writes, parallel batching
- `src/app/api/cron/ingest/route.ts` — Passes ClaudeProvider to runner
- `src/app/api/cron/generate/route.ts` — Added `?force=true` schedule bypass
- `src/lib/config/thresholds.ts` — Bumped word limits for Sonnet output
- `src/lib/ingestion/adapters/website.ts` — Fetch timeout 30s→15s
- `src/lib/ingestion/adapters/status-page.ts` — Fetch timeout 30s→15s
- `src/lib/ingestion/__tests__/runner.test.ts` — 10 tests for new pipeline
- `src/lib/generators/__tests__/*.test.ts` — Added `classifyStructured` to mocks (4 files)
- `prisma/cleanup-simulated.ts` — **New** — Script to delete all simulated data
- `prisma/reset-generate.ts` — **New** — Script to clear generated outputs and reset alert flags
- `ERRORS-SOLUTIONS.md` — **New** — Error log with causes and fixes

### Reference Files

- `ERRORS-SOLUTIONS.md` — Known issues, causes, and fixes
- `docs/plans/2026-02-12-competitive-war-room-mvp.md` — Full implementation plan (39 tasks, 7 phases)
