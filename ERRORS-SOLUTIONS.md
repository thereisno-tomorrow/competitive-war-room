# Errors & Solutions Log

Recurring issues and their fixes. Check here before debugging.

---

## Ingestion Pipeline

### Server hangs on `/api/cron/ingest`
**Symptom:** curl times out, entire dev server stops responding to all requests.
**Cause:** Runner processed ~18 sources sequentially, each with 30s fetch timeout. Slow/blocking competitor sites caused 10+ minute runs, blocking the single-threaded Next.js dev server.
**Fix:** Parallel batching (concurrency=5) in `runner.ts` + reduced fetch timeout from 30s to 15s in adapters. Run now completes in ~22s.
**Files:** `src/lib/ingestion/runner.ts`, `src/lib/ingestion/adapters/website.ts`, `status-page.ts`

### RSS adapter errors: "Feed not recognized as RSS 1 or 2"
**Symptom:** 4 of 18 sources fail with RSS parsing errors.
**Cause:** Seeded PRESS_RSS sources (Kyriba newsroom, Airwallex newsroom, Trovata press, GTreasury press) are HTML pages, not actual RSS/XML feeds. The `rss-parser` library can't parse HTML.
**Fix:** Kyriba, Airwallex, GTreasury have no RSS feeds — switched to `WEBSITE` type. Trovata has a real feed at `https://trovata.io/feed/` — URL updated. Applied to both seed data and live DB via `prisma/fix-rss-sources.ts`.
**Files:** `prisma/seed.ts`, `prisma/fix-rss-sources.ts`

### First-run hallucination: LLM invents events from static page content
**Symptom:** Intel feed shows fabricated events like "Trovata introduced tiered pricing" or "Kyriba launched AI cash forecasting" when these are long-standing features — not new developments.
**Root cause:** The ingestion pipeline treated all 18 source types identically. On first scrape, `previousHash` is `null`, so `hasContentChanged()` returns `true`. The full page snapshot is sent to the LLM, which hallucinated events from static content because:
1. **No baseline handling** — every first scrape generated fake intelligence items for all sources
2. **No event/state distinction** — the PRD defines two data patterns (EVENT sources like RSS where each item IS intelligence, STATE sources like product pages where intelligence is in the DELTA) but code didn't distinguish them
3. **LLM had no skip option** — classification prompt forced a classification even for non-noteworthy content
4. **No context framing** — prompt said "classify this intelligence signal" whether content was a press release or a pricing page snapshot
**Fix (multi-part):**
- Added `SOURCE_CATEGORIES` config mapping each `SourceType` to `EVENT` or `STATE` (`src/lib/config/thresholds.ts`)
- STATE sources on first run (null `lastContentHash`) now store hash only, produce zero IntelligenceItems (`src/lib/ingestion/runner.ts`)
- Added `"SKIP"` as valid LLM classification type (`src/lib/llm/prompts/classify-intel.ts`)
- Context-aware prompts: EVENT sources framed as "new item from RSS/changelog", STATE sources framed as "content change detected" with explicit guardrails against hallucination
**Cleanup:** `npx tsx -r dotenv/config prisma/cleanup-first-run-hallucinations.ts` — deletes non-simulated items from STATE sources and resets their hashes for clean baseline.
**Files:** `src/lib/config/thresholds.ts`, `src/lib/llm/prompts/classify-intel.ts`, `src/lib/ingestion/runner.ts`, `prisma/cleanup-first-run-hallucinations.ts`

### ECONNREFUSED on Prisma queries
**Symptom:** `PrismaClientKnownRequestError` with code `ECONNREFUSED` on any DB query.
**Cause:** Docker PostgreSQL container not running.
**Fix:** `docker start warroom-db` or create it: `docker run -d --name warroom-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=warroom -p 5432:5432 postgres:16`

---

## Generation Pipeline

### Signal alerts rejected: "Exceeds word limit: 560 > 500"
**Symptom:** `console.error` in server logs, alerts created with `validationStatus: REJECTED`, hidden from UI.
**Cause:** Sonnet 4.5 generates verbose structured output that exceeds the 500-word limit. Retries (3 max) don't help — model consistently overshoots.
**Fix:** Bumped limits in `src/lib/config/thresholds.ts`: alerts 500→700, weekly 500→800, monthly 1000→1500.
**Note:** These limits are checked in `src/lib/synthesis/validators.ts`. The pulses/alerts APIs filter `validationStatus: { in: ["PASSED", "REGENERATED"] }`, so rejected outputs are invisible.

### No weekly/monthly pulse generated
**Symptom:** Pulse Archive empty, home page shows "No intelligence published yet".
**Cause 1:** Schedule check — weekly pulse only on Mondays, monthly only days 1-5 (SGT timezone).
**Cause 2:** Validation rejection (see above) — pulse was generated but rejected and filtered from API.
**Fix:** Added `?force=true` query param to `/api/cron/generate` route to bypass schedule checks. Example: `curl -X POST "http://localhost:3000/api/cron/generate?force=true" -H "Authorization: Bearer warroom-local-dev"`
**Files:** `src/app/api/cron/generate/route.ts`

