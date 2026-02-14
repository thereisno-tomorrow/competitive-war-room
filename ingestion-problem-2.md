# Ingestion Problem: Dedup Failures & Pipeline Reliability

**Date:** 2026-02-13
**Branch:** `feat/buyer-intelligence`
**Status:** Unsolved — needs architectural rethink

---

## Problem Statement

The ingestion pipeline reliably creates duplicate IntelligenceItems when multiple publishers cover the same real-world event. Despite three rounds of fixes across ~6 commits, duplicates still appear on every ingestion run. The dedup system is fundamentally fragile because it depends on an LLM generating identical canonical keys for the same event across different articles — and LLMs don't do that reliably.

**User impact:** The intelligence feed shows 5-10 copies of the same story (e.g., "Ripple acquires GTreasury" from 7 publishers), making the dashboard unusable. Each cleanup-and-re-ingest cycle costs real money in API calls and produces the same result.

---

## How the Pipeline Works Today

```
RSS Feed → Parse Items → Fetch Full Article → LLM Classify → Dedup Check → Store
                                   ↓
                         Returns: type, summary,
                         finmoImplication, eventKey,
                         sourceUrl, publishedAt
```

### Dedup has two layers:

1. **URL dedup** (lines 214-224 of runner.ts): Skip if `sourceUrl + competitorId` already exists. Works for exact same article re-appearing in RSS.

2. **Event fingerprint dedup** (lines 226-238 of runner.ts): Generate fingerprint from LLM's `eventKey`, check if `eventFingerprint + competitorId` exists. Supposed to catch same event from different publishers.

### The eventKey approach:
- The LLM classification prompt asks for a normalized key like `nium-c-suite-hires`
- `generateEventFingerprint()` normalizes it (lowercase, strip dates, collapse whitespace)
- If no eventKey, falls back to SHA-256 of first 5 significant words from summary

---

## Root Causes (Three Layers)

### 1. LLM Inconsistency (~10-15% failure rate)

The core assumption — that Sonnet will generate identical eventKeys for the same event across different articles — is wrong. Observed failures:

| Article A eventKey | Article B eventKey | Same event? |
|---|---|---|
| `ripple-gtreasury-acquisition` | `ripple-gtreasury-acquisition-billion` | Yes |
| `ripple-gtreasury-acquisition` | `ripple-gtreasury-partnership` | Yes |
| `nium-visa-stablecoin-settlement-pilot` | `visa-nium-stablecoin-pilot` | Yes |
| `nium-australia-instant-payment-expansion` | `nium-australia-realtime-payout-expansion` | Yes |
| `gtreasury-ripple-treasury-launch` | `ripple-gtreasury-acquisition-treasury-platform` | Yes |

Even with explicit prompt instructions ("must be IDENTICAL across articles about the same event"), the LLM varies:
- Company name ordering (`nium-visa` vs `visa-nium`)
- Verb normalization (`expansion` vs `payout-expansion`)
- Level of detail (`acquisition` vs `acquisition-billion`)
- Event framing (`partnership` vs `acquisition`)

**This is inherent to LLMs.** No amount of prompt engineering will make this 100% consistent.

### 2. 7-Day Window Bug (FIXED but unverified)

The original dedup check had a `detectedAt >= 7 days ago` filter. But `detectedAt` stores the article's *publication date* (e.g., Oct 2025 for Ripple/GTreasury). When checking in Feb 2026, the window query found nothing because all existing items were "too old." Every article was treated as new.

**Fix applied in commit `427a78d`:** Removed the time window entirely. Fingerprint + competitor is now the only check.

**Status:** Fix is in source code but was never verified working in a live ingestion run. The `.next` cache was serving stale compiled code during testing.

### 3. LLM Cost on Every Article (Design Issue)

The LLM classification call happens *before* the dedup check. This means:
- Article A about "Ripple acquires GTreasury" → Sonnet call ($0.01) → stored with fingerprint `ripple-gtreasury-acquisition`
- Article B about same event → Sonnet call ($0.01) → generates `ripple-gtreasury-acquisition` → dedup catches it → discarded
- Article C about same event → Sonnet call ($0.01) → generates `ripple-gtreasury-partnership` (LLM inconsistency) → dedup misses → **duplicate stored**

**You pay for every article regardless of whether it's a duplicate.** And when the LLM generates a variant key, you get a duplicate AND wasted money.

---

## What Was Tried

### Attempt 1: LLM eventKey in classification prompt (commit `08dc3aa`)
- Added `eventKey` field to `ClassificationResult`
- Prompt includes examples and format rules
- `generateEventFingerprint()` uses eventKey directly instead of SHA-256 word hash
- **Result:** Reduced duplicates but didn't eliminate them. LLM still generates variants.

### Attempt 2: Date stripping normalization
- Regex strips trailing `-2026-02` or `-2026` from eventKeys
- Prompt updated to say "NO dates"
- **Result:** Helped with date-suffixed variants, but company ordering and verb variations remain.

### Attempt 3: Remove 7-day window (commit `427a78d`)
- Removed `detectedAt: { gte: windowStart }` from fingerprint query
- **Result:** Not verified. Next.js cache was serving old code during test runs.

### Attempt 4: Manual merge map scripts (`fe4f06b`)
- `dedup-existing.ts`: Uses Haiku to re-generate eventKeys, then dedup
- `dedup-near-matches.ts`: Hardcoded map of known variant → canonical pairs
- **Result:** Cleaned existing data (69 → 38 items) but doesn't prevent future duplicates. Requires manual maintenance.

