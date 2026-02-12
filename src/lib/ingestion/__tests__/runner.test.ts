import { describe, it, expect, vi, beforeEach } from "vitest";
import { SourceType } from "@/generated/prisma/client";
import type {
  IngestionAdapter,
  DetectedChange,
} from "../adapters/base";
import type { LLMProvider } from "@/lib/llm/provider";

vi.mock("@/lib/db", () => ({
  prisma: {
    dataSource: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    positioningClaim: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    intelligenceItem: {
      create: vi.fn().mockResolvedValue({ id: "intel-1" }),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Must import after vi.mock so the mock is applied
import { prisma } from "@/lib/db";
import { IngestionRunner } from "../runner";

function createMockLLM(overrides?: Partial<LLMProvider>): LLMProvider {
  return {
    synthesize: vi.fn().mockResolvedValue(""),
    classify: vi.fn().mockResolvedValue("PRESS"),
    classifyStructured: vi.fn().mockResolvedValue({
      type: "PRODUCT_CHANGE",
      summary: "Competitor updated their product page",
      finmoImplication: "May indicate new feature launch targeting Finmo's segment",
      evidenceTier: "INFERRED",
      affectedClaimIds: [],
      sourceUrl: "https://example.com",
      publishedAt: "",
    }),
    generateStructured: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

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
        lastContentHash: "existing-hash-for-test",
        createdAt: new Date(),
        competitor: { id: "comp-1", name: "TestCompetitor", status: "ACTIVE", tier: "TIER_1" },
      },
    ] as never);

    vi.mocked(prisma.positioningClaim.findMany).mockResolvedValue([
      {
        id: "claim-1",
        claimText: "Only mid-market accessible platform",
        currentStatus: "HOLDING",
        createdAt: new Date(),
      },
    ] as never);
  });

  it("should fetch sources and detect changes", async () => {
    const adapter = createMockAdapter();
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const llm = createMockLLM();
    const runner = new IngestionRunner(adapters, llm);

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

  it("should create IntelligenceItem with simulated=false when change detected", async () => {
    const adapter = createMockAdapter();
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const llm = createMockLLM();
    const runner = new IngestionRunner(adapters, llm);

    await runner.run();

    expect(prisma.intelligenceItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        competitorId: "comp-1",
        sourceId: "src-1",
        type: "PRODUCT_CHANGE",
        summary: "Competitor updated their product page",
        finmoImplication: "May indicate new feature launch targeting Finmo's segment",
        evidenceTier: "INFERRED",
        sourceUrl: "https://example.com",
        detectedAt: expect.any(Date),
        simulated: false,
      }),
    });
  });

  it("should connect affected positioning claims", async () => {
    const llm = createMockLLM({
      classifyStructured: vi.fn().mockResolvedValue({
        type: "PRODUCT_CHANGE",
        summary: "Test summary",
        finmoImplication: "Test implication",
        evidenceTier: "CONFIRMED",
        affectedClaimIds: ["claim-1"],
      }),
    });
    const adapter = createMockAdapter();
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const runner = new IngestionRunner(adapters, llm);

    await runner.run();

    expect(prisma.intelligenceItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimsAffected: { connect: [{ id: "claim-1" }] },
      }),
    });
  });

  it("should fall back to UNKNOWN tier when LLM classification fails", async () => {
    const llm = createMockLLM({
      classifyStructured: vi.fn().mockRejectedValue(new Error("API rate limited")),
    });
    const adapter = createMockAdapter();
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const runner = new IngestionRunner(adapters, llm);

    const result = await runner.run();

    expect(result.itemsCreated).toBe(1);
    expect(prisma.intelligenceItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "PRESS",
        summary: "Something changed",
        finmoImplication: "",
        evidenceTier: "UNKNOWN",
        simulated: false,
      }),
    });
  });

  it("should call adapter.detectChanges with correct arguments", async () => {
    const mockDetectChanges = vi
      .fn<IngestionAdapter["detectChanges"]>()
      .mockResolvedValue([]);
    const adapter = createMockAdapter({ detectChanges: mockDetectChanges });
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const llm = createMockLLM();
    const runner = new IngestionRunner(adapters, llm);

    await runner.run();

    expect(mockDetectChanges).toHaveBeenCalledOnce();
    expect(mockDetectChanges).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.any(String),
        url: expect.any(String),
        fetchedAt: expect.any(Date),
      }),
      "existing-hash-for-test",
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
    const llm = createMockLLM();
    const runner = new IngestionRunner(adapters, llm);

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
    const llm = createMockLLM();
    const runner = new IngestionRunner(adapters, llm);

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
    const llm = createMockLLM();
    const runner = new IngestionRunner(adapters, llm);

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
    const llm = createMockLLM();
    const runner = new IngestionRunner(adapters, llm);

    await runner.run();

    // The runner mutates the change objects in-place
    expect(changes[0]!.competitorId).toBe("comp-1");
    expect(changes[0]!.sourceId).toBe("src-1");
  });

  // -----------------------------------------------------------------------
  // Baseline skip & SKIP classification tests
  // -----------------------------------------------------------------------

  it("should baseline-only on first run for STATE sources (no items, no LLM)", async () => {
    // Override default mock: STATE source with null lastContentHash = first run
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
        lastContentHash: null, // first run
        createdAt: new Date(),
        competitor: { id: "comp-1", name: "TestCompetitor", status: "ACTIVE", tier: "TIER_1" },
      },
    ] as never);

    const adapter = createMockAdapter();
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const llm = createMockLLM();
    const runner = new IngestionRunner(adapters, llm);

    const result = await runner.run();

    expect(result.sourcesChecked).toBe(1);
    expect(result.changesDetected).toBe(0);
    expect(result.itemsCreated).toBe(0);
    expect(result.errors).toHaveLength(0);
    // Hash should be stored (baseline captured)
    expect(prisma.dataSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "src-1" },
        data: expect.objectContaining({
          lastContentHash: expect.any(String),
          lastChecked: expect.any(Date),
          health: "HEALTHY",
        }),
      }),
    );
    // LLM should NOT have been called
    expect(llm.classifyStructured).not.toHaveBeenCalled();
    // No intelligence items should be created
    expect(prisma.intelligenceItem.create).not.toHaveBeenCalled();
  });

  it("should classify normally on first run for EVENT sources", async () => {
    // EVENT source (PRESS_RSS) with null lastContentHash
    vi.mocked(prisma.dataSource.findMany).mockResolvedValue([
      {
        id: "src-rss",
        competitorId: "comp-1",
        type: "PRESS_RSS" as SourceType,
        url: "https://example.com/rss",
        cadence: "DAILY",
        health: "HEALTHY",
        lastChecked: null,
        lastChangeDetected: null,
        lastContentHash: null, // first run — but EVENT, so should process
        createdAt: new Date(),
        competitor: { id: "comp-1", name: "TestCompetitor", status: "ACTIVE", tier: "TIER_1" },
      },
    ] as never);

    const adapter = createMockAdapter();
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.PRESS_RSS, adapter],
    ]);
    const llm = createMockLLM();
    const runner = new IngestionRunner(adapters, llm);

    const result = await runner.run();

    // EVENT source first-run should classify normally
    expect(result.sourcesChecked).toBe(1);
    expect(result.changesDetected).toBe(1);
    expect(result.itemsCreated).toBe(1);
    expect(llm.classifyStructured).toHaveBeenCalledOnce();
    expect(prisma.intelligenceItem.create).toHaveBeenCalledOnce();
  });

  it("should skip item creation when LLM returns SKIP classification", async () => {
    const llm = createMockLLM({
      classifyStructured: vi.fn().mockResolvedValue({
        type: "SKIP",
        summary: "Boilerplate content, not competitively noteworthy",
        finmoImplication: "",
        evidenceTier: "UNKNOWN",
        affectedClaimIds: [],
      }),
    });
    const adapter = createMockAdapter();
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const runner = new IngestionRunner(adapters, llm);

    const result = await runner.run();

    expect(result.changesDetected).toBe(1);
    expect(result.itemsCreated).toBe(0);
    expect(llm.classifyStructured).toHaveBeenCalledOnce();
    expect(prisma.intelligenceItem.create).not.toHaveBeenCalled();
  });

  it("should ignore invalid claim IDs from LLM response", async () => {
    const llm = createMockLLM({
      classifyStructured: vi.fn().mockResolvedValue({
        type: "PRODUCT_CHANGE",
        summary: "Test",
        finmoImplication: "Test",
        evidenceTier: "CONFIRMED",
        affectedClaimIds: ["claim-1", "nonexistent-claim"],
      }),
    });
    const adapter = createMockAdapter();
    const adapters = new Map<SourceType, IngestionAdapter>([
      [SourceType.WEBSITE, adapter],
    ]);
    const runner = new IngestionRunner(adapters, llm);

    await runner.run();

    expect(prisma.intelligenceItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimsAffected: { connect: [{ id: "claim-1" }] },
      }),
    });
  });
});