### Generation takes 3-5 minutes, blocks server
**Symptom:** curl times out at 2-3 min, other requests hang until generation completes.
**Cause:** Every qualifying intel item gets a Sonnet 4.5 signal alert (sequential, ~15-20s each). With 14 items and most triggering alerts, that's 11+ Sonnet calls × potential 3 retries.
**Fix (pending):** Enforce `MAX_ALERTS_PER_WEEK: 3` cap in generate route (config exists, not enforced). Switch signal alerts from Sonnet to Haiku for speed.
**Files:** `src/app/api/cron/generate/route.ts`, `src/lib/generators/signal-alert.ts`

---

## Simulated vs Real Data

### Intel feed shows fabricated signals with wrong source URLs
**Symptom:** Items like "Airwallex $499/mo Treasury tier" link to pricing page with no such tier.
**Cause:** Seed data (`prisma/seed.ts`, `prisma/seed-pulses.ts`) creates 17 simulated intel items + 3 generated outputs (1 pulse, 2 alerts) with invented content.
**Fix:** Run `npx tsx -r dotenv/config prisma/cleanup-simulated.ts` to delete all `simulated: true` items and orphaned outputs.
**Prevention:** Live ingestion creates items with `simulated: false`. The `SIMULATED` orange badge in the Intel Feed UI distinguishes seed from real data.

---

## Dev Environment

### Next.js lock file error: "Unable to acquire lock"
**Symptom:** `npm run dev` fails with lock error.
**Cause:** Previous dev server was killed without cleanup.
**Fix:** Delete the lock file: `rm -f .next/dev/lock` then restart.

### `url.parse()` deprecation warning
**Symptom:** `[DEP0169] DeprecationWarning` in server logs.
**Cause:** Node.js v24 deprecation of legacy URL parsing (used internally by Next.js/dependencies).
**Impact:** None — cosmetic warning only. Will be fixed in future Next.js versions.

---

## TypeScript

### `Property 'classifyStructured' is missing in type`
**Symptom:** Type error in generator test files after adding new method to `LLMProvider` interface.
**Cause:** Mock LLM objects in tests didn't include the new `classifyStructured` method.
**Fix:** Add `classifyStructured: vi.fn()` to all mock LLM objects in test files.
**Files affected:** `src/lib/generators/__tests__/battlecard.test.ts`, `monthly-pulse.test.ts`, `weekly-pulse.test.ts`, `signal-alert.test.ts`

### `seed-pulses.ts` TS2532 errors
**Symptom:** `Object is possibly 'undefined'` in seed-pulses.ts during `tsc --noEmit`.
**Cause:** Pre-existing strict null check issues in seed file (array indexing without null checks).
**Impact:** Seed script still runs fine via `tsx`. Only affects full type check.

---

## Data Migration & URL Resolution

### Google News URLs don't resolve to real publisher URLs
**Symptom:** Source links show `news.google.com/articles/CBMi...` or `AU_yqL...` instead of the actual publisher. Clicking may show "invalid web address."
**Cause:** Google News RSS feeds use base64-encoded article IDs in two formats:
- **CBMi... IDs** — base64 protobuf containing the publisher URL directly (field 1 varint + field 4 length-delimited URL)
- **AU_yqL... IDs** — opaque token, URL not embedded, requires Google's batchexecute API with signature/timestamp credentials
**Fix:** `resolveGoogleNewsUrl()` in `src/lib/ingestion/google-news-url.ts`. Strategy:
1. Base64 decode the protobuf (instant, no network) — works for CBMi IDs
2. For AU_yqL IDs: fetch article page HTML, extract `data-n-a-sg` (signature) and `data-n-a-ts` (timestamp) from the page, POST to `/_/DotsSplashUi/data/batchexecute` with those credentials
3. Fallback: return normalized `/articles/...` URL (JS redirect still works in browsers)
**References:** TS gist by huksley (GitHub) only handles CBMi IDs — incomplete for AU_yqL. Python decoder (SSujitX/google-news-url-decoder) has the correct two-step approach.
**Files:** `src/lib/ingestion/google-news-url.ts`, `prisma/resolve-existing-urls.ts`

### Regex captures query params when extracting URL path segments
**Symptom:** Base64 decode fails or returns garbage — article ID includes `?oc=5`.
**Cause:** Pattern like `(.+)` captures everything including `?` query params and `#` fragments.
**Fix:** Use `([^?#]+)` to stop at query/fragment boundaries.

### Migration script reports 0 updates when hundreds expected
**Symptom:** Script runs successfully, logs "0 resolved" or "0 updated" against a large dataset.
**Cause:** Prisma boilerplate is correct, but the core business function is buggy. The script iterates correctly but per-item logic silently fails.
**Prevention:** Always test the core function on 3-5 samples in a debug script before running the full migration. See CLAUDE.md "Migration Scripts" section.
