# Competitive War Room — Finmo

Automated competitive intelligence system for Finmo's CMO. Ingests competitor data from free web sources, classifies with LLM, auto-publishes structured intelligence outputs (Weekly Pulse, Monthly Pulse, Signal Alerts, Battlecards) to a dashboard. No human gate on publishing.

**Status:** MVP complete — full pipeline live. See `PROGRESS.md` for current state. See `ERRORS-SOLUTIONS.md` for known issues.

## Build Spec

The **MVP PRD** is the build spec — not the full-vision PRD.

| Document | Purpose |
|----------|---------|
| `prd-competitive-war-room-mvp.md` | **Build this.** Streamlined MVP spec. |
| `prd-competitive-war-room.md` | Full vision. Reference only — do not build V2 features. |

When in doubt about scope, check Section 13 (Scope Boundaries) of the MVP PRD.

## Tech Stack

- **Next.js 16.1.6** (App Router) — React 19, TypeScript 5 strict mode
- **Tailwind CSS v4** + **shadcn/ui** for UI (CSS-based config, no `tailwind.config.js`)
- **TanStack Query 5.x** for client-side data fetching
- **Prisma 7.4** ORM + `@prisma/adapter-pg` driver adapter + **PostgreSQL** (Docker locally, Neon on Vercel)
- **@anthropic-ai/sdk** — Sonnet 4.5 for synthesis/generation, Haiku 4.5 for classification
- **Cheerio 1.x** + **rss-parser 3.x** for scraping/ingestion
- **Vitest 4.x** for testing (168 tests, 21 test files)
- Deploy: **Vercel Pro** (300s timeout required)

## Architecture

Single Next.js monolith. No separate backend. API routes handle everything: dashboard reads, cron-triggered ingestion, LLM synthesis, output generation.

```
src/
├── app/              # Pages + API routes (App Router)
│   ├── api/
│   │   ├── cron/     # /ingest and /generate endpoints (Vercel cron)
│   │   ├── pulse/    # Latest pulse
│   │   ├── pulses/   # Pulse archive
│   │   ├── claims/   # Positioning claims CRUD
│   │   ├── battlecards/  # Battlecard CRUD + reframes
│   │   ├── alerts/   # Signal alerts
│   │   └── intel/    # Intelligence feed
│   ├── battlecards/  # Battlecard pages (grid + [competitor] detail)
│   ├── pulses/       # Pulse archive page
│   ├── intel/        # Intel feed page
│   └── admin/        # Reframe editing
├── lib/
│   ├── db.ts         # Prisma singleton
│   ├── config/       # thresholds.ts — alert, output, schedule, ingestion config
│   ├── hooks/        # TanStack Query hooks (use-claims, use-battlecards, etc.)
│   ├── llm/
│   │   ├── provider.ts   # LLMProvider interface (synthesize, classify, classifyStructured, generateStructured)
│   │   ├── claude.ts     # Claude implementation (Sonnet + Haiku)
│   │   ├── prompts/      # LLM prompt templates (classify-intel, claim-assessment, monthly-pulse)
│   │   └── context/      # finmo-context.ts — company context injected into prompts
│   ├── phantombuster/ # PhantomBuster API client (for LinkedIn adapter)
│   ├── ingestion/    # Scraping adapters (website, rss, changelog, status-page, linkedin) + diff engine + runner
│   ├── synthesis/    # Evidence tiers, alert eval, claim assessment, validators
│   └── generators/   # Output generators (weekly-pulse, monthly-pulse, signal-alert, battlecard)
├── components/       # UI (ui/, pulse/, battlecard/, shared/)
├── generated/prisma/ # Prisma client output (types import from here, NOT @prisma/client)
└── types/            # Shared TypeScript types (content schemas, API response types)

prisma/
├── schema.prisma     # Database schema
├── seed.ts           # Seed competitors, sources, claims, battlecards
└── *.ts              # Utility scripts (cleanup-simulated, reset-generate, fix-rss-sources, etc.)
```

## Commands

```bash
# Dev
npm run dev                    # localhost:3000
npm run build                  # Production build
npm run lint                   # ESLint
npm run format                 # Prettier
npm run type-check             # tsc --noEmit

# Tests
npm test                       # Vitest (all 168 tests)
npm run test:watch             # Vitest watch mode
npm run test:smoke             # Seed -> ingest -> generate -> validate

# Database
npx prisma studio              # Visual DB browser
npx prisma db push             # Push schema changes
npx prisma db seed             # Seed competitors, sources, claims, test data

# Pipeline triggers (local dev)
curl -X POST http://localhost:3000/api/cron/ingest -H "Authorization: Bearer warroom-local-dev"
curl -X POST "http://localhost:3000/api/cron/generate?force=true" -H "Authorization: Bearer warroom-local-dev"

# Utility scripts
npx tsx -r dotenv/config prisma/cleanup-simulated.ts              # Delete all simulated data
npx tsx -r dotenv/config prisma/reset-generate.ts                 # Clear generated outputs, reset alert flags
npx tsx -r dotenv/config prisma/cleanup-first-run-hallucinations.ts  # Clean hallucinated baseline items
npx tsx -r dotenv/config prisma/resolve-existing-urls.ts          # Resolve Google News URLs to publisher URLs
npx tsx -r dotenv/config prisma/backfill-fingerprints.ts          # Regenerate eventFingerprint for all items
npx tsx -r dotenv/config prisma/dedup-existing.ts                 # Remove duplicate items by fingerprint
```

