# Competitive War Room — Finmo

Automated competitive intelligence system for Finmo's CMO. Ingests competitor data from free web sources, classifies with LLM, auto-publishes structured intelligence outputs (Weekly Pulse, Monthly Pulse, Signal Alerts, Battlecards) to a dashboard. No human gate on publishing.

**Status:** MVP complete — full pipeline live. See `PROGRESS.md` for current state. See `ERRORS-SOLUTIONS.md` for known issues.

Build from **MVP PRD** (`prd-competitive-war-room-mvp.md`). Full vision PRD is reference only — do not build V2 features. When in doubt about scope, check Section 13 (Scope Boundaries).

## Tech Stack

- **Next.js 16.1.6** (App Router) — React 19, TypeScript 5 strict mode
- **Tailwind CSS v4** + **shadcn/ui** for UI (CSS-based config, no `tailwind.config.js`)
- **TanStack Query 5.x** for client-side data fetching
- **Prisma 7.4** ORM + `@prisma/adapter-pg` driver adapter + **PostgreSQL** (Docker locally, Neon on Vercel)
- **@anthropic-ai/sdk** — Sonnet 4.5 for classification + synthesis/generation
- **Cheerio 1.x** + **rss-parser 3.x** for scraping/ingestion
- **Vitest 4.x** for testing (~200 tests, 21 test files)
- Deploy: **Vercel Pro** (300s timeout required)

## Architecture

Single Next.js monolith. No separate backend. API routes handle everything.

```
src/
├── app/
│   ├── api/
│   │   ├── cron/          # /ingest and /generate (Vercel cron)
│   │   ├── pulse/         # Latest pulse
│   │   ├── pulses/        # Pulse archive
│   │   ├── claims/        # Positioning claims CRUD
│   │   ├── battlecards/   # Battlecard CRUD + reframes
│   │   ├── alerts/        # Signal alerts
│   │   ├── intel/         # Intelligence feed
│   │   └── content/       # Content briefs + drafts
│   ├── battlecards/       # Battlecard pages (grid + [competitor] detail)
│   ├── pulses/            # Pulse archive page
│   ├── intel/             # Intel feed page
│   ├── content/           # Content briefs + drafts pages
│   └── admin/             # Reframe editing
├── lib/
│   ├── db.ts              # Prisma singleton
│   ├── auth.ts            # validateCronSecret (shared by cron routes)
│   ├── config/            # thresholds.ts — alert, output, schedule, ingestion config
│   ├── constants/         # content.ts — shared label/color maps for content engine
│   ├── hooks/             # TanStack Query hooks (use-claims, use-battlecards, etc.)
│   ├── llm/
│   │   ├── provider.ts    # LLMProvider interface (classifyStructured, generateStructured)
│   │   ├── claude.ts      # Claude implementation (Sonnet + Haiku)
│   │   ├── prompts/       # Prompt templates (classify-intel, weekly/monthly-pulse, signal-alert, content-*)
│   │   └── context/       # finmo-context.ts — company context injected into prompts
│   ├── phantombuster/     # PhantomBuster API client (LinkedIn adapter)
│   ├── ingestion/         # Adapters (html-page, rss, linkedin) + diff engine + runner
│   ├── synthesis/         # Alert evaluator, validators
│   └── generators/        # Output generators (weekly-pulse, monthly-pulse, signal-alert)
├── components/            # UI (ui/, pulse/, battlecard/, shared/)
├── generated/prisma/      # Prisma client output (types from here, NOT @prisma/client)
└── types/                 # Shared TypeScript types (content schemas, API responses)

prisma/
├── schema.prisma          # Database schema (includes SeenArticle for feed memory)
├── seed.ts                # Seed competitors, sources, claims, battlecards
├── wipe-and-reset.ts      # Full wipe: intel items, seen articles, source state
├── run-ingestion.ts       # Hit ingestion API N times (requires running dev server)
└── *.ts                   # Utility scripts: cleanup-simulated, reset-generate, backfill-fingerprints, check-sources, query-counts, query-outputs
```

## Development

```bash
# Prerequisites: Docker Desktop running
docker run -d --name warroom-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=warroom -p 5432:5432 postgres:16

# .env needs: DATABASE_URL, ANTHROPIC_API_KEY, CRON_SECRET, PHANTOMBUSTER_API_KEY (optional)

npx prisma db push             # Create tables
npx prisma db seed             # Seed competitors, claims, battlecards
npm run dev                    # localhost:3000

# Dev commands
npm run build                  # Production build
npm run lint                   # ESLint
npm run format                 # Prettier
npm run type-check             # tsc --noEmit
npm test                       # Vitest (all tests)
npm run test:watch             # Vitest watch mode

# Pipeline triggers (local dev — requires running dev server)
# Ingest new articles from all sources
curl -X POST http://localhost:3000/api/cron/ingest -H "Authorization: Bearer $CRON_SECRET"
# Generate outputs (weekly pulse, monthly pulse, signal alerts)
curl -X POST "http://localhost:3000/api/cron/generate?force=true" -H "Authorization: Bearer $CRON_SECRET"
# Generate pulse only (skip signal alerts)
curl -X POST "http://localhost:3000/api/cron/generate?force=true&pulseOnly=true" -H "Authorization: Bearer $CRON_SECRET"

# Full reset (wipe + seed + ingest + generate)
npx tsx prisma/wipe-and-reset.ts   # Wipe intel, seen articles, reset sources
npx prisma db seed                 # Re-seed
npx tsx prisma/run-ingestion.ts    # Run ingestion (requires dev server)

# Utility scripts
npx tsx -r dotenv/config prisma/cleanup-simulated.ts       # Delete simulated data
npx tsx -r dotenv/config prisma/reset-generate.ts          # Clear generated outputs
npx tsx -r dotenv/config prisma/backfill-fingerprints.ts   # Regenerate fingerprints
```

