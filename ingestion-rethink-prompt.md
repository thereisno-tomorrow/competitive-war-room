You're rearchitecting the ingestion pipeline for a competitive intelligence app (Next.js, Prisma, PostgreSQL, Anthropic Claude API). The current system is broken — duplicates everywhere, expensive LLM calls wasted on articles that get discarded, and the feed requires running ingestion 5+ times to populate because RSS feeds return different article slices each time.

**Read `ingestion-problem-2.md` first.** It contains a full problem definition with root causes, code references, and what was already tried.

Then read the actual implementation:
- `src/lib/ingestion/runner.ts` — the pipeline orchestrator
- `src/lib/ingestion/event-fingerprint.ts` — current dedup logic
- `src/lib/llm/prompts/classify-intel.ts` — classification prompt
- `src/lib/ingestion/adapters/rss.ts` — RSS feed adapter
- `src/lib/ingestion/article-fetcher.ts` — full article fetching
- `src/lib/config/thresholds.ts` — config values
- `prisma/schema.prisma` — data model

**Design a new ingestion architecture that solves these three problems:**

1. **Zero duplicates** — same real-world event across multiple publishers must produce exactly one IntelligenceItem, without depending on LLM consistency for dedup
2. **Cost under $0.15/run** — stop paying for Sonnet to classify articles that are duplicates or irrelevant. Move dedup and filtering before the expensive LLM call
3. **One run = full feed** — a single ingestion run should produce a complete, useful intelligence feed, not require 5 sequential runs to accumulate articles

**Desired Outcome:**

A real-time intelligence stream where each ingestion run surfaces 1-3 high-signal items per competitor — no duplicates, no junk. The feed should feel like a curated news wire: new signals appear promptly after publication, each representing a distinct real-world event. Running ingestion twice in a row should produce zero new items (unless something actually happened). Running it once after a gap should catch up fully — not require multiple sequential runs to accumulate articles.

Concretely, after a clean wipe + single ingestion run against 5 competitors with RSS feeds, the DB should have ~5-15 unique items total. A second run minutes later should add 0. A run the next day should add only genuinely new events.

**Hard requirements:**
- **Deterministic, not dependent on cleanup scripts.** Post-hoc dedup migration scripts are not acceptable as part of the architecture. The pipeline itself must prevent duplicates at ingestion time. If it creates a mess, the design is wrong.
- **Idempotent and reproducible.** Wipe + single run must always produce the same quality feed. The result should not depend on cache state, run ordering, or luck.
- **Observable.** Every ingestion run must log clearly: how many articles found, how many deduped before LLM, how many classified, how many stored, how many skipped and why. No guessing what happened.

**Constraints:**
- Minimize Prisma schema changes (small column additions OK, avoid new tables)
- Clean DB wipe is acceptable — current data is mostly duplicates
- Keep the existing adapter interface (`IngestionAdapter` with `fetch()` and `detectChanges()`)
- Sonnet for quality classification, but only on articles that actually need it
- Must still handle Google News redirect URLs, full article enrichment, and the EVENT/STATE source distinction

**Plan first.** Design the solution, explain the architecture, show me what changes where. Don't implement until I approve.
