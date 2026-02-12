import Parser from "rss-parser";
import type { SourceType } from "@/generated/prisma/client";
import type { DataSource } from "@/generated/prisma/client";
import type { IngestionAdapter, RawContent, DetectedChange } from "./base";
import { hasContentChanged } from "../diff-engine";

const parser = new Parser();

export class RssAdapter implements IngestionAdapter {
  readonly sourceType: SourceType = "PRESS_RSS";

  async fetch(source: DataSource): Promise<RawContent> {
    const feed = await parser.parseURL(source.url);

    const content = feed.items
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

    return [
      {
        competitorId: "",
        sourceId: "",
        changeType: "rss_new_items",
        content: current.content,
        url: current.url,
        summary: `New RSS items detected at ${current.url}`,
      },
    ];
  }
}