## Migration Scripts

Prisma utility scripts in `prisma/*.ts` follow the same boilerplate — copy from any existing script. Run: `npx tsx prisma/script-name.ts`

- **Never use inline `tsx -e "..."`** with Prisma — Windows shell escaping breaks `$disconnect()`. Always create a script file.
- **Test before full migration:** test on 3-5 samples first, then `.take(5)`, then full run. Buggy logic doesn't fail gracefully — it corrupts your dataset.

## Pipeline Architecture

**Ingestion** (`/api/cron/ingest`) — ~8s steady-state, ~60s with new articles
1. **FETCH** — pull RSS feeds from all EVENT sources (~385 items)
2. **REMEMBER** — check `seen_articles` table, filter to genuinely new URLs, record ALL URLs as seen. Safety cap: max 50 new items/run.
3. **TITLE DEDUP** — Jaccard similarity within batch (free, catches cross-publisher dupes)
4. **ENRICH** — fetch full article content via Readability (best-effort, Google News resolution currently broken)
5. **CLASSIFY** — Sonnet 4.5 classifies → type, summary, finmoImplication, evidenceTier, affectedClaimIds (or `SKIP`)
6. **STORE** — create `IntelligenceItem` with fingerprint dedup safety net
- **STATE sources** (website, changelog, status-page): separate loop — first run stores baseline hash only; subsequent runs classify deltas
- **Cost:** $0.00/run steady-state, $0.01 per genuinely new article

**Generation** (`/api/cron/generate`) — 3-5 min
1. Signal alerts: evaluates unprocessed items against alert thresholds, generates via Sonnet 4.5
2. Weekly pulse: Mondays (SGT), summarizes week's signals
3. Monthly pulse: days 1-5 (SGT), strategic analysis
4. Use `?force=true` to bypass schedule checks

## Code Patterns

**Follow:**
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
- Tailwind v4 — `@import "tailwindcss"` in CSS (no `tailwind.config.js`).
- Null-safe content destructuring: `?? null` for strings, `?? []` for arrays. Never trust LLM JSON has all fields.
- API endpoints return ALL data the UI needs in a single response.

**Avoid:**
- Catching and swallowing errors
- Hardcoding competitor names or positioning claims in logic
- Generic analysis that doesn't reference Finmo positioning claims
- Publishing Inferred/Unknown claims in battlecards (validation must block this)

## Naming

kebab-case files, PascalCase components/types, camelCase functions, SCREAMING_SNAKE constants, kebab-case API URLs, snake_case DB tables via `@@map`.

## Git Workflow

- `main` — production (auto-deploys via Vercel)
- Feature: `feat/website-scraper` | Fix: `fix/rss-parser-timeout`
- Commits: `feat:`, `fix:`, `chore:`, `docs:` prefix convention

## Protected Files

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

Dashboard feel: **Linear meets Bloomberg terminal** — information-dense but calm. Strong typographic hierarchy, generous whitespace.

**Layout stability:** Every page renders the same section structure on every load. Only content inside sections changes — never which sections appear. Empty sections show calm placeholder text (italic zinc-400). Use ternary with empty state text, never `{data && <Section>}`. No dynamic `col-span` or grid restructuring based on data presence. No binary component switches (`type === X ? <A> : <B>`). Quiet weeks feel intentionally calm, not empty.

## Doc References

Fetch the relevant doc page before writing code for that layer. Don't read all upfront.

| Technology | Risk | URL |
|-----------|------|-----|
| Next.js 16 (App Router, route handlers, async params) | **High** | `https://nextjs.org/docs/app` |
| Anthropic TS SDK | **High** | `https://docs.anthropic.com/en/docs/build-with-claude/overview` |
| Prisma 7 (driver adapters, generated output path) | **Medium** | `https://www.prisma.io/docs` |
| shadcn/ui | **Medium** | `https://ui.shadcn.com/docs` |
| TanStack Query v5 | **Medium** | `https://tanstack.com/query/latest/docs/framework/react/overview` |
| Tailwind CSS v4 | **Medium** | `https://tailwindcss.com/docs` |

Lower-risk (Cheerio, Vitest) — fetch only if you hit an error.