---

## Current State of the Code

### Key files:

| File | Role |
|---|---|
| `src/lib/ingestion/runner.ts` | Pipeline orchestrator — fetch, classify, dedup, store |
| `src/lib/ingestion/event-fingerprint.ts` | eventKey normalization + legacy SHA-256 fallback |
| `src/lib/llm/prompts/classify-intel.ts` | Classification prompt with eventKey instructions |
| `src/lib/ingestion/article-fetcher.ts` | Full article content fetching via Readability |
| `src/lib/ingestion/adapters/rss.ts` | RSS feed parsing, per-item extraction |
| `src/lib/ingestion/google-news-url.ts` | Google News redirect URL resolution |
| `src/lib/config/thresholds.ts` | Dedup config, ingestion limits |
| `prisma/schema.prisma` | `IntelligenceItem` model with `eventFingerprint` column |

### Relevant schema:
```prisma
model IntelligenceItem {
  eventFingerprint String?  @map("event_fingerprint")
  competitorId     String   @map("competitor_id")
  sourceUrl        String   @map("source_url")
  detectedAt       DateTime @map("detected_at")
  // ...
  @@index([competitorId, eventFingerprint])
}
```

### Dedup check (runner.ts lines 226-238):
```typescript
const eventFingerprint = generateEventFingerprint(classification?.eventKey, summary);
const existingByFingerprint = await prisma.intelligenceItem.findFirst({
  where: { eventFingerprint, competitorId: source.competitorId },
  select: { id: true },
});
if (existingByFingerprint) continue;
```

### LLM call ordering problem (runner.ts lines 159-238):
```
line 159: classification = await this.llm.classifyStructured(prompt)  // $$ COST HERE
line 177: if (classification?.type === "SKIP") continue               // free skip
line 214: URL dedup check                                             // free skip
line 228: eventFingerprint = generateEventFingerprint(...)             // uses LLM output
line 230: fingerprint dedup check                                     // free skip (but LLM already paid)
```

---

## Unverified Fix

The 7-day window removal (`427a78d`) has NOT been verified working because:
1. After editing runner.ts, the Next.js dev server continued serving cached old code
2. Deleted `.next/` directory to force recompile
3. Never ran a clean test cycle (wipe DB → ingest once → ingest again → verify zero new items)

**This verification is the most important next step.** If the window removal works, the dedup is functional for cases where the LLM generates consistent keys (~85-90% of the time). The remaining ~10-15% variant keys are a separate problem.

---

## Possible Approaches for a Rethink

### A. Pre-LLM URL dedup (cheap, high impact)
Move URL dedup *before* the LLM call. If the exact article URL is already in the DB, skip the $0.01 Sonnet call entirely. Currently URL dedup happens after classification.

### B. Two-pass: cheap filter → expensive classify
1. **Pass 1 (Haiku, $0.003):** Title + snippet only → SKIP/PROCESS decision + rough eventKey
2. **Pass 2 (Sonnet, $0.01):** Full article → rich classification, only for articles that passed filter AND aren't duplicates

### C. Embedding-based fuzzy dedup
Instead of exact string match on eventKey, generate embeddings for each article summary and check cosine similarity against existing items for the same competitor. Catches semantic duplicates even with different phrasing. Adds ~$0.0001/article via embedding API.

### D. Title-based dedup (no LLM needed)
Before calling the LLM, normalize the article title (lowercase, strip punctuation, remove common words) and check against existing item summaries. Won't catch all duplicates but catches the obvious ones for free.

### E. Hybrid: deterministic first, LLM second
1. URL dedup (exact match, free)
2. Title similarity dedup (fuzzy string match, free)
3. If still no match → LLM classify → eventKey dedup
4. If STILL a near-miss → flag for manual review instead of creating duplicate

### F. Post-ingest merge (accept duplicates, clean after)
Accept that some duplicates will be created. Run a periodic merge job that groups items by (competitor, similar summary) and consolidates them. Simpler pipeline, cleanup is batch and cheap.

---

## Cost Breakdown

Per ingestion run (rough estimates):
- ~30-50 RSS items fetched across all competitors
- ~20-30 pass article enrichment (full text fetch)
- ~25-40 LLM classification calls at ~$0.01 each = **$0.25-0.40/run**
- Of those, ~40-60% are duplicates that get discarded after paying for classification

Running 5 times to populate = **~$1.50-2.00** with majority wasted on duplicates.

---

## Commits Related to This Problem

```
427a78d fix: remove 7-day window from fingerprint dedup check
fe4f06b feat: add LLM-powered dedup migration scripts for existing items
08dc3aa fix: semantic event-level dedup via LLM-generated canonical event keys
2438f8c feat: full article enrichment, battlecard revamp, unified dashboard, pipeline hardening
13b6fe9 fix: prevent ingestion hallucinations with event/state source categorization
```

---

## Recommended Next Steps

1. **Verify the window fix works** — wipe DB, ingest once, ingest again, check for zero duplicates on matching eventKeys
2. **Move URL dedup before LLM call** — immediate cost savings, zero risk
3. **Decide on fuzzy dedup strategy** — embeddings vs. title similarity vs. accept-and-merge
4. **Consider Haiku for SKIP/PROCESS filter** — 4x cheaper for the 40-60% that get discarded