## Migration Scripts

Prisma utility scripts live in `prisma/*.ts`. All follow the same boilerplate:

```typescript
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() { /* ... */ }
main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
```

Run: `npx tsx -r dotenv/config prisma/script-name.ts`

**Never use inline `tsx -e "..."` with Prisma** — Windows shell escaping breaks `$disconnect()`. Always create a script file.

**Test before full migration:**
1. Test the core function on 3-5 samples in a debug script first
2. Run migration with `.take(5)` limit, verify results in DB
3. Remove `.take()` and run the full migration

A migration on buggy logic doesn't fail gracefully — it efficiently corrupts your entire dataset.

## Pipeline Architecture

**Ingestion** (`/api/cron/ingest`) — ~22s per run
1. Fetches all active DataSources in parallel (batches of 5, 15s timeout)
2. Diff-engine hashes content for change detection
3. **EVENT sources** (RSS, LinkedIn): process items directly — each item IS intelligence
4. **STATE sources** (website, changelog, status-page): first run stores baseline hash only (no items); subsequent runs classify deltas
5. Haiku 4.5 classifies changes → type, summary, finmoImplication, evidenceTier, affectedClaimIds (or `SKIP` if non-noteworthy)
6. Creates `IntelligenceItem` with `simulated: false`, links positioning claims

**Generation** (`/api/cron/generate`) — 3-5 min
1. Signal alerts: evaluates unprocessed items against alert thresholds, generates via Sonnet 4.5
2. Weekly pulse: Mondays (SGT), summarizes week's signals
3. Monthly pulse: days 1-5 (SGT), strategic analysis
4. Use `?force=true` to bypass schedule checks

## Code Patterns

**Follow:**
- TypeScript strict mode. No `any`. No `as` casts without a comment.
- Server Components by default. `"use client"` only when needed.
- TanStack Query for all client-side fetching. No raw `fetch` in components.
- Prisma for all DB access. No raw SQL. Types from `@/generated/prisma/client` (NOT `@prisma/client`).
- Let exceptions propagate. Handle errors at API route boundaries only.
- Competitors and claims are **data** (database), never code. No `if (name === "Kyriba")`.
- Every output/claim must carry a visible evidence tier badge.
- Simulated data flagged `simulated: true` with bright `[SIMULATED]` badge everywhere.
- EVENT/STATE source distinction in ingestion — STATE sources get baseline-only first run.
- LLM classification allows `SKIP` for non-noteworthy content.
- Next.js 16 async params — dynamic routes use `React.use(params)` to unwrap the Promise.
- Tailwind v4 — uses `@import "tailwindcss"` in CSS (no `tailwind.config.js`).
- **Layout stability:** Dashboard and detail page sections ALWAYS render their container/shell (`DashboardCard`, `SectionCard`). Use ternary with empty state text, never `{data && <Section>}` to conditionally show/hide sections. The page layout grid must be identical on every load regardless of data state.
- **Null-safe content destructuring:** When extracting fields from LLM-generated JSON content (pulse sections, battlecard fields), always provide defaults: `?? null` for strings, `?? []` for arrays. Never trust that all fields exist in the JSON.
- **API completeness:** API endpoints serving dashboard pages should return ALL data the UI needs in a single response. Don't force the UI to switch between different component trees based on data type — the UI should always render one fixed layout.
- **Fixed grid columns:** Grid layouts (2-col, 3+2-col) must not use dynamic `col-span` based on data presence. Both columns always render. Empty column shows placeholder text.

**Avoid:**
- Class components
- Catching and swallowing errors
- Hardcoding competitor names or positioning claims in logic
- Generic "so what" analysis that doesn't reference Finmo positioning claims
- Publishing Inferred/Unknown claims in battlecards (validation must block this)
- Importing types from `@prisma/client` (use `@/generated/prisma/client`)
- `{condition && <Section>}` for data-dependent dashboard/detail sections — breaks layout consistency. Exception: expand/collapse UI (accordion content) where hiding is intentional user interaction.
- Binary component switches based on data type (e.g., `type === "monthly" ? <MonthlyDashboard> : <WeeklyDashboard>`) — use a single unified layout that handles all data states.
- Dynamic `col-span` or grid restructuring based on whether data exists.

