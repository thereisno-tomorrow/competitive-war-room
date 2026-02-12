import type { SourceType } from "@/generated/prisma/client";
import type { DataSource } from "@/generated/prisma/client";
import type { IngestionAdapter, RawContent, DetectedChange } from "./base";
import { extractTextContent, hasContentChanged } from "../diff-engine";

export class ChangelogAdapter implements IngestionAdapter {
  readonly sourceType: SourceType = "CHANGELOG";

  async fetch(source: DataSource): Promise<RawContent> {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "FinmoCompetitiveIntel/1.0" },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${source.url}: ${response.status} ${response.statusText}`,
      );
    }

    const html = await response.text();
    const textContent = extractTextContent(html);

    return {
      content: textContent,
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
        competitorId: "", // Set by runner
        sourceId: "", // Set by runner
        changeType: "changelog_update",
        content: current.content,
        url: current.url,
        summary: `Changelog update detected at ${current.url}`,
      },
    ];
  }
}
