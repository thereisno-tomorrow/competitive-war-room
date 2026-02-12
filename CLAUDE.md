# Competitive War Room — Finmo

Automated competitive intelligence system for Finmo's CMO. Ingests competitor data from free web sources, synthesizes with LLM, auto-publishes structured intelligence outputs (Weekly Pulse, Monthly Pulse, Signal Alerts, Battlecards) to a dashboard. No human gate on publishing.

## Build Spec

The **MVP PRD** is the build spec — not the full-vision PRD.

| Document | Purpose |
|----------|---------|
| `prd-competitive-war-room-mvp.md` | **Build this.** Streamlined MVP spec. |
| `prd-competitive-war-room.md` | Full vision. Reference only — do not build V2 features. |

When in doubt about scope, check Section 13 (Scope Boundaries) of the MVP PRD.

## Tech Stack

- **Next.js 14.2+** (App Router) — TypeScript 5.4+ strict mode
- **Tailwind CSS 3.4** + **shadcn/ui** for UI
- **TanStack Query 5.x** for client-side data fetching
- **Prisma 5.x** ORM + **Vercel Postgres**
- **@anthropic-ai/sdk** — Sonnet 4.5 for synthesis, Haiku 4.5 for classification
- **Cheerio 1.x** + **rss-parser 3.x** for scraping/ingestion
- **Vitest** for testing
- Deploy: **Vercel Pro** (300s timeout required)

## Architecture

Single Next.js monolith. No separate backend. API routes handle everything: dashboard reads, cron-triggered ingestion, LLM synthesis, output generation.

```
src/
├── app/            # Pages + API routes (App Router)
├── lib/
│   ├── db.ts       # Prisma singleton
│   ├── llm/        # LLM provider interface + Claude impl + prompts/
│   ├── ingestion/  # Scraping adapters + diff engine + runner
│   ├── synthesis/  # Evidence tiers, alert eval, claim assessment, validators
│   └── generators/ # Output generators (weekly-pulse, monthly-pulse, etc.)
├── components/     # UI (ui/, pulse/, battlecard/, shared/)
└── types/          # Shared TypeScript types
```

## Commands

```bash
npm run dev                    # localhost:3000
npm run build                  # Production build
npm run lint                   # ESLint
npm run format                 # Prettier
npm run type-check             # tsc --noEmit
npm test                       # Vitest
npm run test:smoke             # Seed -> ingest -> generate -> validate
npx prisma studio              # Visual DB browser
npx prisma db push             # Push schema changes
npx prisma db seed             # Seed competitors, sources, claims, test data
```

## Code Patterns

**Follow:**
- TypeScript strict mode. No `any`. No `as` casts without a comment.
- Server Components by default. `"use client"` only when needed.
- TanStack Query for all client-side fetching. No raw `fetch` in components.
- Prisma for all DB access. No raw SQL.
- Let exceptions propagate. Handle errors at API route boundaries only.
- Competitors and claims are **data** (database), never code. No `if (name === "Kyriba")`.
- Every output/claim must carry a visible evidence tier badge.
- Simulated data flagged `simulated: true` with bright `[SIMULATED]` badge everywhere.

**Avoid:**
- Class components
- Catching and swallowing errors
- Hardcoding competitor names or positioning claims in logic
- Generic "so what" analysis that doesn't reference Finmo positioning claims
- Publishing Inferred/Unknown claims in battlecards (validation must block this)

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
- `dev` — integration branch. PRs merge here first.
- Feature: `feat/website-scraper` | Fix: `fix/rss-parser-timeout`
- Commits: `feat:`, `fix:`, `chore:` prefix convention

## Protected Files (careful review before changes)

- `prisma/schema.prisma` — schema changes affect all queries
- `prisma/seed.ts` — affects demo state
- `vercel.json` — cron schedule changes affect production
- `src/lib/llm/prompts/*.ts` — directly affect output quality
- `src/lib/config/thresholds.ts` — affects alert volume

## Key Domain Concepts

- **Evidence Tiers:** Confirmed (citable) / Inferred (reasonable conclusion) / Unknown (needs validation)
- **Positioning Claims (3):** Mid-market treasury+payments / AI-native MO AI / Multi-jurisdiction licensing moat
- **Competitor Tiers:** Tier 1 full monitoring (Kyriba, Airwallex) / Tier 2 subset (Trovata, Nium, HighRadius, GTreasury)
- **Auto-publish guardrails:** Structural validation, evidence tier enforcement, Finmo specificity check, length limits, source verification, max 3 regeneration attempts

## Design Reference

Dashboard feel: **Linear meets Bloomberg terminal** — information-dense but calm. Strong typographic hierarchy, generous whitespace. Quiet weeks feel intentionally calm, not empty.

## Doc References (fetch before you build)

Before writing code that uses these frameworks, fetch the relevant doc page first. Do NOT read all of these upfront — only when you're about to work on that layer.

| Technology | Risk | What to fetch | URL |
|-----------|------|---------------|-----|
| Next.js App Router | **High** — training data skews Pages Router | Route handlers, Server Components, metadata, layouts | `https://nextjs.org/docs/app` |
| Next.js API routes | **High** — `route.ts` not `pages/api/` | Route handler patterns, request/response API | `https://nextjs.org/docs/app/building-your-application/routing/route-handlers` |
| Anthropic TS SDK | **High** — newer library, API changes often | Message creation, structured output | `https://docs.anthropic.com/en/docs/build-with-claude/overview` |
| shadcn/ui | **Medium** — not a normal package, CLI-based | Installation, component usage, import paths | `https://ui.shadcn.com/docs` |
| TanStack Query v5 | **Medium** — v4→v5 breaking changes | useQuery/useMutation API, query keys | `https://tanstack.com/query/latest/docs/framework/react/overview` |

Lower-risk (Prisma, Tailwind, Cheerio, Vitest) — fetch only if you hit an error.

## Environment Variables

`DATABASE_URL`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`
