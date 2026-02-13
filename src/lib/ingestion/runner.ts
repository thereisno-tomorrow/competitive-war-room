import type { IntelType, EvidenceTier, SourceType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { LLMProvider } from "@/lib/llm/provider";
import type { IngestionAdapter } from "./adapters/base";
import { hashContent } from "./diff-engine";
import {
  buildClassifyIntelPrompt,
  type ClassificationResult,
} from "@/lib/llm/prompts/classify-intel";
import { SOURCE_CATEGORIES, INGESTION, DEDUP } from "@/lib/config/thresholds";
import { resolveGoogleNewsUrl } from "./google-news-url";
import { generateEventFingerprint } from "./event-fingerprint";
import { fetchArticleContent } from "./article-fetcher";

const VALID_INTEL_TYPES: IntelType[] = [
  "PRODUCT_CHANGE", "PRICING_CHANGE", "HIRING_SIGNAL", "PARTNERSHIP",
  "REVIEW", "PRESS", "OUTAGE", "MESSAGING_SHIFT", "SEO_CHANGE", "REGULATORY",
];

const VALID_EVIDENCE_TIERS: EvidenceTier[] = ["CONFIRMED", "INFERRED", "UNKNOWN"];

const CONCURRENCY = 5;

interface IngestionResult {
  sourcesChecked: number;
  changesDetected: number;
  itemsCreated: number;
  errors: Array<{ sourceId: string; error: string }>;
}

export class IngestionRunner {
  private adapters: Map<SourceType, IngestionAdapter>;
  private llm: LLMProvider;

  constructor(adapters: Map<SourceType, IngestionAdapter>, llm: LLMProvider) {
    this.adapters = adapters;
    this.llm = llm;
  }

  async run(): Promise<IngestionResult> {
    const result: IngestionResult = {
      sourcesChecked: 0,
      changesDetected: 0,
      itemsCreated: 0,
      errors: [],
    };

    const [sources, claims] = await Promise.all([
      prisma.dataSource.findMany({
        where: { competitor: { status: "ACTIVE" } },
        include: { competitor: true },
      }),
      prisma.positioningClaim.findMany(),
    ]);

    const eligible = sources.filter((s) => this.adapters.has(s.type));

    // Process sources in parallel batches for speed
    for (let i = 0; i < eligible.length; i += CONCURRENCY) {
      const batch = eligible.slice(i, i + CONCURRENCY);
      const outcomes = await Promise.allSettled(
        batch.map((source) => this.processSource(source, claims)),
      );

      for (let j = 0; j < outcomes.length; j++) {
        const outcome = outcomes[j]!;
        const source = batch[j]!;
        if (outcome.status === "fulfilled") {
          result.sourcesChecked += outcome.value.sourcesChecked;
          result.changesDetected += outcome.value.changesDetected;
          result.itemsCreated += outcome.value.itemsCreated;
          result.errors.push(...outcome.value.errors);
        } else {
          result.sourcesChecked++;
          result.errors.push({
            sourceId: source.id,
            error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
          });
        }
      }
    }

    return result;
  }

  private async processSource(
    source: Awaited<ReturnType<typeof prisma.dataSource.findMany>>[number] & {
      competitor: { name: string };
    },
    claims: Awaited<ReturnType<typeof prisma.positioningClaim.findMany>>,
  ): Promise<IngestionResult> {
    const result: IngestionResult = {
      sourcesChecked: 1,
      changesDetected: 0,
      itemsCreated: 0,
      errors: [],
    };

    const adapter = this.adapters.get(source.type)!;

    try {
      const raw = await adapter.fetch(source);
      const newHash = hashContent(raw.content);
      const changes = await adapter.detectChanges(
        raw,
        source.lastContentHash,
      );

      const sourceCategory = SOURCE_CATEGORIES[source.type];
      const isFirstRun = source.lastContentHash === null;

      // STATE sources on first run: baseline only — store hash, skip classification.
      // This prevents the LLM from hallucinating events from static page content.
      if (
        INGESTION.SKIP_FIRST_RUN_FOR_STATE_SOURCES &&
        sourceCategory === "STATE" &&
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
        return result; // 0 changes, 0 items — baseline stored
      }

      if (changes.length > 0) {
        result.changesDetected += changes.length;

        let enrichmentCount = 0;

        for (const change of changes) {
          change.competitorId = source.competitorId;
          change.sourceId = source.id;

          // Enrich RSS items with full article content before classification.
          // Gives the LLM 500-2000 words instead of a 20-word snippet.
          let articleEnriched = false;
          if (
            change.changeType === "rss_new_item" &&
            change.url &&
            enrichmentCount < INGESTION.MAX_ARTICLE_ENRICHMENTS_PER_SOURCE
          ) {
            const article = await fetchArticleContent(change.url, {
              timeoutMs: INGESTION.ARTICLE_FETCH_TIMEOUT_MS,
            });
            if (article) {
              change.content = `${article.title || change.summary}\n\n${article.content}`;
              change.url = article.resolvedUrl;
              articleEnriched = true;
              enrichmentCount++;
            }
          }

          let classification: ClassificationResult | null = null;
          try {
            const prompt = buildClassifyIntelPrompt({
              competitorName: source.competitor.name,
              sourceType: source.type,
              sourceUrl: change.url,
              rawContent: change.content,
              changeType: change.changeType,
              claims,
              sourceCategory,
              isFirstRun,
            });
            classification = await this.llm.classifyStructured<ClassificationResult>(prompt);
          } catch {
            // LLM failed — fall back to defaults below
          }

          // LLM determined this content is not noteworthy
          if (classification?.type === "SKIP") {
            continue;
          }

          const intelType = classification?.type && VALID_INTEL_TYPES.includes(classification.type as IntelType)
            ? (classification.type as IntelType)
            : "PRESS";

          const evidenceTier = classification?.evidenceTier && VALID_EVIDENCE_TIERS.includes(classification.evidenceTier as EvidenceTier)
            ? (classification.evidenceTier as EvidenceTier)
            : "UNKNOWN";

          const validClaimIds = (classification?.affectedClaimIds ?? [])
            .filter((id) => claims.some((c) => c.id === id));

          // URL resolution: if article enrichment already resolved the URL, use it directly.
          // Otherwise, prefer LLM-extracted URL if it has a real path, then resolve Google News redirects.
          let resolvedUrl: string;
          if (articleEnriched) {
            resolvedUrl = change.url; // Already resolved by article fetcher
          } else {
            const llmUrl = classification?.sourceUrl;
            const llmUrlHasPath = llmUrl && /^https?:\/\/[^/]+\/.+/.test(llmUrl);
            const rawUrl = llmUrlHasPath ? llmUrl : change.url;
            resolvedUrl = await resolveGoogleNewsUrl(rawUrl);
          }

          // Use adapter date (RSS pubDate) > LLM-extracted date > now
          const resolvedDate = change.publishedAt
            ? new Date(change.publishedAt)
            : classification?.publishedAt
              ? new Date(classification.publishedAt)
              : new Date();

          // Dedup for event sources: skip if an item with the same URL already exists.
          // RSS feeds re-list old articles; LinkedIn phantoms return full result sets.
          // Website/changelog/status pages use hash-based detection — no dedup needed.
          if (
            change.changeType === "rss_new_item" ||
            change.changeType === "linkedin_post" ||
            change.changeType === "linkedin_job"
          ) {
            const existing = await prisma.intelligenceItem.findFirst({
              where: { sourceUrl: resolvedUrl, competitorId: source.competitorId },
              select: { id: true },
            });
            if (existing) continue;
          }

          // Event-level dedup: same event fingerprint + competitor within window = skip
          const summary = classification?.summary ?? change.summary;
          const eventFingerprint = generateEventFingerprint(summary);

          const windowStart = new Date();
          windowStart.setDate(
            windowStart.getDate() - DEDUP.EVENT_FINGERPRINT_WINDOW_DAYS,
          );

          const existingByFingerprint =
            await prisma.intelligenceItem.findFirst({
              where: {
                eventFingerprint,
                competitorId: source.competitorId,
                detectedAt: { gte: windowStart },
              },
              select: { id: true },
            });
          if (existingByFingerprint) continue;

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
              detectedAt: resolvedDate,
              simulated: false,
              eventFingerprint,
              claimsAffected: validClaimIds.length > 0
                ? { connect: validClaimIds.map((id) => ({ id })) }
                : undefined,
            },
          });

          result.itemsCreated++;
        }

        await prisma.dataSource.update({
          where: { id: source.id },
          data: {
            lastChecked: new Date(),
            lastChangeDetected: new Date(),
            lastContentHash: newHash,
            health: "HEALTHY",
          },
        });
      } else {
        await prisma.dataSource.update({
          where: { id: source.id },
          data: {
            lastChecked: new Date(),
            lastContentHash: newHash,
            health: "HEALTHY",
          },
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      result.errors.push({ sourceId: source.id, error: message });

      await prisma.dataSource.update({
        where: { id: source.id },
        data: {
          lastChecked: new Date(),
          health: "DEGRADED",
        },
      });
    }

    return result;
  }
}
