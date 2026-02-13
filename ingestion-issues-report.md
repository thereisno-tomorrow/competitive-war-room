# Ingestion Pipeline Issues Report

## How It Started

After wiring up the full ingestion + generation pipeline and running the first live ingest against 18 competitor data sources, the Intel Feed showed confident-looking intelligence items — classified, with Finmo implications, evidence tiers, the works. But on closer inspection:

- **Wrong source URLs.** Every item linked back to the source page (e.g. `airwallex.com/us/pricing`), not the actual article or announcement. Clicking "Source" on an RSS-sourced item took you to the feed URL, not the article.
- **Wrong dates.** Every item showed the current timestamp as `detectedAt`, even for RSS articles published weeks ago. The system had no concept of publication date.
- **Fabricated events.** "Trovata introduced tiered pricing" — Trovata's pricing page has had the same tiers for months. "Kyriba launched AI cash forecasting" — long-standing feature, not a new launch. "Airwallex updated website navigation" — describing the current state of a homepage as if it were a change.

The intel feed looked populated and functional, but almost nothing in it was real.

---

## Issue 1: RSS Items Treated as a Single Blob

**What happened:** The RSS adapter fetched the entire feed XML, concatenated all items into one blob of text, and sent it to the LLM as a single "change." The LLM produced one intelligence item summarizing everything in the feed, with the feed URL as the source (not individual article URLs) and the current time as the date (not article publish dates).

**Root cause:** The RSS adapter used the same pattern as the website adapter — hash the full content, detect if it changed, emit one `DetectedChange`. But RSS feeds are fundamentally different: each `<item>` is a discrete article with its own URL, date, and content.

**Fix:** Rewrote the RSS adapter to parse individual `<item>` entries. Each item becomes its own `DetectedChange` with `url` set to the article link, `publishedAt` set to the RSS `pubDate`, and `content` set to that item's title + description. Added dedup by `sourceUrl` so re-listed old articles don't create duplicates.

---

## Issue 2: LLM Couldn't Extract URLs or Dates

**What happened:** Even after splitting RSS items, the runner discarded the adapter-provided URL and date. Every `IntelligenceItem` got `sourceUrl: source.url` (the feed/page URL) and `detectedAt: new Date()` (now).

**Root cause:** The `ClassificationResult` type had no fields for `sourceUrl` or `publishedAt`. The LLM classification prompt didn't ask for them. The runner didn't use them even when the adapter provided them.

**Fix:** Added `sourceUrl` and `publishedAt` to the classification prompt and result schema. Runner now resolves: adapter date (RSS pubDate) > LLM-extracted date > current time. Same priority chain for URLs.

---

## Issue 3: First-Run Hallucination

This was the big one.

**What happened:** On first ingest, every single source produced intelligence items. The system reported 18 sources checked, 17 changes detected, 17 items created. Every one was fabricated.

**Example:** The system scraped `trovata.io/pricing/`, saw the pricing tiers that have existed for months, and told the LLM: "Classify this intelligence signal." The LLM, forced to classify *something*, produced: "Trovata introduced tiered pricing with Starter, Growth, and Enterprise plans." Confident. Specific. CONFIRMED evidence tier. And completely made up — the LLM was describing existing page content as if it were a new event.

**Root cause (layer 1 — no baseline):** When `previousHash` is `null` (first scrape), `hasContentChanged()` returns `true`. So every first scrape of every source triggers the classification pipeline. The full page content goes to the LLM, which has no way to know this is a first observation, not a detected change.

**Root cause (layer 2 — no event/state distinction):** The PRD explicitly defines two data patterns:
- **EVENT sources** (RSS feeds, changelogs): Each item IS intelligence. A new RSS article is a real signal.
- **STATE sources** (product pages, pricing pages): Intelligence is in the DELTA between observations. The page itself is not a signal.

The code treated all 18 sources identically through a uniform scrape-hash-classify pipeline.

**Root cause (layer 3 — LLM had no escape hatch):** The classification prompt said: "Classify this intelligence. Pick the single most accurate type." The valid types were `PRODUCT_CHANGE`, `PRICING_CHANGE`, `PRESS`, etc. There was no `SKIP` option. The LLM was *forced* to classify every piece of content as something, even boilerplate.

