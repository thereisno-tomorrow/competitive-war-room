# Prompt for New Claude Code Instance

Copy everything below the line into a new Claude Code session.

---

Read `batch-classify-design.md` in this project root. It describes a refactor to the ingestion pipeline's classification phase — switching from per-article LLM calls to batch classification per competitor.

**Context:** The current pipeline processes Google News RSS articles one at a time through the LLM. Different publishers covering the same event generate different eventKeys, causing duplicates. We built 5+ layers of heuristic dedup (fuzzy fingerprint matching, cross-batch title dedup, existing-key injection) to compensate — it's complex and still doesn't work. The fix is to classify all articles for a competitor in a single LLM call so the model naturally clusters them by event.

**Your task:** Plan and implement the batch classify refactor. Start by reading the design doc, then reading the key files to understand the current code:

1. `src/lib/ingestion/runner.ts` — the pipeline orchestrator (focus on `classifyItems`, `storeItems`, `crossBatchTitleDedup`, `getExistingEventKeys`)
2. `src/lib/llm/prompts/classify-intel.ts` — the current per-article classification prompt
3. `src/lib/ingestion/event-fingerprint.ts` — fingerprint generation + fuzzy matching to remove
4. `src/lib/config/thresholds.ts` — config constants
5. `src/lib/llm/provider.ts` and `src/lib/llm/claude.ts` — LLM interface

**Implementation priorities:**
1. Create `buildBatchClassifyPrompt()` in classify-intel.ts (new function, keep old one for STATE sources)
2. Rewrite `classifyItems()` in runner.ts to group items by competitor and call batch classify
3. Update `storeItems()` — remove fuzzy fingerprint matching, keep exact match only
4. Remove dead code: `fuzzyFingerprintMatch`, `crossBatchTitleDedup`, `getExistingEventKeys`, cross-batch title dedup phase, related stats
5. Update tests — remove fuzzy match tests, add batch classify prompt tests if appropriate
6. Run `npm test` to verify all tests pass, `npm run type-check` for zero type errors

**Important constraints:**
- Don't touch STATE source processing (`processStateSources`) — per-source classification is correct for page snapshots
- Don't change the database schema
- Don't change the LLM provider interface — use `classifyStructured<T>()` for the batch call
- Keep intra-batch title dedup (Phase 3) as a free pre-filter
- Keep URL memory (SeenArticle) unchanged
- Keep exact fingerprint match at store time as a cheap safety net
- The batch prompt output should include `articleIndices` so the runner knows which PipelineItems map to which event
- For cross-run dedup: include existing eventFingerprints + summaries in the batch prompt (similar to current existing-key injection, but as part of the batch context)
- If a competitor has only 1 article, the batch prompt still works (just 1 article in the batch)

After implementation, run `npm test` and `npm run type-check` to confirm everything passes. Clean up any temp scripts in `src/scripts/` (check-dupes.ts, check-enrichment.ts).
