import { describe, it, expect, vi, beforeEach } from "vitest";
import { SourceType } from "@/generated/prisma/client";
import type {
  IngestionAdapter,
  DetectedChange,
} from "../adapters/base";

vi.mock("@/lib/db", () => ({
  prisma: {
    dataSource: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "src-1",
          competitorId: "comp-1",
          type: "WEBSITE" as SourceType,
          url: "https://example.com",
          lastContentHash: null,
          competitor: { status: "ACTIVE" },
        },
      ]),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

// Must import after vi.mock so the mock is applied
import { prisma } from "@/lib/db";
import { IngestionRunner } from "../runner";

function createMockAdapter(overrides?: {
  fetch?: IngestionAdapter["fetch"];
  detectChanges?: IngestionAdapter["detectChanges"];
}): IngestionAdapter {
  return {
    sourceType: SourceType.WEBSITE,
    fetch:
      overrides?.fetch ??
      vi.fn<IngestionAdapter["fetch"]>().mockResolvedValue({
        content: "<html><body>Hello</body></html>",
        url: "https://example.com",
        fetchedAt: new Date(),
      }),
    detectChanges:
      overrides?.detectChanges ??
      vi.fn<IngestionAdapter["detectChanges"]>().mockResolvedValue([
        {
          competitorId: "",
          sourceId: "",
          changeType: "PRODUCT_CHANGE",
          content: "new content",
          url: "https://example.com",
          summary: "Something changed",
        },
      ]),
  };
}

describe("IngestionRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the default mock return value before each test
    vi.mocked(prisma.dataSource.findMany).mockResolvedValue([
      {
        id: "src-1",
        competitorId: "comp-1",
        type: "WEBSITE" as SourceType,
        url: "https://example.com",
        cadence: "DAILY",
        health: "HEALTHY",
        lastChecked: null,
        lastChangeDetected: null,
        lastContentHash: null,
        createdAt: new Date(),
        competitor: { id: "comp-1", status: "ACTIVE" },
      },
    ] as never);
  });

  it("should fetch sources and detect changes", async () => {
    const adapter = createMockAdapter();
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const runner = new IngestionRunner(adapters);

    const result = await runner.run();

    expect(result.sourcesChecked).toBe(1);
    expect(result.changesDetected).toBe(1);
    expect(result.itemsCreated).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(prisma.dataSource.findMany).toHaveBeenCalledOnce();
    expect(prisma.dataSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "src-1" },
        data: expect.objectContaining({
          health: "HEALTHY",
          lastContentHash: expect.any(String),
          lastChecked: expect.any(Date),
          lastChangeDetected: expect.any(Date),
        }),
      }),
    );
  });

  it("should call adapter.detectChanges with correct arguments", async () => {
    const mockDetectChanges = vi
      .fn<IngestionAdapter["detectChanges"]>()
      .mockResolvedValue([]);
    const adapter = createMockAdapter({ detectChanges: mockDetectChanges });
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const runner = new IngestionRunner(adapters);

    await runner.run();

    expect(mockDetectChanges).toHaveBeenCalledOnce();
    expect(mockDetectChanges).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.any(String),
        url: expect.any(String),
        fetchedAt: expect.any(Date),
      }),
      null, // lastContentHash is null for the mock source
    );
  });

  it("should update source without lastChangeDetected when no changes detected", async () => {
    const adapter = createMockAdapter({
      detectChanges: vi
        .fn<IngestionAdapter["detectChanges"]>()
        .mockResolvedValue([]),
    });
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const runner = new IngestionRunner(adapters);

    const result = await runner.run();

    expect(result.sourcesChecked).toBe(1);
    expect(result.changesDetected).toBe(0);
    expect(result.itemsCreated).toBe(0);
    expect(prisma.dataSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "src-1" },
        data: expect.objectContaining({
          health: "HEALTHY",
          lastContentHash: expect.any(String),
          lastChecked: expect.any(Date),
        }),
      }),
    );
    // Should NOT include lastChangeDetected in the no-changes path
    const updateCall = vi.mocked(prisma.dataSource.update).mock.calls[0]![0];
    expect(updateCall.data).not.toHaveProperty("lastChangeDetected");
  });

  it("should handle adapter errors gracefully and mark source as DEGRADED", async () => {
    const adapter = createMockAdapter({
      fetch: vi
        .fn<IngestionAdapter["fetch"]>()
        .mockRejectedValue(new Error("Network timeout")),
    });
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const runner = new IngestionRunner(adapters);

    const result = await runner.run();

    expect(result.sourcesChecked).toBe(1);
    expect(result.changesDetected).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      sourceId: "src-1",
      error: "Network timeout",
    });
    expect(prisma.dataSource.update).toHaveBeenCalledWith({
      where: { id: "src-1" },
      data: expect.objectContaining({
        health: "DEGRADED",
        lastChecked: expect.any(Date),
      }),
    });
  });

  it("should skip sources with no matching adapter", async () => {
    // No adapters registered at all
    const adapters = new Map<SourceType, IngestionAdapter>();
    const runner = new IngestionRunner(adapters);

    const result = await runner.run();

    expect(result.sourcesChecked).toBe(0);
    expect(result.changesDetected).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(prisma.dataSource.update).not.toHaveBeenCalled();
  });

  it("should populate competitorId and sourceId on detected changes", async () => {
    const changes: DetectedChange[] = [
      {
        competitorId: "",
        sourceId: "",
        changeType: "PRODUCT_CHANGE",
        content: "updated content",
        url: "https://example.com",
        summary: "Change detected",
      },
    ];
    const adapter = createMockAdapter({
      detectChanges: vi
        .fn<IngestionAdapter["detectChanges"]>()
        .mockResolvedValue(changes),
    });
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const runner = new IngestionRunner(adapters);

    await runner.run();

    // The runner mutates the change objects in-place
    expect(changes[0]!.competitorId).toBe("comp-1");
    expect(changes[0]!.sourceId).toBe("src-1");
  });
});
