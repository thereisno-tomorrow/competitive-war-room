# Competitive War Room

An automated competitive intelligence system for GTM teams. It monitors competitors across free web sources, classifies every signal with an LLM against a set of positioning claims, and publishes structured intelligence — Weekly Pulse, Monthly Pulse, Signal Alerts, and living Battlecards — to a dashboard on a cron. No human gate on publishing.

> **This is a demo build.** Finmo and the competitors it tracks are real public companies, chosen so the system exercises realistic data instead of lorem ipsum. The positioning claims, competitor tiers, and threat assessments in the seed data are **my own inference from public sources** — not internal company material, and not affiliated with or endorsed by any company named. Point it at your own claims and sources and the analysis is entirely different.
>
> **Superseded by [competitive-intel-engine](https://github.com/thereisno-tomorrow/competitive-intel-engine)** — the same product rebuilt generic, with a formal connector contract, trust tiering, and self-maintaining battlecards. Start there. This repo is kept as the original build.

---

## The Idea

Most competitive intel tooling optimizes for *coverage* — collect everything, dump it in a feed, let a human sort it. That produces a pile of interesting-but-useless observations.

This system organizes around **positioning claims** instead. You declare what your company asserts in the market; every incoming signal is evaluated against those claims. If an article doesn't affect a claim, it's noise and gets dropped — the classifier is told this explicitly. Claims carry a live status (`HOLDING`, `UNDER_PRESSURE`, `CONTESTED`), and each competitor is linked to the specific claims it threatens.

That single decision is what keeps the output actionable: every item on the dashboard is there because it moved something you said about yourself.

## Monitor coverage *about* competitors, not their websites

The obvious ingestion design is to watch competitor product pages, blogs, and newsrooms. That fails — pages change without semantic meaning, so you get diffs instead of events.

Instead the system monitors **news coverage of competitors** via per-competitor Google News RSS. Each article arrives as a discrete event with its own URL and date, which is the shape the pipeline already wants. Direct sources (pricing pages, status pages, a competitor's own blog RSS) are kept only where they carry unique signal. 28 sources across 6 competitors: 10 RSS/web plus 18 LinkedIn via PhantomBuster.

Search filters are tuned per competitor for precision — `Trovata+treasury` because "trovata" is a common Italian word, `Nium+payments` to kill false matches, nothing at all for unambiguous names like Kyriba. Catalogued in [`data-sources.md`](data-sources.md).

## Decisions worth noting

- **Batch classification per competitor** — classifying each article individually meant ~45 LLM calls per run. Batching per competitor cut it to 5: **$0.45 → $0.04** per run, same output quality.
- **Sonnet over Haiku for classification** — Haiku was tried first and rejected. It was too aggressive with `SKIP` on nuanced relevance, silently dropping real signal. The cheaper model was the more expensive mistake.
- **Full article fetch before classification** — RSS snippets are too short to judge relevance against a positioning claim. Articles are fetched and extracted with `@mozilla/readability` + `jsdom` first.
- **Google News URL resolution** — Google News RSS returns redirect stubs rather than article URLs. Resolved with a two-step `batchexecute` call ([`google-news-url.ts`](src/lib/ingestion/google-news-url.ts)).
- **Tunable constants in one file** — caps, timeouts, and thresholds are centralized in `src/lib/config/thresholds.ts` instead of scattered as literals.

## Outputs

| Output | Cadence | What it answers |
|---|---|---|
| **Weekly Pulse** | Weekly | What moved in the landscape, and which claims it affects |
| **Monthly Pulse** | Monthly | Positioning confidence against accumulated evidence |
| **Signal Alerts** | On detection | A single high-priority event needing a response now |
| **Battlecards** | On new signal | Per-competitor cards, with reframes tracked as revisions |
| **Content Briefs / Drafts** | On demand | Marketing responses generated from the intel |

## Architecture

```
Cron (Vercel) ─┬─ 18:00  /api/cron/ingest    → fetch → extract → batch-classify → store
               └─ 18:30  /api/cron/generate  → synthesize → pulses, alerts, battlecards
                                                      │
                                             Postgres (Neon)
                                                      │
                               Next.js App Router dashboard + REST API
```

Ten Prisma models: `Competitor`, `DataSource`, `IntelligenceItem`, `PositioningClaim`, `Battlecard`, `BattlecardReframe`, `GeneratedOutput`, `ContentBrief`, `ContentDraft`, and `SeenArticle` — feed memory that dedupes across runs so the same article is never reprocessed.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 strict · Tailwind v4 + shadcn/ui · TanStack Query · Prisma 7 with `@prisma/adapter-pg` · PostgreSQL (Docker local, Neon on Vercel) · `@anthropic-ai/sdk` (Sonnet 4.5) · Vitest, 21 test files across API routes and pipeline.

## Repo Map

```
src/lib/ingestion/     fetch, extract, dedupe, classify — the pipeline
src/lib/llm/           provider config + classification prompts
src/lib/generators/    weekly-pulse, monthly-pulse, alerts
src/lib/synthesis/     battlecard + content generation
src/lib/config/        thresholds.ts — every tunable constant
src/app/api/cron/      the two scheduled entry points
prisma/                schema, seed, and operational scripts
docs/plans/            the MVP implementation plan
```

Root-level markdown is working documentation, kept deliberately: [`prd-competitive-war-room-mvp.md`](prd-competitive-war-room-mvp.md) is what was actually built, [`prd-competitive-war-room.md`](prd-competitive-war-room.md) the wider vision it was cut down from, [`data-sources.md`](data-sources.md) the source catalogue, and the `ingestion-*.md` / `batch-classify-*.md` files are the post-mortems behind the decisions above.

## Running It

```bash
npm install
cp .env.example .env        # DATABASE_URL, ANTHROPIC_API_KEY, CRON_SECRET, PHANTOMBUSTER_API_KEY
npx prisma migrate dev
npx prisma db seed          # seeds demo competitors + positioning claims
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Swap `prisma/seed.ts` for your own competitors and claims — nothing about the pipeline is specific to the demo subject.

```bash
npm test          # vitest
npm run type-check
```

## Status

MVP complete and deployed; the pipeline ran daily against live data. Known rough edges at the point work stopped: 4 `PRESS_RSS` sources are HTML pages rather than real feeds, and generation takes 3–5 minutes because signal alerts are synthesized sequentially. Both are addressed in the successor.

## License

MIT — see [LICENSE](LICENSE).

Built by [Nicholas Woo](https://nicwoo.com).
