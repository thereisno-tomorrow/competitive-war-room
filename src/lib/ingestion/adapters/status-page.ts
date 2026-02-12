import type { SourceType } from "@/generated/prisma/client";
import type { DataSource } from "@/generated/prisma/client";
import type { IngestionAdapter, RawContent, DetectedChange } from "./base";
import { extractTextContent, hasContentChanged } from "../diff-engine";

const STATUS_ALERT_KEYWORDS = [
  "degraded",
  "outage",
  "maintenance",
  "incident",
  "disruption",
  "downtime",
];

export class StatusPageAdapter implements IngestionAdapter {
  readonly sourceType: SourceType = "STATUS_PAGE";

  async fetch(source: DataSource): Promise<RawContent> {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "FinmoCompetitiveIntel/1.0" },
      signal: AbortSignal.timeout(15_000),
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

    const contentLower = current.content.toLowerCase();
    const isAlertWorthy = STATUS_ALERT_KEYWORDS.some((keyword) =>
      contentLower.includes(keyword),
    );

    const summary = isAlertWorthy
      ? `ALERT: Status issue detected at ${current.url} (isAlertWorthy: true)`
      : `Status change detected at ${current.url}`;

    return [
      {
        competitorId: "", // Set by runner
        sourceId: "", // Set by runner
        changeType: "status_change",
        content: current.content,
        url: current.url,
        summary,
      },
    ];
  }
}
