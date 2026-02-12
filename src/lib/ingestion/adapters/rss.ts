import Parser from "rss-parser";
import type { SourceType } from "@/generated/prisma/client";
import type { DataSource } from "@/generated/prisma/client";
import type { IngestionAdapter, RawContent, DetectedChange } from "./base";
import { hasContentChanged } from "../diff-engine";

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

    // Return one change per RSS item with individual article URLs and dates
    return this.lastFeedItems
      .filter((item) => item.title || item.contentSnippet)
      .map((item) => ({
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
