import Parser from "rss-parser";
import type { SourceType } from "@/generated/prisma/client";
import type { DataSource } from "@/generated/prisma/client";
import type { IngestionAdapter, RawContent, DetectedChange } from "./base";
import { hasContentChanged } from "../diff-engine";
import { INGESTION } from "@/lib/config/thresholds";

const parser = new Parser();

export class RssAdapter implements IngestionAdapter {
  readonly sourceType: SourceType = "PRESS_RSS";

  /** Store parsed items so detectChanges can split them. */
  private lastFeedItems: Parser.Item[] = [];

  async fetch(source: DataSource): Promise<RawContent> {
    const feed = await parser.parseURL(source.url);
    this.lastFeedItems = feed.items ?? [];

    // Combined content for hash-based change detection
    const content = this.lastFeedItems
      .map(
        (item) => `${item.title ?? ""}\n${item.contentSnippet ?? ""}`.trim(),
      )
      .join("\n\n");

    return {
      content,
      url: source.url,
      fetchedAt: new Date(),
    };
  }

  async detectChanges(
    current: RawContent,
    previousHash: string | null,
  ): Promise<DetectedChange[]> {
    if (!hasContentChanged(current.content, previousHash)) {
      return [];
    }

    const isFirstRun = previousHash === null;

    let items = this.lastFeedItems
      .filter((item) => item.title || item.contentSnippet);

    // On first run, cap volume to avoid processing 50-100 backlog articles.
    // Sort by date (most recent first), filter out old articles, then take top N.
    if (isFirstRun) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - INGESTION.MAX_ARTICLE_AGE_DAYS);

      items = items
        .filter((item) => {
          const dateStr = item.pubDate ?? item.isoDate;
          if (!dateStr) return true; // keep items without dates (can't filter)
          return new Date(dateStr) >= cutoffDate;
        })
        .sort((a, b) => {
          const dateA = new Date(a.pubDate ?? a.isoDate ?? 0).getTime();
          const dateB = new Date(b.pubDate ?? b.isoDate ?? 0).getTime();
          return dateB - dateA; // most recent first
        })
        .slice(0, INGESTION.MAX_ITEMS_ON_FIRST_RUN);
    }

    // Return one change per RSS item with individual article URLs and dates
    return items.map((item) => ({
      competitorId: "",
      sourceId: "",
      changeType: "rss_new_item",
      content: `${item.title ?? ""}\n${item.contentSnippet ?? ""}`.trim(),
      url: item.link ?? current.url,
      summary: item.title ?? `New RSS item from ${current.url}`,
      publishedAt: item.pubDate ?? item.isoDate,
    }));
  }
}
