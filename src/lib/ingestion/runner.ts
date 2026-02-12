import type { SourceType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { IngestionAdapter, DetectedChange } from "./adapters/base";
import { hashContent } from "./diff-engine";

interface IngestionResult {
  sourcesChecked: number;
  changesDetected: number;
  itemsCreated: number;
  errors: Array<{ sourceId: string; error: string }>;
}

export class IngestionRunner {
  private adapters: Map<SourceType, IngestionAdapter>;

  constructor(adapters: Map<SourceType, IngestionAdapter>) {
    this.adapters = adapters;
  }

  async run(): Promise<IngestionResult> {
    const result: IngestionResult = {
      sourcesChecked: 0,
      changesDetected: 0,
      itemsCreated: 0,
      errors: [],
    };

    const sources = await prisma.dataSource.findMany({
      where: { competitor: { status: "ACTIVE" } },
      include: { competitor: true },
    });

    for (const source of sources) {
      const adapter = this.adapters.get(source.type);
      if (!adapter) continue;

      try {
        result.sourcesChecked++;
        const raw = await adapter.fetch(source);
        const newHash = hashContent(raw.content);
        const changes = await adapter.detectChanges(
          raw,
          source.lastContentHash,
        );

        if (changes.length > 0) {
          result.changesDetected += changes.length;

          for (const change of changes) {
            change.competitorId = source.competitorId;
            change.sourceId = source.id;
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
    }

    return result;
  }
}