## Naming

| Layer | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `evidence-tier-badge.tsx` |
| React components | PascalCase | `EvidenceTierBadge` |
| Types/interfaces | PascalCase | `WeeklyPulseContent` |
| Functions/variables | camelCase | `evaluateAlert()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PULSE_WORDS` |
| API routes | kebab-case URLs | `/api/pulse/latest` |
| DB tables | snake_case via `@@map` | `intelligence_items` |

## Git Workflow

- `main` — production (auto-deploys via Vercel)
- Feature: `feat/website-scraper` | Fix: `fix/rss-parser-timeout`
- Commits: `feat:`, `fix:`, `chore:`, `docs:` prefix convention

## Protected Files (careful review before changes)

- `prisma/schema.prisma` — schema changes affect all queries and generated types
- `prisma/seed.ts` — affects demo state
- `vercel.json` — cron schedule changes affect production
- `src/lib/llm/prompts/*.ts` — directly affect output quality (especially `classify-intel.ts`)
- `src/lib/config/thresholds.ts` — affects alert volume, ingestion behavior, schedule

## Key Domain Concepts

- **Evidence Tiers:** Confirmed (citable) / Inferred (reasonable conclusion) / Unknown (needs validation)
- **Positioning Claims (3):** Mid-market treasury+payments / AI-native MO AI / Multi-jurisdiction licensing moat
- **Competitor Tiers:** Tier 1 full monitoring (Kyriba, Airwallex) / Tier 2 subset (Trovata, Nium, HighRadius, GTreasury)
- **Source Categories:** EVENT (RSS, LinkedIn — each item is intelligence) / STATE (websites — intelligence is in the delta)
- **SKIP classification:** LLM can return `SKIP` for non-noteworthy content changes
- **Auto-publish guardrails:** Structural validation, evidence tier enforcement, Finmo specificity check, length limits, source verification, max 3 regeneration attempts

## Design Reference

Dashboard feel: **Linear meets Bloomberg terminal** — information-dense but calm. Strong typographic hierarchy, generous whitespace. Quiet weeks feel intentionally calm, not empty.

**Layout stability principle:** Every page renders the same section structure on every load. Only content inside sections changes — never which sections appear. Empty sections show calm placeholder text (italic zinc-400). "Quiet weeks feel intentionally calm, not empty" applies to missing data too.

## Doc References (fetch before you build)

Before writing code that uses these frameworks, fetch the relevant doc page first. Do NOT read all of these upfront — only when you're about to work on that layer.

| Technology | Risk | What to fetch | URL |
|-----------|------|---------------|-----|
| Next.js 16 App Router | **High** — training data skews Pages Router and older versions | Route handlers, Server Components, async params, metadata | `https://nextjs.org/docs/app` |
| Next.js API routes | **High** — `route.ts` not `pages/api/` | Route handler patterns, request/response API | `https://nextjs.org/docs/app/building-your-application/routing/route-handlers` |
| Anthropic TS SDK | **High** — newer library, API changes often | Message creation, structured output | `https://docs.anthropic.com/en/docs/build-with-claude/overview` |
| Prisma 7 | **Medium** — v5→v7 changes (driver adapters, generated output path) | Client generation, adapter-pg setup | `https://www.prisma.io/docs` |
| shadcn/ui | **Medium** — not a normal package, CLI-based | Installation, component usage, import paths | `https://ui.shadcn.com/docs` |
| TanStack Query v5 | **Medium** — v4→v5 breaking changes | useQuery/useMutation API, query keys | `https://tanstack.com/query/latest/docs/framework/react/overview` |
| Tailwind CSS v4 | **Medium** — CSS-based config replaces JS config | `@import` syntax, no tailwind.config.js | `https://tailwindcss.com/docs` |

Lower-risk (Cheerio, Vitest) — fetch only if you hit an error.

## Local Dev Setup

```bash
# Prerequisites: Docker Desktop running
docker run -d --name warroom-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=warroom -p 5432:5432 postgres:16

# .env needs:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/warroom?schema=public"
# ANTHROPIC_API_KEY=sk-ant-...
# CRON_SECRET=warroom-local-dev
# PHANTOMBUSTER_API_KEY=  (optional — enables LinkedIn ingestion via PhantomBuster)

npx prisma db push            # Create tables
npx prisma db seed             # Seed competitors, claims, battlecards
npm run dev                    # Start on localhost:3000

# Then trigger pipeline:
curl -X POST http://localhost:3000/api/cron/ingest -H "Authorization: Bearer warroom-local-dev"
curl -X POST "http://localhost:3000/api/cron/generate?force=true" -H "Authorization: Bearer warroom-local-dev"
```

## Environment Variables

`DATABASE_URL`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `PHANTOMBUSTER_API_KEY`
