import { describe, it, expect, vi, beforeEach } from "vitest";

interface BattlecardWeakness {
  text: string;
  evidenceTier: string;
  sourceUrl: string;
}

const existingBattlecard = {
  id: "bc-1",
  competitorId: "comp-1",
  whenTheyComeUp: "When enterprise clients ask about treasury AI",
  theirPitch: ["AI-powered treasury management", "Enterprise-grade security"],
  weaknesses: [
    {
      text: "Limited mid-market support",
      evidenceTier: "CONFIRMED",
      sourceUrl: "https://example.com/review",
    },
  ] as BattlecardWeakness[],
  openQuestions: ["What is their pricing for SMBs?"],
  competitor: { name: "Kyriba", tier: "TIER_1" },
};

const confirmedItems = [
  {
    id: "item-1",
    competitorId: "comp-1",
    summary: "Kyriba has high implementation costs",
    evidenceTier: "CONFIRMED",
    type: "PRICING_CHANGE",
    sourceUrl: "https://kyriba.com/pricing",
    detectedAt: new Date(),
    simulated: false,
    competitor: { name: "Kyriba", tier: "TIER_1" },
  },
  {
    id: "item-2",
    competitorId: "comp-1",
    summary: "Kyriba lacks multi-jurisdiction licensing",
    evidenceTier: "CONFIRMED",
    type: "PRODUCT_CHANGE",
    sourceUrl: "https://kyriba.com/compliance",
    detectedAt: new Date(),
    simulated: false,
    competitor: { name: "Kyriba", tier: "TIER_1" },
  },
];

const generatedWeaknesses: BattlecardWeakness[] = [
  {
    text: "High implementation costs make Kyriba prohibitive for mid-market",
    evidenceTier: "CONFIRMED",
    sourceUrl: "https://kyriba.com/pricing",
  },
  {
    text: "No multi-jurisdiction licensing support",
    evidenceTier: "CONFIRMED",
    sourceUrl: "https://kyriba.com/compliance",
  },
];

const mockBattlecardFindUnique = vi.fn().mockResolvedValue(existingBattlecard);
const mockBattlecardUpdate = vi.fn().mockResolvedValue({
  ...existingBattlecard,
  weaknesses: generatedWeaknesses,
});
const mockItemFindMany = vi.fn().mockResolvedValue(confirmedItems);

vi.mock("@/lib/db", () => ({
  prisma: {
    battlecard: {
      findUnique: mockBattlecardFindUnique,
      update: mockBattlecardUpdate,
    },
    intelligenceItem: { findMany: mockItemFindMany },
  },
}));

const mockLLM = {
  synthesize: vi.fn(),
  classify: vi.fn(),
  classifyStructured: vi.fn(),
  generateStructured: vi
    .fn()
    .mockResolvedValue({ weaknesses: generatedWeaknesses }),
};

describe("updateBattlecard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBattlecardFindUnique.mockResolvedValue(existingBattlecard);
    mockBattlecardUpdate.mockResolvedValue({
      ...existingBattlecard,
      weaknesses: generatedWeaknesses,
    });
    mockItemFindMany.mockResolvedValue(confirmedItems);
    mockLLM.generateStructured.mockResolvedValue({
      weaknesses: generatedWeaknesses,
    });
  });

  it("updates battlecard weaknesses based on confirmed evidence", async () => {
    const { updateBattlecard } = await import("../battlecard");
    const result = await updateBattlecard(mockLLM, "comp-1");

    expect(result).toBeDefined();
    expect(result.id).toBe("bc-1");
    expect(result.weaknesses).toHaveLength(2);
    expect(result.weaknesses.every((w) => w.evidenceTier === "CONFIRMED")).toBe(
      true,
    );
  });

  it("queries only CONFIRMED-tier intelligence items for the competitor", async () => {
    const { updateBattlecard } = await import("../battlecard");
    await updateBattlecard(mockLLM, "comp-1");

    expect(mockItemFindMany).toHaveBeenCalledWith({
      where: {
        competitorId: "comp-1",
        evidenceTier: "CONFIRMED",
      },
      include: { competitor: true },
      orderBy: { detectedAt: "desc" },
    });
  });

  it("throws error when battlecard is not found", async () => {
    mockBattlecardFindUnique.mockResolvedValue(null);

    const { updateBattlecard } = await import("../battlecard");
    await expect(updateBattlecard(mockLLM, "nonexistent")).rejects.toThrow(
      "Battlecard not found for competitor: nonexistent",
    );
  });

  it("updates the battlecard in the database", async () => {
    const { updateBattlecard } = await import("../battlecard");
    await updateBattlecard(mockLLM, "comp-1");

    expect(mockBattlecardUpdate).toHaveBeenCalledWith({
      where: { competitorId: "comp-1" },
      data: {
        weaknesses: generatedWeaknesses,
      },
    });
  });

  it("filters out any non-CONFIRMED weaknesses from LLM output", async () => {
    mockLLM.generateStructured.mockResolvedValue({
      weaknesses: [
        ...generatedWeaknesses,
        {
          text: "Possibly losing market share",
          evidenceTier: "INFERRED",
          sourceUrl: "https://example.com",
        },
      ],
    });

    const { updateBattlecard } = await import("../battlecard");
    const result = await updateBattlecard(mockLLM, "comp-1");

    // Should filter out the INFERRED weakness
    expect(result.weaknesses.every((w) => w.evidenceTier === "CONFIRMED")).toBe(
      true,
    );
    expect(result.weaknesses).toHaveLength(2);
  });

  it("does not modify reframes (human-curated)", async () => {
    const { updateBattlecard } = await import("../battlecard");
    await updateBattlecard(mockLLM, "comp-1");

    // Verify that update was called only with weaknesses, not reframes
    const updateCall = mockBattlecardUpdate.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(updateCall.data).not.toHaveProperty("reframes");
  });

  it("returns existing weaknesses when no confirmed items found", async () => {
    mockItemFindMany.mockResolvedValue([]);

    const { updateBattlecard } = await import("../battlecard");
    const result = await updateBattlecard(mockLLM, "comp-1");

    // With no new evidence, LLM is not called
    expect(mockLLM.generateStructured).not.toHaveBeenCalled();
    expect(result.weaknesses).toEqual(existingBattlecard.weaknesses);
  });
});