**Root cause (layer 4 — no context framing):** The prompt gave no context about what kind of source this was. "Classify this intelligence signal" — whether the content was a discrete press release from an RSS feed (real signal) or a full snapshot of a pricing page (not a signal). The LLM had no way to calibrate its response.

**Fix (multi-part):**
1. Added `SOURCE_CATEGORIES` config mapping each `SourceType` to `EVENT` or `STATE`
2. STATE sources on first run (null `lastContentHash`) now store hash only, produce zero items — baseline captured
3. Added `SKIP` as a valid LLM classification type
4. Context-aware prompts: EVENT sources framed as "new item from RSS feed", STATE sources framed as "content change detected on this page" with explicit guardrails:
   - "Do NOT describe the current state of the page as if it were a new event"
   - "Do NOT treat long-standing features as new developments"
   - "If you cannot identify a specific, recent change, use type SKIP"

---

## Issue 4: CHANGELOG Sources Misclassified as EVENT

**What happened:** After fixing the STATE/EVENT distinction and cleaning up hallucinated items from WEBSITE and STATUS_PAGE sources, 4 items remained in the feed — all from CHANGELOG sources. "HighRadius launched FreedaGPT" (from their What's New page). "Airwallex updated website navigation" (from their blog listing). "Kyriba API changelog page failed to load" (the system created an intelligence item about a page *failing to load*).

**Root cause:** CHANGELOG was classified as EVENT in the source categories config, based on the PRD's description: "changelog entries are discrete events." But the CHANGELOG adapter doesn't parse individual entries. It does the exact same thing as the WEBSITE adapter — fetches the full page, hashes it, emits one blob-level `DetectedChange`. It's a STATE source pretending to be EVENT.

The only true EVENT source is PRESS_RSS, because the RSS adapter actually parses individual `<item>` elements with their own URLs and dates. Everything else — WEBSITE, CHANGELOG, STATUS_PAGE — uses hash-based blob detection.

**Fix:** Reclassified CHANGELOG as STATE. Ran cleanup to delete the 4 hallucinated CHANGELOG items and reset their hashes.

---

## Issue 5: Source Selection Doesn't Match the Architecture

After all fixes, the system works correctly: baselines stored, no hallucinations, guardrails in place. But the intel feed is empty because the source selection was optimistic.

An audit of all 18 sources revealed:

| Category | Count | Examples |
|----------|-------|---------|
| Working EVENT (RSS with per-item parsing) | 1 | Trovata RSS feed |
| High-value STATE (pricing, status pages) | 3 | Airwallex pricing, Trovata pricing, Nium status |
| High-value but weak adapter | 3 | Nium changelog, HighRadius what's-new, Kyriba API changelog (403s) |
| Wrong approach (listing pages need RSS) | 4 | Kyriba blog, Airwallex newsroom, Airwallex blog, GTreasury press |
| Low-signal (product/home pages) | 7 | Various product pages and homepages |

**1 of 18 sources can reliably produce intelligence today.** The 3 pricing/status pages will produce real signals when competitors actually change their pricing or have outages — but that's inherently infrequent. The 4 listing pages (blogs, newsrooms) need RSS feeds or per-article link extraction to be useful — right now they detect "the page changed" but can't isolate what's new.

---

## What's Fixed

- First-run hallucination eliminated — STATE sources baseline on first scrape
- LLM can skip non-noteworthy content
- Context-aware prompts prevent the LLM from narrating static pages as events
- RSS items parsed individually with correct URLs and dates
- Dedup prevents RSS re-listing from creating duplicate items
- Source categories documented in config with clear EVENT vs STATE distinction
- All guardrails are in `src/lib/config/thresholds.ts` alongside existing output guardrails
- Data sources rebuilt around Google News RSS feeds — now 192+ real intel items ingested (vs 1 working source previously)
- Simulated data filtered out of pulse generators
- Generation pipeline reordered: pulses first, alerts second, capped at 20
- Google News URL normalizer applied at ingestion and API layers
- Pulse generators temporarily on Haiku for cost-efficient testing

## What's Still Open

- **Google News redirect URLs are unreliable.** The normalizer strips `/rss/` but some articles still show "invalid web address" on click. Need server-side redirect resolution at ingestion time.
- **Duplicate intelligence items from same news event.** Multiple articles about the same event create multiple items. No event-level dedup exists. This is the biggest remaining data quality issue — it inflates signal counts, wastes API credits on duplicate alerts, and makes the Intel Feed repetitive.
- **Layout depends on data state.** If no monthly pulse exists in the DB, the Content Implications section vanishes and the layout appears broken. Sections should always render with empty/placeholder states.
- **Changelog adapter is just a website adapter.** Nium and HighRadius have structured changelogs with real value, but the adapter scrapes them as blobs.
- **No previous content stored for STATE sources.** Hash comparison detects "something changed" but the LLM only sees the current snapshot, not the diff.
- **Kyriba API changelog returns 403.** Dead source.
- **Pulses on Haiku for testing.** Switch back to Sonnet for production quality output.

---

## Issue 6: Simulated Data Leaking Into Pulses

**What happened:** After rebuilding data sources with Google News RSS feeds (which successfully ingested 192 real intelligence items), the generated weekly and monthly pulses contained phrases like "CONFIRMED (simulated)" and narratives sourced from mock seed data. The dashboard looked real but the analysis was contaminated.

**Root cause:** Both `weekly-pulse.ts` and `monthly-pulse.ts` queried intelligence items without filtering out simulated items. The Prisma query was `where: { detectedAt: { gte: weekStart } }` — no `simulated: false` clause. The 2 simulated seed items (Kyriba treasury OS language, Airwallex treasury tier launch) were mixed in with 192 real items. The LLM dutifully synthesized from all of them, producing narratives that blended real competitive intelligence with fabricated scenarios.

**Fix:** Added `simulated: false` to both pulse generator queries. Regenerated pulses — verified "Contains simulated: false" in output.

---

## Issue 7: Google News Source Links Broken

**What happened:** After switching data sources to Google News RSS feeds (which solved the "1 of 18 sources working" problem from Issue 5), source links in the Intel Feed show Google News redirect URLs like `news.google.com/articles/CBMi...`. Clicking them shows "Redirect notice: The page that you were on is trying to send you to an invalid web address."

**Root cause (partial):** Google News RSS feeds provide URLs in the format `news.google.com/rss/articles/CBMi...`. A normalizer was added (`src/lib/ingestion/google-news-url.ts`) that strips `/rss/` to produce `news.google.com/articles/CBMi...`. This works for *some* articles — Google redirects to the original publisher. But for others, the redirect is broken on Google's end. The normalizer is doing its job; the underlying Google News redirect is unreliable.

**Current state:** Partially fixed. The normalizer is applied in both the RSS adapter (at ingestion time) and the API layer (at serve time). Some links work, some don't. There's no reliable way to resolve Google News URLs to the original article URL without actually following the redirect chain server-side.

**Possible future fix:** At ingestion time, follow the Google News redirect server-side and store the final destination URL. This would require an HTTP request per article during ingestion, adding latency and potential for timeouts.

---

## Issue 8: Duplicate Intelligence Items From Same News

**What happened:** The Intel Feed showed multiple entries for the same event — e.g., "Ripple acquired GTreasury for $1 billion" appeared 4-5 times, "Airwallex acquired Paynuri" appeared 8+ times. Each with slightly different wording but clearly the same news story.

**Root cause:** After rebuilding data sources to use Google News RSS feeds (one feed per competitor search query), the same news story gets covered by multiple publishers. Each publisher's article has a different URL. The ingestion dedup checks by `sourceUrl + competitorId` — different URLs = different items. This is correct behavior at the ingestion level (they ARE different articles), but the signal alert generator then creates a separate alert for each article about the same event.

The signal alert dedup only checked if an alert already existed for the *same intelligence item ID*. It had no concept of "same event, different article."

**Downstream impact:** 192 intelligence items → 100+ signal alerts attempted → sequential LLM calls → 10+ minute generation time → hit rate limits → burned through API credits → pulses couldn't generate. The duplication problem directly caused the generation bottleneck, the credit exhaustion, and the stale pulse data on the dashboard.

**Fixes applied (mitigation, not root cause):**
1. Capped signal alerts at 20 per generation run
2. Reordered generation: pulses first (30-60s), then alerts
3. Added `?pulseOnly=true` param to skip alerts entirely
4. Added try/catch per alert so failures don't crash the run
5. Cleaned up 158 duplicate alerts from the database

**Still open — needs event-level dedup.** Options:
- **Ingestion-level:** Before creating an intelligence item, check if a similar item (same competitor, similar summary, within N days) already exists. Requires fuzzy matching or LLM-based similarity.
- **Alert-level:** Before generating a signal alert, check if a recent alert for the same competitor covers the same event. Could use keyword overlap or embedding similarity.
- **Source-level:** Reduce to one Google News feed per competitor instead of multiple search queries. Fewer feeds = fewer duplicates, but also fewer signals.

---

## Issue 9: Generation Pipeline Blocks on Signal Alerts

**What happened:** Calling `/api/cron/generate?force=true` took 10+ minutes and sometimes never completed pulse generation. The endpoint would return 500 (rate limit), or the pulses would be stale because the endpoint ran out of API credits before reaching the pulse generation step.

**Root cause:** The generation route processed signal alerts first — one sequential LLM call per unprocessed item, with no cap. With 192 unprocessed items, this meant 100+ API calls before the weekly/monthly pulse generation even started. Each API call consumed ~2-3K input tokens, hitting the 50K tokens/minute rate limit within seconds, causing cascading 429 errors and retries.

**Fix:** Rewrote the generation route:
1. **Pulses generate first** — 2 LLM calls, ~30-60s total
2. **Signal alerts after** — capped at 20 per run
3. **`?pulseOnly=true`** — skip alerts entirely for instant pulse refresh
4. **Error isolation** — try/catch per alert, mark items as triggered regardless (prevents infinite retry loops)
5. **`alertTriggered` always set** — even if the alert threshold evaluation says "don't alert," the item gets marked so it's not re-evaluated on every run

---

## Files Changed

### Phase 1 (Issues 1-5)
| File | What |
|------|------|
| `src/lib/config/thresholds.ts` | SOURCE_CATEGORIES, INGESTION config |
| `src/lib/llm/prompts/classify-intel.ts` | Context-aware prompts, SKIP option |
| `src/lib/ingestion/runner.ts` | Baseline skip, SKIP handling, URL/date resolution |
| `src/lib/ingestion/adapters/rss.ts` | Per-item RSS parsing, Google News URL normalization |
| `src/lib/ingestion/adapters/base.ts` | Added `publishedAt` to DetectedChange |
| `src/lib/llm/provider.ts` | Added `classifyStructured` method |
| `src/lib/llm/claude.ts` | Structured JSON classification, bumped fast max_tokens to 4096 |
| `prisma/cleanup-first-run-hallucinations.ts` | Cleanup script |
| `ERRORS-SOLUTIONS.md` | Documented all issues and fixes |
| `data-sources.md` | Full audit of all 18 sources |

### Phase 2 (Issues 6-9, Feb 13 2026)
| File | What |
|------|------|
| `src/lib/generators/weekly-pulse.ts` | Added `simulated: false` filter, switched to Haiku |
| `src/lib/generators/monthly-pulse.ts` | Added `simulated: false` filter, switched to Haiku |
| `src/app/api/cron/generate/route.ts` | Pulses first, `?pulseOnly=true`, cap 20 alerts, error isolation |
| `src/lib/ingestion/google-news-url.ts` | Google News URL normalizer (strips `/rss/`) |
| `src/app/api/pulse/latest/route.ts` | Apply URL normalization at API layer |
| `prisma/query-outputs.ts` | Diagnostic: list all generated outputs |
| `prisma/cleanup-alerts.ts` | Wipe signal alerts, keep latest pulses, reset alertTriggered |
| `prisma/regen-pulse.ts` | Mark items as alertTriggered for fast pulse-only generation |
