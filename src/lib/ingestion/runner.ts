import type {
  IntelType,
  EvidenceTier,
  SourceType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { LLMProvider } from "@/lib/llm/provider";
import type { IngestionAdapter } from "./adapters/base";
import { hashContent } from "./diff-engine";
import {
  buildClassifyIntelPrompt,
  type ClassificationResult,
} from "@/lib/llm/prompts/classify-intel";
import { SOURCE_CATEGORIES, INGESTION } from "@/lib/config/thresholds";
import { resolveGoogleNewsUrl } from "./google-news-url";
import { generateEventFingerprint } from "./event-fingerprint";
import { fetchArticleContent } from "./article-fetcher";
import { deduplicateByTitle } from "./title-similarity";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_INTEL_TYPES: IntelType[] = [
  "PRODUCT_CHANGE", "PRICING_CHANGE", "HIRING_SIGNAL", "PARTNERSHIP",
  "REVIEW", "PRESS", "OUTAGE", "MESSAGING_SHIFT", "SEO_CHANGE", "REGULATORY",
];

const VALID_EVIDENCE_TIERS: EvidenceTier[] = ["CONFIRMED", "INFERRED", "UNKNOWN"];

const CONCURRENCY = 5;
const LLM_COST_PER_CALL = 0.01;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Internal pipeline item — enriched as it flows through phases. */
interface PipelineItem {
  title: string;
  url: string;
  snippet: string;
  pubDate?: string;
  changeType: string;
  competitorId: string;
  sourceId: string;
  sourceType: SourceType;
  competitorName: string;
  // Populated during enrichment
  enrichedContent?: string;
  resolvedUrl?: string;
  // Populated during classification
  classification?: ClassificationResult;
  eventFingerprint?: string;
}

export interface IngestionRunStats {
  sourcesChecked: number;
  itemsFetched: number;
  seenSkipped: number;
  safetyCapped: number;
  titleDedupBatchSkipped: number;
  articlesEnriched: number;
  enrichmentsFailed: number;
  llmCallsMade: number;
  llmSkipped: number;
  fingerprintDedupSkipped: number;
  itemsCreated: number;
  estimatedCostUsd: number;
  durationMs: number;
  errors: Array<{ sourceId: string; error: string }>;
}

type SourceRow = Awaited<ReturnType<typeof prisma.dataSource.findMany>>[number] & {
  competitor: { name: string };
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export class IngestionRunner {
  private adapters: Map<SourceType, IngestionAdapter>;
  private llm: LLMProvider;
  /** Hashes computed during collect phase — avoids double-fetching in updateEventSourceMeta */
  private eventSourceHashes = new Map<string, string>();

  constructor(adapters: Map<SourceType, IngestionAdapter>, llm: LLMProvider) {
    this.adapters = adapters;
    this.llm = llm;
  }

  async run(): Promise<IngestionRunStats> {
    const start = Date.now();
    const stats = this.emptyStats();

    const [sources, claims] = await Promise.all([
      prisma.dataSource.findMany({
        where: { competitor: { status: "ACTIVE" } },
        include: { competitor: true },
      }),
      prisma.positioningClaim.findMany(),
    ]);

    const eligible = sources.filter((s) => this.adapters.has(s.type));
    const eventSources = eligible.filter(
      (s) => SOURCE_CATEGORIES[s.type] === "EVENT",
    );
    const stateSources = eligible.filter(
      (s) => SOURCE_CATEGORIES[s.type] === "STATE",
    );

    stats.sourcesChecked = eligible.length;

    // ─── PHASES 1-6: EVENT SOURCES (phased pipeline) ──────────────

    // Phase 1: COLLECT — fetch all RSS items, normalize Google News URLs
    const collected = await this.collectEventItems(eventSources, stats);
    this.log("COLLECT", `${collected.length} items from ${eventSources.length} event sources`);

    // Phase 2: REMEMBER — filter against seen_articles, record all URLs
    const newItems = await this.remember(collected, stats);
    this.log("REMEMBER", `${collected.length} → ${newItems.length} new (${stats.seenSkipped} already seen, ${stats.safetyCapped} safety-capped)`);

    // Phase 3: TITLE DEDUP (intra-batch) — collapse cross-publisher dupes
    const afterBatchDedup = deduplicateByTitle(
      newItems,
      INGESTION.TITLE_SIMILARITY_THRESHOLD_BATCH,
    );
    stats.titleDedupBatchSkipped = newItems.length - afterBatchDedup.length;
    this.log("TITLE_BATCH", `${newItems.length} → ${afterBatchDedup.length} (${stats.titleDedupBatchSkipped} cross-publisher dupes)`);

    // Phase 4: ENRICH — fetch full article content via Readability
    const enriched = await this.enrichArticles(afterBatchDedup, stats);
    this.log("ENRICH", `${afterBatchDedup.length} articles → ${stats.articlesEnriched} enriched, ${stats.enrichmentsFailed} failed`);

    // Phase 5: CLASSIFY — Sonnet classification (the expensive step)
    const classified = await this.classifyItems(enriched, claims, stats);
    this.log("CLASSIFY", `${enriched.length} LLM calls → ${classified.length} intel + ${stats.llmSkipped} SKIP ($${stats.estimatedCostUsd.toFixed(2)})`);

    // Phase 6: STORE — final fingerprint check + create IntelligenceItem
    await this.storeItems(classified, claims, stats);
    this.log("STORE", `${classified.length} → ${stats.itemsCreated} created (${stats.fingerprintDedupSkipped} fingerprint conflicts)`);

    // ─── STATE SOURCES (existing per-source logic, unchanged) ─────

    await this.processStateSources(stateSources, claims, stats);

    // ─── UPDATE EVENT SOURCE METADATA ─────────────────────────────

    await this.updateEventSourceMeta(eventSources);

    stats.durationMs = Date.now() - start;
    this.log(
      "TOTAL",
      `${stats.itemsFetched} fetched → ${stats.itemsCreated} stored | $${stats.estimatedCostUsd.toFixed(2)} | ${(stats.durationMs / 1000).toFixed(1)}s`,
    );

    return stats;
  }

  // ─── Phase 1: COLLECT ─────────────────────────────────────────────

  private async collectEventItems(
    sources: SourceRow[],
    stats: IngestionRunStats,
  ): Promise<PipelineItem[]> {
    const items: PipelineItem[] = [];

    // Process sources in parallel batches
    for (let i = 0; i < sources.length; i += CONCURRENCY) {
      const batch = sources.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (source) => {
          const adapter = this.adapters.get(source.type)!;
          const raw = await adapter.fetch(source);
          // Store hash now so we don't need to re-fetch in updateEventSourceMeta
          this.eventSourceHashes.set(source.id, hashContent(raw.content));
          const changes = await adapter.detectChanges(raw, source.lastContentHash);
          return { source, changes };
        }),
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j]!;
        const source = batch[j]!;
        if (result.status === "rejected") {
          stats.errors.push({
            sourceId: source.id,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
          continue;
        }
        for (const change of result.value.changes) {
          items.push({
            title: change.summary,
            url: change.url,
            snippet: change.content,
            pubDate: change.publishedAt,
            changeType: change.changeType,
            competitorId: source.competitorId,
            sourceId: source.id,
            sourceType: source.type,
            competitorName: source.competitor.name,
          });
        }
      }
    }

    stats.itemsFetched = items.length;
    return items;
  }

  // ─── Phase 2: REMEMBER (feed memory) ────────────────────────────

  private async remember(
    items: PipelineItem[],
    stats: IngestionRunStats,
  ): Promise<PipelineItem[]> {
    if (items.length === 0) return [];

    // 1. Batch query: which URLs have we seen before?
    const sourceIds = [...new Set(items.map((i) => i.sourceId))];
    const urls = [...new Set(items.map((i) => i.url))];

    const alreadySeen = await prisma.seenArticle.findMany({
      where: {
        sourceId: { in: sourceIds },
        articleUrl: { in: urls },
      },
      select: { sourceId: true, articleUrl: true },
    });

    const seenSet = new Set(
      alreadySeen.map((s: { sourceId: string; articleUrl: string }) => `${s.sourceId}::${s.articleUrl}`),
    );

    // 2. Filter to genuinely new items
    const newItems: PipelineItem[] = [];
    for (const item of items) {
      const key = `${item.sourceId}::${item.url}`;
      if (seenSet.has(key)) {
        stats.seenSkipped++;
      } else {
        newItems.push(item);
      }
    }

    // 3. Record ALL URLs as seen (including ones we'll cap below)
    const records = items.map((item) => ({
      sourceId: item.sourceId,
      articleUrl: item.url,
    }));

    // Batch insert in chunks to avoid query size limits
    const CHUNK = 500;
    for (let i = 0; i < records.length; i += CHUNK) {
      await prisma.seenArticle.createMany({
        data: records.slice(i, i + CHUNK),
        skipDuplicates: true,
      });
    }

    // 4. Safety cap: if too many new items (fresh start), take most recent
    if (newItems.length > INGESTION.MAX_NEW_ITEMS_PER_RUN) {
      newItems.sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return dateB - dateA;
      });
      stats.safetyCapped = newItems.length - INGESTION.MAX_NEW_ITEMS_PER_RUN;
      return newItems.slice(0, INGESTION.MAX_NEW_ITEMS_PER_RUN);
    }

    return newItems;
  }

  // ─── Phase 6: ENRICH ─────────────────────────────────────────────

  private async enrichArticles(
    items: PipelineItem[],
    stats: IngestionRunStats,
  ): Promise<PipelineItem[]> {
    // Track enrichments per source to respect the cap
    const enrichCountBySource = new Map<string, number>();

    for (const item of items) {
      if (item.changeType !== "rss_new_item" || !item.url) continue;

      const count = enrichCountBySource.get(item.sourceId) ?? 0;
      if (count >= INGESTION.MAX_ARTICLE_ENRICHMENTS_PER_SOURCE) continue;

      const article = await fetchArticleContent(item.url, {
        timeoutMs: INGESTION.ARTICLE_FETCH_TIMEOUT_MS,
      });

      if (article) {
        item.enrichedContent = `${article.title || item.title}\n\n${article.content}`;
        item.resolvedUrl = article.resolvedUrl;
        stats.articlesEnriched++;
      } else {
        stats.enrichmentsFailed++;
      }

      enrichCountBySource.set(item.sourceId, count + 1);
    }

    return items;
  }

  // ─── Phase 7: CLASSIFY ───────────────────────────────────────────

  private async classifyItems(
    items: PipelineItem[],
    claims: Awaited<ReturnType<typeof prisma.positioningClaim.findMany>>,
    stats: IngestionRunStats,
  ): Promise<PipelineItem[]> {
    const classified: PipelineItem[] = [];

    for (const item of items) {
      const sourceCategory = SOURCE_CATEGORIES[item.sourceType];
      const content = item.enrichedContent ?? item.snippet;

      let classification: ClassificationResult | null = null;
      try {
        const prompt = buildClassifyIntelPrompt({
          competitorName: item.competitorName,
          sourceType: item.sourceType,
          sourceUrl: item.resolvedUrl ?? item.url,
          rawContent: content,
          changeType: item.changeType,
          claims,
          sourceCategory,
          isFirstRun: false, // EVENT sources in phased pipeline are never "first run" for classification
        });
        classification = await this.llm.classifyStructured<ClassificationResult>(prompt);
        stats.llmCallsMade++;
        stats.estimatedCostUsd += LLM_COST_PER_CALL;
      } catch {
        stats.llmCallsMade++;
        stats.estimatedCostUsd += LLM_COST_PER_CALL;
        stats.errors.push({
          sourceId: item.sourceId,
          error: `LLM classification failed for "${item.title}"`,
        });
      }

      if (classification?.type === "SKIP") {
        stats.llmSkipped++;
        continue;
      }

      item.classification = classification ?? undefined;

      // Resolve final URL
      if (item.resolvedUrl) {
        // Already resolved by article fetcher
      } else if (classification?.sourceUrl) {
        const llmUrlHasPath = /^https?:\/\/[^/]+\/.+/.test(classification.sourceUrl);
        item.resolvedUrl = llmUrlHasPath
          ? classification.sourceUrl
          : await resolveGoogleNewsUrl(item.url);
      } else {
        item.resolvedUrl = await resolveGoogleNewsUrl(item.url);
      }

      // Generate event fingerprint
      const summary = classification?.summary ?? item.title;
      item.eventFingerprint = generateEventFingerprint(classification?.eventKey, summary);

      classified.push(item);
    }

    return classified;
  }

  // ─── Phase 8: STORE ──────────────────────────────────────────────

  private async storeItems(
    items: PipelineItem[],
    claims: Awaited<ReturnType<typeof prisma.positioningClaim.findMany>>,
    stats: IngestionRunStats,
  ): Promise<void> {
    const claimIds = new Set(claims.map((c) => c.id));

    for (const item of items) {
      // Belt-and-suspenders: final fingerprint dedup check
      if (item.eventFingerprint) {
        const existing = await prisma.intelligenceItem.findFirst({
          where: {
            eventFingerprint: item.eventFingerprint,
            competitorId: item.competitorId,
          },
          select: { id: true },
        });
        if (existing) {
          stats.fingerprintDedupSkipped++;
          continue;
        }
      }

      const classification = item.classification;
      const intelType =
        classification?.type &&
        VALID_INTEL_TYPES.includes(classification.type as IntelType)
          ? (classification.type as IntelType)
          : "PRESS";

      const evidenceTier =
        classification?.evidenceTier &&
        VALID_EVIDENCE_TIERS.includes(classification.evidenceTier as EvidenceTier)
          ? (classification.evidenceTier as EvidenceTier)
          : "UNKNOWN";

      const validClaimIds = (classification?.affectedClaimIds ?? []).filter(
        (id) => claimIds.has(id),
      );

      const resolvedDate = item.pubDate
        ? new Date(item.pubDate)
        : classification?.publishedAt
          ? new Date(classification.publishedAt)
          : new Date();

      const content = item.enrichedContent ?? item.snippet;

      await prisma.intelligenceItem.create({
        data: {
          competitorId: item.competitorId,
          sourceId: item.sourceId,
          type: intelType,
          rawContent: content.slice(0, 10000),
          summary: classification?.summary ?? item.title,
          finmoImplication: classification?.finmoImplication ?? "",
          evidenceTier,
          sourceUrl: item.resolvedUrl ?? item.url,
          detectedAt: resolvedDate,
          simulated: false,
          eventFingerprint: item.eventFingerprint,
          sourceTitle: item.title,
          claimsAffected:
            validClaimIds.length > 0
              ? { connect: validClaimIds.map((id) => ({ id })) }
              : undefined,
        },
      });

      stats.itemsCreated++;
    }
  }

  // ─── STATE SOURCE PROCESSING (unchanged logic) ───────────────────

  private async processStateSources(
    sources: SourceRow[],
    claims: Awaited<ReturnType<typeof prisma.positioningClaim.findMany>>,
    stats: IngestionRunStats,
  ): Promise<void> {
    for (let i = 0; i < sources.length; i += CONCURRENCY) {
      const batch = sources.slice(i, i + CONCURRENCY);
      const outcomes = await Promise.allSettled(
        batch.map((source) => this.processStateSource(source, claims, stats)),
      );

      for (let j = 0; j < outcomes.length; j++) {
        const outcome = outcomes[j]!;
        const source = batch[j]!;
        if (outcome.status === "rejected") {
          stats.errors.push({
            sourceId: source.id,
            error:
              outcome.reason instanceof Error
                ? outcome.reason.message
                : String(outcome.reason),
          });
        }
      }
    }
  }

  private async processStateSource(
    source: SourceRow,
    claims: Awaited<ReturnType<typeof prisma.positioningClaim.findMany>>,
    stats: IngestionRunStats,
  ): Promise<void> {
    const adapter = this.adapters.get(source.type)!;
    const raw = await adapter.fetch(source);
    const newHash = hashContent(raw.content);
    const changes = await adapter.detectChanges(raw, source.lastContentHash);
    const isFirstRun = source.lastContentHash === null;

    // STATE first run: baseline only — store hash, skip classification
    if (
      INGESTION.SKIP_FIRST_RUN_FOR_STATE_SOURCES &&
      isFirstRun &&
      changes.length > 0
    ) {
      await prisma.dataSource.update({
        where: { id: source.id },
        data: {
          lastChecked: new Date(),
          lastContentHash: newHash,
          health: "HEALTHY",
        },
      });
      return;
    }

    for (const change of changes) {
      change.competitorId = source.competitorId;
      change.sourceId = source.id;

      let classification: ClassificationResult | null = null;
      try {
        const prompt = buildClassifyIntelPrompt({
          competitorName: source.competitor.name,
          sourceType: source.type,
          sourceUrl: change.url,
          rawContent: change.content,
          changeType: change.changeType,
          claims,
          sourceCategory: "STATE",
          isFirstRun,
        });
        classification =
          await this.llm.classifyStructured<ClassificationResult>(prompt);
        stats.llmCallsMade++;
        stats.estimatedCostUsd += LLM_COST_PER_CALL;
      } catch {
        stats.llmCallsMade++;
        stats.estimatedCostUsd += LLM_COST_PER_CALL;
        stats.errors.push({
          sourceId: source.id,
          error: `LLM classification failed for state source`,
        });
      }

      if (classification?.type === "SKIP") {
        stats.llmSkipped++;
        continue;
      }

      const intelType =
        classification?.type &&
        VALID_INTEL_TYPES.includes(classification.type as IntelType)
          ? (classification.type as IntelType)
          : "PRESS";

      const evidenceTier =
        classification?.evidenceTier &&
        VALID_EVIDENCE_TIERS.includes(classification.evidenceTier as EvidenceTier)
          ? (classification.evidenceTier as EvidenceTier)
          : "UNKNOWN";

      const validClaimIds = (classification?.affectedClaimIds ?? []).filter(
        (id) => claims.some((c) => c.id === id),
      );

      const resolvedUrl = classification?.sourceUrl ?? change.url;

      const summary = classification?.summary ?? change.summary;
      const eventFingerprint = generateEventFingerprint(
        classification?.eventKey,
        summary,
      );

      // Fingerprint dedup for state sources
      const existingByFingerprint = await prisma.intelligenceItem.findFirst({
        where: { eventFingerprint, competitorId: source.competitorId },
        select: { id: true },
      });
      if (existingByFingerprint) {
        stats.fingerprintDedupSkipped++;
        continue;
      }

      await prisma.intelligenceItem.create({
        data: {
          competitorId: source.competitorId,
          sourceId: source.id,
          type: intelType,
          rawContent: change.content.slice(0, 10000),
          summary,
          finmoImplication: classification?.finmoImplication ?? "",
          evidenceTier,
          sourceUrl: resolvedUrl,
          detectedAt: new Date(),
          simulated: false,
          eventFingerprint,
          sourceTitle: change.summary,
          claimsAffected:
            validClaimIds.length > 0
              ? { connect: validClaimIds.map((id) => ({ id })) }
              : undefined,
        },
      });

      stats.itemsCreated++;
    }

    // Update source metadata
    await prisma.dataSource.update({
      where: { id: source.id },
      data: {
        lastChecked: new Date(),
        lastContentHash: newHash,
        ...(changes.length > 0
          ? { lastChangeDetected: new Date(), health: "HEALTHY" as const }
          : { health: "HEALTHY" as const }),
      },
    });
  }

  // ─── Update EVENT source metadata ────────────────────────────────

  private async updateEventSourceMeta(sources: SourceRow[]): Promise<void> {
    for (const source of sources) {
      const storedHash = this.eventSourceHashes.get(source.id);
      await prisma.dataSource.update({
        where: { id: source.id },
        data: {
          lastChecked: new Date(),
          ...(storedHash ? { lastContentHash: storedHash, health: "HEALTHY" as const } : {}),
        },
      });
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private log(phase: string, message: string): void {
    console.log(`[${phase}] ${message}`);
  }

  private emptyStats(): IngestionRunStats {
    return {
      sourcesChecked: 0,
      itemsFetched: 0,
      seenSkipped: 0,
      safetyCapped: 0,
      titleDedupBatchSkipped: 0,
      articlesEnriched: 0,
      enrichmentsFailed: 0,
      llmCallsMade: 0,
      llmSkipped: 0,
      fingerprintDedupSkipped: 0,
      itemsCreated: 0,
      estimatedCostUsd: 0,
      durationMs: 0,
      errors: [],
    };
  }
}
