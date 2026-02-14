# Batch Classify: Replacing Per-Article Classification

## The Problem

The ingestion pipeline processes Google News RSS articles **one at a time**. Each article goes to the LLM in isolation, which generates an `eventKey` string. Different publishers framing the same event differently produce different eventKeys. We then try to reconcile these with 5+ layers of heuristic dedup (title similarity, fuzzy fingerprint matching, cross-batch dedup, existing-key injection). It's complex, fragile, and still doesn't work — the GTreasury/Ripple acquisition produced 4 different eventKeys from 4 different publishers.

## The Insight

Google News RSS is an **aggregator**. Its job is to show 5 publishers covering the same story. Processing each article independently and then trying to un-aggregate them is working against the grain.

When a human looks at 5 headlines about the same event, they instantly see it's one event. The LLM can do the same — if it sees them all at once.

## The Design

### Before (current)
```
Article 1 → LLM call → eventKey A
Article 2 → LLM call → eventKey B  (different!)
Article 3 → LLM call → eventKey C  (different!)
→ 5 layers of heuristic matching → still misses some
```

### After (batch classify)
```
[Article 1, 2, 3, 4, 5] → 1 LLM call →
  Event 1: {articles: [1,2,3,4], classification}
  Event 2: {articles: [5], classification}
```

**One LLM call per competitor per run** instead of N calls per article. Dedup is a natural byproduct of seeing all articles together, not a separate system.

### Pipeline Changes

The phased pipeline stays mostly the same. Only Phase 5 (CLASSIFY) changes:

```
Phase 1: COLLECT  — unchanged (fetch RSS items)
Phase 2: REMEMBER — unchanged (filter seen URLs)
Phase 3: TITLE DEDUP (intra-batch) — KEEP as cheap pre-filter (free, no LLM cost)
Phase 4: ENRICH   — unchanged (fetch full article content)
Phase 5: CLASSIFY — REWRITE to batch by competitor
Phase 6: STORE    — SIMPLIFY (exact fingerprint check only, remove fuzzy matching)
```

### What to Remove

After batch classify works, these become unnecessary:
- `fuzzyFingerprintMatch()` in `event-fingerprint.ts` (and its tests)
- Cross-batch title dedup (Phase 3.5) in `runner.ts`
- `existingEventKeys` injection in `classify-intel.ts` prompt
- `getExistingEventKeys()` method in `runner.ts`
- `crossBatchTitleDedup()` method in `runner.ts`
- `titleDedupCrossBatchSkipped` stat
- Fuzzy fingerprint matching in `storeItems()` and `processStateSource()`

**Keep:**
- `generateEventFingerprint()` — still needed for the eventKey → fingerprint normalization
- Exact fingerprint match at store time — cheap safety net, zero cost
- Intra-batch title dedup (Phase 3) — free pre-filter, reduces LLM token usage
- URL memory (SeenArticle) — prevents reprocessing old articles across runs

### New Batch Classification Prompt

The current prompt classifies ONE article. The new prompt receives ALL articles for a competitor and returns classified events.

**Input to LLM:**
```
You are classifying articles about {competitor}.

Here are {N} articles from news sources:

ARTICLE 1:
Title: "Ripple Launches New Treasury Platform Following $1B GTreasury Partnership"
Content: {enriched content or snippet}

ARTICLE 2:
Title: "Ripple Debuts Treasury Platform After $1B GTreasury Buy"
Content: {enriched content or snippet}

...

EXISTING EVENTS (already tracked — do not duplicate):
- "ripple-gtreasury-acquisition" — Ripple acquired GTreasury for $1B

TASK: Group these articles by real-world event. Multiple articles about
the same event should be grouped together. Return one classification per
distinct event.
```

**Output from LLM:**
```json
{
  "events": [
    {
      "articleIndices": [0, 1, 2, 3],
      "eventKey": "ripple-gtreasury-acquisition",
      "type": "PARTNERSHIP",
      "summary": "Ripple launched treasury platform following $1B GTreasury acquisition",
      "finmoImplication": "...",
      "evidenceTier": "CONFIRMED",
      "affectedClaimIds": [],
      "bestSourceUrl": "https://coinmarketcap.com/...",
      "publishedAt": "2026-02-10"
    },
    {
      "articleIndices": [4],
      "eventKey": "gtreasury-solvexia-acquisition",
      "type": "PARTNERSHIP",
      ...
    }
  ]
}
```

### Cross-Run Dedup

Batch classify solves **intra-run** dedup perfectly (all articles from this run are visible together). For **cross-run** dedup (this week's article about an event we already tracked last week), we keep:

1. **URL memory (SeenArticle)** — most articles won't even reach classification
2. **Existing events in prompt** — the `EXISTING EVENTS` section above tells the LLM about already-tracked events. If a new article matches, the LLM returns `SKIP` for that cluster
3. **Exact fingerprint match at store** — final safety net, zero cost

This is much simpler than the current approach. The `EXISTING EVENTS` section is the only "dedup" logic, and it's just a prompt section — no code complexity.

### Token Budget

Typical run per competitor:
- 5-15 articles × ~200 words (snippet) or ~1000 words (enriched) = 1,000-15,000 words
- Plus prompt template + existing events context ≈ 500 words
- Total: ~2,000-16,000 words per competitor = well within Sonnet's context

With 6-8 competitors, that's 6-8 LLM calls per ingestion run (vs potentially 50+ today).

### Cost Impact

Current: $0.01 per article × N articles = variable
After: $0.01-0.03 per competitor × 6-8 competitors = $0.06-0.24 per run (predictable)

Likely cheaper overall since fewer calls, and batched content reuses the prompt/context tokens.

### Key Files

| File | Change |
|------|--------|
| `src/lib/llm/prompts/classify-intel.ts` | New `buildBatchClassifyPrompt()` function, keep existing for STATE sources |
| `src/lib/ingestion/runner.ts` | Rewrite `classifyItems()` to batch by competitor, simplify `storeItems()` |
| `src/lib/ingestion/event-fingerprint.ts` | Remove `fuzzyFingerprintMatch`, keep `generateEventFingerprint` |
| `src/lib/config/thresholds.ts` | Remove `TITLE_SIMILARITY_THRESHOLD_CROSS_BATCH` |
| `src/lib/ingestion/__tests__/event-fingerprint.test.ts` | Remove fuzzy match tests |

### What NOT to Change

- **STATE source processing** (`processStateSources`) — these aren't RSS aggregator articles, they're page snapshots. Per-source classification is correct for them.
- **Generation pipeline** (weekly pulse, monthly pulse, signal alerts) — downstream, unaffected.
- **Database schema** — no changes needed. `eventFingerprint` field stays as-is.
- **Adapters** (RSS, HTML page, LinkedIn) — collection layer is fine.
- **Article fetcher / enrichment** — still valuable, better content = better classification.

### Rollback Safety

The per-article `classifyStructured` path can be kept as a fallback (e.g., if a competitor has only 1 new article, just use the existing single-article prompt). This isn't a one-way door.
